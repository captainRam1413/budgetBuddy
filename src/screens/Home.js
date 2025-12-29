import { StyleSheet, Text, View, Pressable, SafeAreaView, Modal, TextInput, ScrollView, Alert, RefreshControl, Linking } from "react-native";
import React from "react";
import tailwind from "twrnc";
import { FlatList } from "react-native";
import ExpenceItemCard from "../components/ExpenceItemCard";
import EmptyList from "../components/EmptyList";
import { useExpense } from "../context/ExpenseContext";
import { useTheme } from "../context/ThemeContext";
import QRScanner from "../components/QRScanner";
import { getId, getDate } from '../helper';
import { expenseAPI } from '../services/api';
const Home = ({ navigation, route }) => {
  const { 
    expenses, 
    totalBudget, 
    getTotalSpending,
    addExpense,
    userData,
    loadUserData,
    isLoading
  } = useExpense();
  
  const { colors } = useTheme();
  const totalSpent = getTotalSpending();
  const budgetRemaining = totalBudget - totalSpent;
  const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showQRScanner, setShowQRScanner] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState({});
  const [upiId, setUpiId] = React.useState('');
  const [fullQrData, setFullQrData] = React.useState(''); // Store full QR data
  const [refreshing, setRefreshing] = React.useState(false);
  const [paymentLoading, setPaymentLoading] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, []);

  // Handle category selection from Category screen
  React.useEffect(() => {
    if (route.params?.item) {
      const { item } = route.params;
      setCategory(item);
      setShowPaymentModal(true);
      // Clear the params after using them
      navigation.setParams({ item: undefined });
    }
  }, [route.params?.item]);

  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  const handleQRScanned = (scannedData) => {
    // scannedData = { displayId: 'merchant@bank', fullData: 'upi://pay?pa=...' }
    if (typeof scannedData === 'object' && scannedData.displayId) {
      setUpiId(scannedData.displayId); // Show only UPI ID in text field
      setFullQrData(scannedData.fullData); // Store full QR data for payment
    } else {
      // Fallback for old format
      setUpiId(scannedData);
      setFullQrData(scannedData);
    }
    setShowQRScanner(false);
  };

  const handleMakePayment = async () => {
    if (!amount || !title || !category.name) {
      Alert.alert("Error", "Please fill all details");
      return;
    }

    if (!upiId) {
      Alert.alert("Error", "Please enter UPI ID or scan QR code");
      return;
    }

    // Validate amount
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    // Check minimum amount (most merchants require at least ₹1)
    if (paymentAmount < 1) {
      Alert.alert("Error", "Amount must be at least ₹1");
      return;
    }

    // Use fullQrData if available (from scan), otherwise use manually entered upiId
    const qrDataToUse = fullQrData || upiId;
    const trimmedData = qrDataToUse.trim();
    
    // Parse UPI QR code to extract all parameters
    let merchantUpiId = '';
    let payeeName = 'UPI Receiver'; // Default fallback if QR doesn't have pn
    
    // Generate unique transaction reference
    const transactionRef = `TXN${Date.now()}`;
    
    if (trimmedData.startsWith('upi://pay')) {
      // Parse the UPI URL query parameters
      const urlParts = trimmedData.split('?');
      if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1]);
        
        // Extract pa (payee UPI ID)
        if (params.get('pa')) {
          merchantUpiId = params.get('pa');
        }
        
        // Extract pn (payee name) - ALWAYS from QR, never hardcode
        if (params.get('pn')) {
          const extractedName = params.get('pn');
          // Only use extracted name if it's not null/undefined/empty
          if (extractedName && extractedName !== 'null' && extractedName.trim() !== '') {
            payeeName = extractedName;
          }
        }
      }
    } else if (trimmedData.includes('@')) {
      // Manual UPI ID entry
      merchantUpiId = trimmedData;
      payeeName = 'UPI Receiver'; // No QR, so use fallback
    } else {
      Alert.alert("Error", "Invalid UPI ID format");
      return;
    }

    // Build transaction note - ensure single line, no newlines, keep it short
    const transactionNote = `${category.name} - ${title}`.replace(/\n/g, ' ').trim();
    
    // Format amount - must be a decimal string with 2 decimal places for UPI
    const formattedAmount = paymentAmount.toFixed(2);

    console.log('=== UPI Payment ===');
    console.log('UPI ID:', merchantUpiId);
    console.log('Payee Name:', payeeName);
    console.log('Amount:', formattedAmount);
    console.log('Transaction Ref:', transactionRef);
    console.log('Transaction Note:', transactionNote);
    
    // Build UPI URL using correct parameter format
    // pa = payee address (UPI ID)
    // pn = payee name
    // am = amount (must be decimal with 2 places)
    // cu = currency (INR)
    // tn = transaction note
    // tr = transaction reference (optional)
    const finalUpiUrl = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(payeeName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${transactionRef}`;
    
    console.log('UPI URL:', finalUpiUrl);
    
    try {
      // Directly open UPI URL without checking - more reliable on Android 11+
      await Linking.openURL(finalUpiUrl);
      
      // After opening UPI app, ask user if payment was successful
      setTimeout(() => {
        Alert.alert(
          "Payment Status",
          "Did you complete the payment? Do you want to save this expense?",
          [
            { text: "No", style: "cancel" },
            { 
              text: "Yes", 
              onPress: async () => {
                setPaymentLoading(true);
                try {
                  const expenseAmount = parseFloat(amount);
                  
                  // Save to backend database
                  const result = await expenseAPI.create(
                    title,
                    expenseAmount,
                    category.name,
                    category.icon,
                    category.color
                  );

                  if (result.success) {
                    // Also update local context for immediate UI update
                    addExpense({ amount, title, category });
                    Alert.alert("Success!", "Payment completed and expense tracked");
                    setAmount('');
                    setTitle('');
                    setCategory({});
                    setUpiId('');
                    setFullQrData('');
                    setShowPaymentModal(false);
                  } else {
                    Alert.alert("Error", result.message || "Failed to save expense to database");
                  }
                } catch (error) {
                  console.error('Save expense error:', error);
                  Alert.alert("Error", "Failed to save expense to database");
                } finally {
                  setPaymentLoading(false);
                }
              }
            }
          ]
        );
      }, 2000);
    } catch (error) {
      console.error('UPI Error:', error);
      Alert.alert(
        "UPI App Not Found", 
        "Please install a UPI payment app (Google Pay, PhonePe, Paytm, etc.) to make payments.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <View style={[tailwind`px-5 py-6`, { backgroundColor: colors.primary }]}>
        <View style={tailwind`flex-row justify-between items-center`}>
          <View>
            <Text style={tailwind`text-white text-base opacity-90`}>Welcome back,</Text>
            <Text style={tailwind`text-white text-2xl font-bold mt-1`}>
              {userData.name || 'User'} 👋
            </Text>
          </View>
          <View style={[tailwind`w-12 h-12 rounded-full items-center justify-center`, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={tailwind`text-2xl`}>👤</Text>
          </View>
        </View>
      </View>

      {/* Budget Overview Card */}
      {totalBudget > 0 ? (
        <View style={[tailwind`mx-5 my-3 p-6 rounded-3xl shadow-lg`, { backgroundColor: colors.surface }]}>
          <View style={tailwind`flex-row justify-between items-center mb-3`}>
            <Text style={[tailwind`text-sm font-semibold`, { color: colors.textSecondary }]}>💰 Monthly Budget</Text>
            <View style={[tailwind`px-3 py-1 rounded-full`, { backgroundColor: budgetRemaining < 0 ? colors.error + '20' : colors.success + '20' }]}>
              <Text style={[tailwind`text-xs font-bold`, { color: budgetRemaining < 0 ? colors.error : colors.success }]}>
                {budgetRemaining < 0 ? '⚠️ Over Budget' : '✓ On Track'}
              </Text>
            </View>
          </View>
          
          <Text style={[tailwind`text-4xl font-bold mb-1`, { color: colors.text }]}>
            ₹{totalBudget.toFixed(2)}
          </Text>
          
          <Text style={[tailwind`text-sm mb-3`, { color: colors.textTertiary }]}>
            Spent ₹{totalSpent.toFixed(2)} • {budgetPercentage.toFixed(0)}% used
          </Text>
          
          {/* Progress Bar */}
          <View style={[tailwind`h-3 rounded-full overflow-hidden mb-3`, { backgroundColor: colors.borderLight }]}>
            <View 
              style={[
                tailwind`h-full rounded-full`,
                { 
                  width: `${Math.min(budgetPercentage, 100)}%`,
                  backgroundColor: budgetPercentage > 90 ? colors.error : budgetPercentage > 70 ? colors.warning : colors.success
                }
              ]} 
            />
          </View>
          
          <View style={tailwind`flex-row justify-between items-center`}>
            <View>
              <Text style={[tailwind`text-xs`, { color: colors.textTertiary }]}>Remaining</Text>
              <Text style={[tailwind`text-lg font-bold`, { color: budgetRemaining < 0 ? colors.error : colors.success }]}>
                ₹{Math.max(budgetRemaining, 0).toFixed(0)}
              </Text>
            </View>
            <View style={tailwind`items-end`}>
              <Text style={[tailwind`text-xs`, { color: colors.textTertiary }]}>Total Expenses</Text>
              <Text style={[tailwind`text-lg font-bold`, { color: colors.text }]}>
                {expenses.length}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={[tailwind`mx-5 my-3 p-6 rounded-3xl shadow-lg items-center`, { backgroundColor: colors.primary }]}>
          <Text style={tailwind`text-sm text-white opacity-90 font-semibold`}>💸 Total Spending</Text>
          <Text style={tailwind`text-5xl text-white font-bold mt-3`}>
            ₹{totalSpent.toFixed(0)}
          </Text>
          <Text style={tailwind`text-white text-sm opacity-80 mt-2`}>
            {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={tailwind`px-5 mb-5 flex-row gap-3`}>
        <Pressable
          style={[tailwind`flex-1 py-5 rounded-2xl shadow-lg flex-row items-center justify-center`, { backgroundColor: colors.primary }]}
          onPress={() => setShowPaymentModal(true)}
        >
          <Text style={tailwind`text-white text-2xl mr-2`}>💳</Text>
          <Text style={tailwind`text-white font-bold text-base`}>Pay Now</Text>
        </Pressable>
        
        <Pressable
          style={[tailwind`flex-1 py-5 rounded-2xl shadow-lg flex-row items-center justify-center`, { backgroundColor: colors.success }]}
          onPress={() => navigation.navigate('Create')}
        >
          <Text style={tailwind`text-white text-2xl mr-2`}>➕</Text>
          <Text style={tailwind`text-white font-bold text-base`}>Add Expense</Text>
        </Pressable>
      </View>

      {/* Expenses List */}
      <View style={tailwind`px-5 mb-3`}>
        <Text style={[tailwind`text-xl font-bold`, { color: colors.text }]}>📋 Recent Expenses</Text>
      </View>

      <FlatList
        data={expenses}
        renderItem={({ item }) => <ExpenceItemCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 20 }}
        ListEmptyComponent={<EmptyList />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={[tailwind`flex-1 justify-end`, { backgroundColor: colors.overlay }]}>
          <View style={[tailwind`rounded-t-3xl p-6`, { backgroundColor: colors.surface, maxHeight: '90%' }]}>
            <View style={tailwind`flex-row justify-between items-center mb-6`}>
              <Text style={[tailwind`text-2xl font-bold`, { color: colors.text }]}>Make Payment</Text>
              <Pressable onPress={() => setShowPaymentModal(false)}>
                <Text style={[tailwind`text-2xl`, { color: colors.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Amount */}
              <View style={tailwind`mb-4`}>
                <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>💵 Amount *</Text>
                <TextInput 
                  placeholder="₹0.00" 
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                  style={[tailwind`p-4 rounded-xl text-lg border-2`, { 
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                    color: colors.text
                  }]} 
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* Title */}
              <View style={tailwind`mb-4`}>
                <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>📝 Description *</Text>
                <TextInput 
                  placeholder="e.g., Grocery Shopping" 
                  placeholderTextColor={colors.placeholder}
                  style={[tailwind`p-4 rounded-xl text-lg border-2`, { 
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                    color: colors.text
                  }]} 
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Category */}
              <View style={tailwind`mb-4`}>
                <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>📂 Category *</Text>
                <Pressable 
                  onPress={() => {
                    setShowPaymentModal(false);
                    navigation.navigate("Category", { fromScreen: "Home" });
                  }}
                  style={[tailwind`p-4 rounded-xl border-2 flex-row justify-between items-center`, { 
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder
                  }]}
                >
                  <Text style={[tailwind`text-lg`, { color: category.name ? colors.text : colors.placeholder }]}>
                    {category.name ? `${category.icon} ${category.name}` : 'Select Category'}
                  </Text>
                  <Text style={[tailwind`text-lg`, { color: colors.textSecondary }]}>›</Text>
                </Pressable>
              </View>

              {/* UPI ID */}
              <View style={tailwind`mb-4`}>
                <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>💳 UPI ID *</Text>
                <View style={tailwind`flex-row gap-2`}>
                  <TextInput 
                    placeholder="user@upi" 
                    placeholderTextColor={colors.placeholder}
                    style={[tailwind`flex-1 p-4 rounded-xl text-base border-2`, { 
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text
                    }]} 
                    value={upiId}
                    onChangeText={setUpiId}
                  />
                  <Pressable
                    style={[tailwind`px-4 py-2 rounded-xl justify-center`, { backgroundColor: colors.primary }]}
                    onPress={handleScanQR}
                  >
                    <Text style={tailwind`text-white font-bold`}>📷 Scan</Text>
                  </Pressable>
                </View>
              </View>

              {/* Pay Button */}
              <Pressable
                style={[tailwind`py-4 rounded-2xl mt-4`, { backgroundColor: colors.primary }]}
                onPress={handleMakePayment}
              >
                <Text style={tailwind`text-white font-bold text-center text-lg`}>
                  Make Payment ₹{amount || '0'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <QRScanner 
          onScan={handleQRScanned}
          onClose={() => setShowQRScanner(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({});
