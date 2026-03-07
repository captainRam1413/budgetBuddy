import { StyleSheet, Text, View, Pressable, SafeAreaView, Modal, TextInput, ScrollView, Alert, RefreshControl, Linking, Animated } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import React from "react";
import tailwind from "twrnc";
import { FlatList } from "react-native";
import ExpenceItemCard from "../components/ExpenceItemCard";
import EmptyList from "../components/EmptyList";
import { useExpense } from "../context/ExpenseContext";
import { useTheme } from "../context/ThemeContext";
import QRScanner from "../components/QRScanner";
import { getId, getDate } from '../helper';
import { initiateQrPayment, initiateManualPayment, showPaymentConfirmation } from '../services/paymentService';
const Home = ({ navigation, route }) => {
  const {
    expenses,
    totalBudget,
    getTotalSpending,
    budgetPeriod,
    getExpensesForCurrentPeriod,
    addExpense,
    userData,
    loadUserData,
    isLoading,
    categoryBudgets,
    getCategorySpending
  } = useExpense();

  const { colors } = useTheme();
  const periodExpenses = getExpensesForCurrentPeriod();
  const totalSpent = getTotalSpending(true); // Use current period
  const budgetRemaining = totalBudget - totalSpent;
  const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Track if we've already warned the user this session to prevent spamming alerts
  const [hasWarned80, setHasWarned80] = React.useState(false);
  const [hasWarned100, setHasWarned100] = React.useState(false);

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

    // Reset warnings on manual refresh in case they want updates
    setHasWarned80(false);
    setHasWarned100(false);

    setRefreshing(false);
  }, []);

  // Budget Notification Logic
  React.useEffect(() => {
    if (totalBudget > 0) {
      if (budgetPercentage >= 100 && !hasWarned100) {
        Alert.alert(
          "🚨 Budget Exceeded!",
          `You have completely run out of your ${budgetPeriod} budget. You've spent ₹${totalSpent.toFixed(0)} out of ₹${totalBudget.toFixed(0)}.`,
          [{ text: "Understood" }]
        );
        setHasWarned100(true);
      } else if (budgetPercentage >= 80 && budgetPercentage < 100 && !hasWarned80) {
        Alert.alert(
          "⚠️ Approaching Budget Limit",
          `You have used ${budgetPercentage.toFixed(0)}% of your ${budgetPeriod} budget. Only ₹${budgetRemaining.toFixed(0)} remaining!`,
          [{ text: "Got it" }]
        );
        setHasWarned80(true);
      }
    }
  }, [budgetPercentage, totalBudget, hasWarned80, hasWarned100, budgetPeriod]);

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
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount greater than 0");
      return;
    }

    // Check if adding this expense would exceed the category budget (current period only)
    const categoryBudget = categoryBudgets[category.name] || 0;
    if (categoryBudget > 0) {
      const currentPeriodSpent = getCategorySpending(category.name, true);
      if (currentPeriodSpent + paymentAmount > categoryBudget) {
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

    const qrDataToUse = fullQrData || upiId;

    // Determine if this is QR payment or manual payment
    const isQrPayment = qrDataToUse.startsWith('upi://pay');

    const handlePaymentSuccess = () => {
      showPaymentConfirmation(
        async () => {
          // User confirmed payment - save expense via context (handles DB write)
          setPaymentLoading(true);
          try {
            await addExpense({
              amount: paymentAmount,
              title,
              category,
            });
            Alert.alert("Success!", "Payment completed and expense tracked");
            setAmount('');
            setTitle('');
            setCategory({});
            setUpiId('');
            setFullQrData('');
            setShowPaymentModal(false);
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
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tailwind`px-5 py-6 rounded-b-3xl shadow-lg`}
        >
          <View style={tailwind`flex-row justify-between items-center`}>
            <View>
              <Text style={tailwind`text-white text-base opacity-90`}>Welcome back,</Text>
              <Text style={tailwind`text-white text-2xl font-bold mt-1`}>
                {userData.name || 'User'} 👋
              </Text>
            </View>
            <View style={[tailwind`w-12 h-12 rounded-full items-center justify-center border border-white/20`, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Text style={tailwind`text-2xl`}>👤</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Budget Overview Card */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {totalBudget > 0 ? (
          <View style={[tailwind`mx-5 my-3 p-6 rounded-3xl shadow-lg`, { backgroundColor: colors.surface }]}>
            <View style={tailwind`flex-row justify-between items-center mb-3`}>
              <Text style={[tailwind`text-sm font-semibold`, { color: colors.textSecondary }]}>
                💰 {budgetPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Budget
              </Text>
              <View style={[tailwind`px-3 py-1 rounded-full`, { backgroundColor: budgetRemaining < 0 ? colors.error + '20' : colors.success + '20' }]}>
                <Text style={[tailwind`text-xs font-bold`, { color: budgetRemaining < 0 ? colors.error : colors.success }]}>
                  {budgetRemaining < 0 ? '⚠️ Over Budget' : '✓ On Track'}
                </Text>
              </View>
            </View>

            <Text style={[tailwind`text-4xl font-bold mb-1 tracking-tight`, { color: colors.text }]}>
              ₹{totalBudget.toFixed(2)}
            </Text>

            <Text style={[tailwind`text-sm mb-3 font-medium`, { color: colors.textTertiary }]}>
              Spent ₹{totalSpent.toFixed(2)} • {budgetPercentage.toFixed(0)}% used
            </Text>

            {/* Progress Bar */}
            <View style={[tailwind`h-4 rounded-full overflow-hidden mb-4`, { backgroundColor: colors.borderLight }]}>
              <LinearGradient
                colors={budgetPercentage > 90 ? [colors.error, '#EF4444'] : budgetPercentage > 70 ? [colors.warning, '#F59E0B'] : [colors.success, '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: `${Math.min(budgetPercentage, 100)}%`,
                  height: '100%',
                  borderRadius: 20
                }}
              />
            </View>

            <View style={tailwind`flex-row justify-between items-center`}>
              <View>
                <Text style={[tailwind`text-xs font-medium`, { color: colors.textTertiary }]}>Remaining</Text>
                <Text style={[tailwind`text-lg font-bold`, { color: budgetRemaining < 0 ? colors.error : colors.success }]}>
                  ₹{Math.max(budgetRemaining, 0).toFixed(0)}
                </Text>
              </View>
              <View style={tailwind`items-end`}>
                <Text style={[tailwind`text-xs font-medium`, { color: colors.textTertiary }]}>
                  {budgetPeriod === 'weekly' ? 'This Week' : 'This Month'}
                </Text>
                <Text style={[tailwind`text-lg font-bold`, { color: colors.text }]}>
                  {periodExpenses.length} expenses
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[tailwind`mx-5 my-3 p-6 rounded-3xl shadow-lg items-center`, { backgroundColor: colors.primary }]}>
            <Text style={tailwind`text-sm text-white opacity-90 font-semibold`}>💸 Total Spending</Text>
            <Text style={tailwind`text-5xl text-white font-bold mt-3 tracking-tight`}>
              ₹{totalSpent.toFixed(0)}
            </Text>
            <Text style={tailwind`text-white text-sm opacity-80 mt-2 font-medium`}>
              {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View style={[tailwind`px-5 mb-6 flex-row gap-4`, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Pressable
          style={({ pressed }) => [
            tailwind`flex-1 rounded-3xl shadow-lg overflow-hidden`,
            { transform: [{ scale: pressed ? 0.96 : 1 }], elevation: 4 }
          ]}
          onPress={() => setShowPaymentModal(true)}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tailwind`py-4.5 flex-row items-center justify-center`}
          >
            <View style={[tailwind`w-10 h-10 rounded-full items-center justify-center mr-3`, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={tailwind`text-xl`}>💳</Text>
            </View>
            <Text style={tailwind`text-white font-bold text-lg`}>Pay Now</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            tailwind`flex-1 rounded-3xl shadow-lg overflow-hidden`,
            { transform: [{ scale: pressed ? 0.96 : 1 }], elevation: 4 }
          ]}
          onPress={() => navigation.navigate('Create')}
        >
          <LinearGradient
            colors={[colors.success || '#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tailwind`py-4.5 flex-row items-center justify-center`}
          >
            <View style={[tailwind`w-10 h-10 rounded-full items-center justify-center mr-3`, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={tailwind`text-xl`}>➕</Text>
            </View>
            <Text style={tailwind`text-white font-bold text-lg`}>Expense</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Expenses List */}
      <Animated.View style={[tailwind`px-5 mb-3`, { opacity: fadeAnim }]}>
        <View style={tailwind`flex-row justify-between items-center`}>
          <Text style={[tailwind`text-xl font-bold`, { color: colors.text }]}>
            📋 {budgetPeriod === 'weekly' ? 'This Week' : 'This Month'}
          </Text>
          <Text style={[tailwind`text-sm font-semibold`, { color: colors.textSecondary }]}>
            {periodExpenses.length} expenses
          </Text>
        </View>
      </Animated.View>

      <FlatList
        data={periodExpenses}
        renderItem={({ item, index }) => <ExpenceItemCard item={item} index={index} />}
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
