import { ScrollView, StyleSheet, Text, View, TextInput, Pressable, Alert, Modal, SafeAreaView, ActivityIndicator, Linking } from 'react-native'
import React from 'react'
import tailwind from 'twrnc'
import { useExpense } from '../context/ExpenseContext'
import { useTheme } from '../context/ThemeContext'
import QRScanner from '../components/QRScanner'
import { expenseAPI } from '../services/api'

const Create = ({navigation, route}) => {
  const [amount, setAmount] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState({});
  const [qrCode, setQrCode] = React.useState('');
  const [fullQrData, setFullQrData] = React.useState(''); // Store full QR data
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showQRScanner, setShowQRScanner] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { addExpense, expenses, categoryBudgets, userData } = useExpense();
  const { colors } = useTheme();
 
  React.useEffect(() => {
    if (route.params?.item) {
      const { item } = route.params;
      console.log("Selected category:", item);
      setCategory(route.params?.item);
    }
  }, [route.params?.item]);

  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  const handleQRScanned = (scannedData) => {
    // scannedData = { displayId: 'merchant@bank', fullData: 'upi://pay?pa=...' }
    if (typeof scannedData === 'object' && scannedData.displayId) {
      setQrCode(scannedData.displayId); // Show only UPI ID in text field
      setFullQrData(scannedData.fullData); // Store full QR data for payment
      Alert.alert("Success", `UPI ID scanned: ${scannedData.displayId}`);
    } else {
      // Fallback for old format
      setQrCode(scannedData);
      setFullQrData(scannedData);
      Alert.alert("Success", `UPI ID scanned: ${scannedData}`);
    }
  };

  const handleInitiatePayment = () => {
    if (!amount || !title || !category.name) {
      Alert.alert("Error", "Please fill Amount, Title, and Category first");
      return;
    }
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!qrCode) {
      Alert.alert("Error", "Please enter UPI ID/QR code");
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

    setShowPaymentModal(false);

    // Use fullQrData if available (from scan), otherwise use manually entered qrCode
    const qrDataToUse = fullQrData || qrCode;
    const trimmedData = qrDataToUse.trim();
    
    // Parse UPI QR code to extract all parameters
    let upiId = '';
    let payeeName = 'UPI Receiver'; // Default fallback if QR doesn't have pn
    
    if (trimmedData.startsWith('upi://pay')) {
      // Parse the UPI URL query parameters
      const urlParts = trimmedData.split('?');
      if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1]);
        
        // Extract pa (payee UPI ID)
        if (params.get('pa')) {
          upiId = params.get('pa');
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
      upiId = trimmedData;
      payeeName = 'UPI Receiver'; // No QR, so use fallback
    } else {
      Alert.alert("Error", "Invalid UPI ID format");
      return;
    }

    // Generate unique transaction reference
    const transactionRef = `TXN${Date.now()}`;
    
    // Build transaction note - ensure single line, no newlines, keep it short
    const transactionNote = `${category.name} - ${title}`.replace(/\n/g, ' ').trim();
    
    // Format amount - use integer if it's a whole number, otherwise 2 decimals
    const formattedAmount = paymentAmount % 1 === 0 ? paymentAmount.toString() : paymentAmount.toFixed(2);

    console.log('=== UPI Payment ===');
    console.log('UPI ID:', upiId);
    console.log('Payee Name:', payeeName);
    console.log('Amount:', formattedAmount);
    console.log('Transaction Ref:', transactionRef);
    console.log('Transaction Note:', transactionNote);
    
    // Build UPI URL - keep it simple and clean
    // Using minimal required parameters to avoid UPI app rejection
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    console.log('UPI URL:', upiUrl);
    
    try {
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (canOpen) {
        await Linking.openURL(upiUrl);
        
        // After opening UPI app, ask user if they want to save
        setTimeout(() => {
          Alert.alert(
            "Save Expense?",
            "Did you complete the payment? Do you want to save this expense?",
            [
              { text: "No", style: "cancel" },
              { 
                text: "Yes, Save", 
                onPress: async () => {
                  setLoading(true);
                  try {
                    const expenseAmount = parseFloat(amount);
                    
                    // Save to backend
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
                      Alert.alert("Saved!", "Expense tracked successfully");
                      setAmount('');
                      setTitle('');
                      setQrCode('');
                      setFullQrData('');
                      navigation.goBack();
                    } else {
                      Alert.alert("Error", result.message || "Failed to save expense");
                    }
                  } catch (error) {
                    console.error('Save expense error:', error);
                    Alert.alert("Error", "Failed to save expense to database");
                  } finally {
                    setLoading(false);
                  }
                }
              }
            ]
          );
        }, 2000);
      } else {
        Alert.alert("Error", "No UPI app found. Please install a UPI app like GPay or PhonePe.");
      }
    } catch (error) {
      console.error('UPI Error:', error);
      Alert.alert("Error", "Could not open UPI app");
    }
  };

  const handleSaveOnly = async () => {
    if (!amount || !title || !category.name) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    // Get current spending for this category
    const categoryExpenses = expenses.filter(exp => exp.category === category.name);
    const currentSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryBudget = categoryBudgets[category.name] || 0;
    const expenseAmount = parseFloat(amount);

    // Check if adding this expense would exceed the category budget
    if (categoryBudget > 0 && (currentSpent + expenseAmount) > categoryBudget) {
      const remaining = categoryBudget - currentSpent;
      Alert.alert(
        "Budget Exceeded",
        "This expense would exceed your " + category.name + " budget.\n\n" +
        "Budget: Rs." + categoryBudget.toFixed(2) + "\n" +
        "Spent: Rs." + currentSpent.toFixed(2) + "\n" +
        "Remaining: Rs." + remaining.toFixed(2) + "\n\n" +
        "Please enter an amount up to Rs." + remaining.toFixed(2)
      );
      return;
    }

    setLoading(true);
    try {
      // Save to backend
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
        
        Alert.alert(
          "Success", 
          title + " - Rs." + amount + " added to " + category.name,
          [{ text: "OK", onPress: () => {
            setAmount('');
            setTitle('');
            setQrCode('');
            navigation.goBack();
          }}]
        );
      } else {
        Alert.alert("Error", result.message || "Failed to save expense");
      }
    } catch (error) {
      console.error('Save expense error:', error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryInput = () => {
    navigation.navigate("Category");
  }

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={tailwind`p-6`}>
        {/* Header */}
        <View style={tailwind`mb-8`}>
          <Text style={[tailwind`text-3xl font-bold mb-2`, { color: colors.text }]}>New Expense</Text>
          <Text style={[tailwind`text-base`, { color: colors.textSecondary }]}>
            Track your spending quickly
          </Text>
        </View>

        {/* Amount */}
        <View style={tailwind`mb-5`}>
          <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>💵 Amount</Text>
          <TextInput 
            placeholder="₹0.00" 
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            style={[tailwind`p-4 rounded-2xl text-lg shadow-sm`, { 
              backgroundColor: colors.input,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text
            }]} 
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Title */}
        <View style={tailwind`mb-5`}>
          <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>📝 Description</Text>
          <TextInput 
            placeholder="e.g., Grocery Shopping" 
            placeholderTextColor={colors.placeholder}
            style={[tailwind`p-4 rounded-2xl text-lg shadow-sm`, { 
              backgroundColor: colors.input,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text
            }]} 
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Category */}
        <View style={tailwind`mb-8`}>
          <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>📊 Category</Text>
          <Pressable 
            onPress={handleCategoryInput}
            style={[tailwind`p-4 rounded-2xl flex-row justify-between items-center shadow-sm`, {
              backgroundColor: colors.input,
              borderWidth: 1,
              borderColor: colors.border
            }]}
          >
            <View style={tailwind`flex-row items-center`}>
              <View style={[tailwind`w-10 h-10 rounded-xl items-center justify-center mr-3`, { backgroundColor: category.color ? category.color + '30' : colors.border }]}>
                <Text style={tailwind`text-xl`}>{category.icon || '🎯'}</Text>
              </View>
              <Text style={[tailwind`text-base font-semibold`, { color: category.name ? colors.text : colors.placeholder }]}>{category.name || 'Select Category'}</Text>
            </View>
            <Text style={[tailwind`text-xl`, { color: colors.textSecondary }]}>›</Text>
          </Pressable>
        </View>

        {/* Save Only Button */}
        <Pressable
          style={[tailwind`p-5 rounded-2xl mb-3 shadow-lg`, { backgroundColor: colors.primary }]}
          onPress={handleSaveOnly}
        >
          <Text style={tailwind`text-white text-lg font-bold text-center`}>
            💾 Save Expense
          </Text>
        </Pressable>

        {/* Payment Button */}
        <Pressable
          style={[tailwind`p-5 rounded-2xl shadow-lg`, { backgroundColor: colors.success }]}
          onPress={handleInitiatePayment}
        >
          <Text style={tailwind`text-white text-lg font-bold text-center`}>
            💳 Pay & Save
          </Text>
        </Pressable>

        <Text style={[tailwind`text-xs text-center mt-4`, { color: colors.textTertiary }]}>
          Payment opens UPI apps like Google Pay, PhonePe, Paytm
        </Text>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={[tailwind`flex-1 justify-end`, { backgroundColor: colors.overlay }]}>
          <View style={[tailwind`rounded-t-3xl p-6`, { backgroundColor: colors.surface }]}>
            <Text style={[tailwind`text-2xl font-bold mb-4`, { color: colors.text }]}>
              Payment Details
            </Text>

            {/* Payment Summary */}
            <View style={[tailwind`p-4 rounded-xl mb-4`, { backgroundColor: colors.borderLight }]}>
              <View style={tailwind`flex-row justify-between mb-2`}>
                <Text style={[tailwind``, { color: colors.textSecondary }]}>Amount:</Text>
                <Text style={[tailwind`font-bold text-lg`, { color: colors.text }]}>₹{amount}</Text>
              </View>
              <View style={tailwind`flex-row justify-between mb-2`}>
                <Text style={[tailwind``, { color: colors.textSecondary }]}>For:</Text>
                <Text style={[tailwind`font-semibold`, { color: colors.text }]}>{title}</Text>
              </View>
              <View style={tailwind`flex-row justify-between`}>
                <Text style={[tailwind``, { color: colors.textSecondary }]}>Category:</Text>
                <Text style={[tailwind`font-semibold`, { color: colors.text }]}>{category.icon} {category.name}</Text>
              </View>
            </View>

            {/* UPI ID Input */}
            <Text style={[tailwind`text-lg font-semibold mb-2`, { color: colors.textSecondary }]}>
              Enter UPI ID or Scan QR
            </Text>
            <View style={tailwind`flex-row gap-2 mb-4`}>
              <TextInput 
                placeholder="example@paytm" 
                placeholderTextColor={colors.placeholder}
                style={[tailwind`flex-1 p-4 rounded-xl border-2`, { 
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                  color: colors.text
                }]} 
                value={qrCode}
                onChangeText={setQrCode}
                autoCapitalize="none"
              />
              <Pressable
                style={[tailwind`px-4 rounded-xl justify-center items-center`, { backgroundColor: colors.info }]}
                onPress={handleScanQR}
              >
                <Text style={tailwind`text-3xl`}>📷</Text>
                <Text style={tailwind`text-white text-xs font-bold`}>Scan</Text>
              </Pressable>
            </View>

            {/* Action Buttons */}
            <View style={tailwind`flex-row gap-3`}>
              <Pressable
                style={[tailwind`flex-1 p-4 rounded-xl`, { backgroundColor: colors.border }]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={[tailwind`font-bold text-center`, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[tailwind`flex-1 p-4 rounded-xl`, { backgroundColor: colors.success }]}
                onPress={handleConfirmPayment}
              >
                <Text style={tailwind`text-white font-bold text-center`}>Pay Now</Text>
              </Pressable>
            </View>
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
  )
}

export default Create

const styles = StyleSheet.create({})