import { ScrollView, StyleSheet, Text, View, TextInput, Pressable, Alert, Modal, SafeAreaView, ActivityIndicator, Linking } from 'react-native'
import React from 'react'
import tailwind from 'twrnc'
import { useExpense } from '../context/ExpenseContext'
import { useTheme } from '../context/ThemeContext'
import QRScanner from '../components/QRScanner'
import { expenseAPI } from '../services/appwriteAPI'
import { initiateQrPayment, initiateManualPayment, showPaymentConfirmation } from '../services/paymentService'

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

    setShowPaymentModal(false);

    const paymentAmount = parseFloat(amount);
    const qrDataToUse = fullQrData || qrCode;

    // Determine if this is QR payment or manual payment
    const isQrPayment = qrDataToUse.startsWith('upi://pay');

    const handlePaymentSuccess = () => {
      showPaymentConfirmation(
        async () => {
          // User confirmed payment - save expense
          setLoading(true);
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