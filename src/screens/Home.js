import { StyleSheet, Text, View, Pressable, SafeAreaView, Modal, TextInput, Alert, RefreshControl } from "react-native";
import React from "react";
import tailwind from "twrnc";
import { FlatList } from "react-native";
import ExpenceItemCard from "../components/ExpenceItemCard";
import EmptyList from "../components/EmptyList";
import { useExpense } from "../context/ExpenseContext";
import { useTheme } from "../context/ThemeContext";
import QRScanner from "../components/QRScanner";
import { expenseAPI } from '../services/api';
import { initiateQrPayment, initiateManualPayment, showPaymentConfirmation } from '../services/paymentService';
import { SCREENS } from '../constant';
import { formatCurrency } from '../helper';
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

    const paymentAmount = parseFloat(amount);
    const qrDataToUse = fullQrData || upiId;

    // Determine if this is QR payment or manual payment
    const isQrPayment = qrDataToUse.startsWith('upi://pay');

    const handlePaymentSuccess = () => {
      showPaymentConfirmation(
        async () => {
          // User confirmed payment - save expense
          setPaymentLoading(true);
          try {
            const result = await expenseAPI.create(
              title,
              paymentAmount,
              category.name,
              category.icon,
              category.color
            );

            if (result.success) {
              addExpense({ amount, title, category });
              Alert.alert("Success!", "Payment completed and expense tracked");
              setAmount('');
              setTitle('');
              setCategory({});
              setUpiId('');
              setFullQrData('');
              setShowPaymentModal(false);
            } else {
              Alert.alert("Error", result.message || "Failed to save expense");
            }
          } catch (error) {
            console.error('Save expense error:', error);
            Alert.alert("Error", "Failed to save expense to database");
          } finally {
            setPaymentLoading(false);
          }
        },
        () => {
          // User cancelled - do nothing
          console.log('User cancelled saving expense');
        }
      );
    };

    const handlePaymentError = (error) => {
      Alert.alert("Payment Error", error.message || "Failed to initiate payment");
    };

    if (isQrPayment) {
      // QR Payment
      await initiateQrPayment(
        {
          qrData: qrDataToUse,
          amount: paymentAmount,
          title,
          category: category.name,
        },
        handlePaymentSuccess,
        handlePaymentError
      );
    } else {
      // Manual UPI ID Payment
      await initiateManualPayment(
        {
          upiId: qrDataToUse,
          amount: paymentAmount,
          title,
          category: category.name,
        },
        handlePaymentSuccess,
        handlePaymentError
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
            {formatCurrency(totalBudget, 2)}
          </Text>
          
          <Text style={[tailwind`text-sm mb-3`, { color: colors.textTertiary }]}>
            Spent {formatCurrency(totalSpent, 2)} • {budgetPercentage.toFixed(0)}% used
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
                {formatCurrency(Math.max(budgetRemaining, 0))}
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
            {formatCurrency(totalSpent)}
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
          onPress={() => navigation.navigate(SCREENS.CREATE)}
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
                    navigation.navigate(SCREENS.CATEGORY, { fromScreen: SCREENS.HOME });
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
