import { ScrollView, StyleSheet, Text, View, TextInput, Pressable, Alert, Modal, SafeAreaView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Animated } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient';
import tailwind from 'twrnc'
import { useExpense } from '../context/ExpenseContext'
import { useTheme } from '../context/ThemeContext'
import QRScanner from '../components/QRScanner'
import SmsScannerModal from '../components/SmsScannerModal'
import { initiateQrPayment, initiateManualPayment, showPaymentConfirmation } from '../services/paymentService'

const Create = ({ navigation, route }) => {
  const [amount, setAmount] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState({});
  const [qrCode, setQrCode] = React.useState('');
  const [fullQrData, setFullQrData] = React.useState(''); // Store full QR data
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showQRScanner, setShowQRScanner] = React.useState(false);
  const [showSmsScanner, setShowSmsScanner] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { addExpense, categoryBudgets, getCategorySpending, importExpenses } = useExpense();
  const { colors } = useTheme();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  // Run entrance animation on mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  React.useEffect(() => {
    if (route.params?.item) {
      const { item, preservedAmount, preservedTitle } = route.params;
      console.log("Selected category:", item);
      setCategory(item);
      // Restore preserved data if available
      if (preservedAmount !== undefined) {
        setAmount(preservedAmount);
      }
      if (preservedTitle !== undefined) {
        setTitle(preservedTitle);
      }
    }
  }, [route.params?.item, route.params?.preservedAmount, route.params?.preservedTitle]);

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

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount greater than 0");
      return;
    }

    // Check if adding this expense would exceed the category budget (current period only)
    const categoryBudget = categoryBudgets[category.name] || 0;
    if (categoryBudget > 0) {
      const currentPeriodSpent = getCategorySpending(category.name, true);
      if (currentPeriodSpent + expenseAmount > categoryBudget) {
        const remaining = categoryBudget - currentPeriodSpent;
        Alert.alert(
          "Budget Exceeded",
          `This expense would exceed your ${category.name} budget.\n\n` +
          `Budget: ₹${categoryBudget.toFixed(2)}\n` +
          `Spent this period: ₹${currentPeriodSpent.toFixed(2)}\n` +
          `Remaining: ₹${Math.max(remaining, 0).toFixed(2)}\n\n` +
          `Please enter an amount up to ₹${Math.max(remaining, 0).toFixed(2)}`
        );
        return;
      }
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
          // User confirmed payment - save expense via context (handles DB write)
          setLoading(true);
          try {
            await addExpense({ amount: parseFloat(amount), title, category });
            Alert.alert("Saved!", "Payment completed and expense tracked");
            setAmount('');
            setTitle('');
            setQrCode('');
            setFullQrData('');
            setShowPaymentModal(false);
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

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount greater than 0");
      return;
    }

    // Check if adding this expense would exceed the category budget (current period only)
    const categoryBudget = categoryBudgets[category.name] || 0;
    if (categoryBudget > 0) {
      const currentPeriodSpent = getCategorySpending(category.name, true);
      if (currentPeriodSpent + expenseAmount > categoryBudget) {
        const remaining = categoryBudget - currentPeriodSpent;
        Alert.alert(
          "Budget Exceeded",
          `This expense would exceed your ${category.name} budget.\n\n` +
          `Budget: ₹${categoryBudget.toFixed(2)}\n` +
          `Spent this period: ₹${currentPeriodSpent.toFixed(2)}\n` +
          `Remaining: ₹${Math.max(remaining, 0).toFixed(2)}\n\n` +
          `Please enter an amount up to ₹${Math.max(remaining, 0).toFixed(2)}`
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Save via context which handles DB write
      await addExpense({ amount: expenseAmount, title, category });

      Alert.alert(
        "Success",
        `${title} - ₹${amount} added to ${category.name}`,
        [{
          text: "OK", onPress: () => {
            setAmount('');
            setTitle('');
            setQrCode('');
            navigation.goBack();
          }
        }]
      );
    } catch (error) {
      console.error('Save expense error:', error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryInput = () => {
    navigation.navigate("Category", {
      fromScreen: 'Create',
      preservedAmount: amount,
      preservedTitle: title
    });
  }

  const handleImportSms = async (expensesArray) => {
    setLoading(true);
    setShowSmsScanner(false);
    try {
      if (importExpenses) {
        await importExpenses(expensesArray);
      } else {
        // Fallback
        for (const exp of expensesArray) {
          await addExpense(exp);
        }
      }
      Alert.alert(
        "Success", 
        `${expensesArray.length} expense(s) parsed and imported from SMS!`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert("Error", "Failed to import SMS expenses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tailwind`flex-1`}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={tailwind`p-6 pb-24`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View style={[tailwind`mb-8`, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={[tailwind`text-4xl font-bold mb-2 tracking-tight`, { color: colors.text }]}>New Expense</Text>
            <Text style={[tailwind`text-base font-medium`, { color: colors.textSecondary }]}>
              Track your spending quickly
            </Text>
          </Animated.View>

          {/* Amount */}
          <View style={tailwind`mb-5`}>
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>💵 Amount</Text>
            <TextInput
              placeholder="₹0.00"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
              style={[tailwind`p-4 rounded-2xl text-lg shadow-sm`, {
                backgroundColor: colors.input,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={amount}
              onChangeText={setAmount}
            />
            {amount && parseFloat(amount) > 0 && (
              <Text style={[tailwind`text-xs mt-1`, { color: colors.success || '#10b981' }]}>✓ Amount entered: ₹{parseFloat(amount).toFixed(2)}</Text>
            )}
          </View>

          {/* Title */}
          <View style={tailwind`mb-5`}>
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>📝 Description</Text>
            <TextInput
              placeholder="e.g., Grocery Shopping"
              placeholderTextColor={colors.placeholder}
              returnKeyType="done"
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

          {/* Action Buttons */}
          <Animated.View style={[tailwind`gap-4 mt-2 mb-6`, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Scan SMS Button */}
            <Pressable
              style={({ pressed }) => [
                tailwind`rounded-3xl shadow-lg overflow-hidden`,
                { transform: [{ scale: pressed ? 0.96 : 1 }], elevation: 4 }
              ]}
              onPress={() => setShowSmsScanner(true)}
              disabled={loading}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                style={tailwind`p-5 flex-row items-center justify-center`}
              >
                <Text style={tailwind`text-2xl mr-3`}>✉️</Text>
                <Text style={tailwind`text-white text-lg font-bold tracking-wide`}>
                  Scan SMS For Expenses
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Save Only Button */}
            <Pressable
              style={({ pressed }) => [
                tailwind`rounded-3xl shadow-lg overflow-hidden`,
                { transform: [{ scale: pressed ? 0.96 : 1 }], elevation: 4 }
              ]}
              onPress={handleSaveOnly}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark || '#4f46e5']}
                style={tailwind`p-5 flex-row items-center justify-center`}
              >
                <Text style={tailwind`text-2xl mr-3`}>💾</Text>
                <Text style={tailwind`text-white text-lg font-bold tracking-wide`}>
                  {loading ? 'Saving...' : 'Save Expense'}
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Payment Button */}
            <Pressable
              style={({ pressed }) => [
                tailwind`rounded-3xl shadow-lg overflow-hidden`,
                { transform: [{ scale: pressed ? 0.96 : 1 }], elevation: 4 }
              ]}
              onPress={handleInitiatePayment}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.success || '#10B981', '#059669']}
                style={tailwind`p-5 flex-row items-center justify-center`}
              >
                <Text style={tailwind`text-2xl mr-3`}>💳</Text>
                <Text style={tailwind`text-white text-lg font-bold tracking-wide`}>Pay & Save</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Animated.Text style={[tailwind`text-xs text-center font-medium mt-2`, { color: colors.textTertiary, opacity: fadeAnim }]}>
            Payment opens UPI apps like Google Pay, PhonePe, Paytm
          </Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[tailwind`flex-1 justify-end`, { backgroundColor: colors.overlay }]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <TouchableWithoutFeedback>
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
                  {/* Action Buttons */}
                  <View style={tailwind`flex-row gap-3 mt-4`}>
                    <Pressable
                      style={[tailwind`flex-1 p-4 rounded-xl border border-gray-200`, { backgroundColor: colors.surface }]}
                      onPress={() => setShowPaymentModal(false)}
                    >
                      <Text style={[tailwind`font-bold text-center`, { color: colors.text }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        tailwind`flex-1 rounded-xl shadow-md overflow-hidden`,
                        { transform: [{ scale: pressed ? 0.98 : 1 }] }
                      ]}
                      onPress={handleConfirmPayment}
                    >
                      <LinearGradient
                        colors={[colors.success, '#059669']}
                        style={tailwind`p-4 items-center justify-center`}
                      >
                        <Text style={tailwind`text-white font-bold text-center`}>Pay Now</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
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

      {/* SMS Scanner Modal */}
      <SmsScannerModal 
        visible={showSmsScanner}
        onClose={() => setShowSmsScanner(false)}
        onImport={handleImportSms}
      />
    </SafeAreaView>
  )
}

export default Create

const styles = StyleSheet.create({})