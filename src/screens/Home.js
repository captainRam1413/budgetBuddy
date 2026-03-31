import { StyleSheet, Text, View, Pressable, SafeAreaView, Modal, TextInput, ScrollView, Alert, RefreshControl, Linking, Animated, Easing } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import React from "react";
import { useFocusEffect } from '@react-navigation/native';
import tailwind from "twrnc";
import { FlatList } from "react-native";
import ExpenceItemCard from "../components/ExpenceItemCard";
import EmptyList from "../components/EmptyList";
import { useExpense } from "../context/ExpenseContext";
import { useTheme } from "../context/ThemeContext";
import QRScanner from "../components/QRScanner";
import { getId, getDate } from '../helper';
import { initiateQrPayment, initiateManualPayment, showPaymentConfirmation } from '../services/paymentService';
import { SkeletonLoader, CardSkeleton, StatCardSkeleton } from '../components/SkeletonLoader';
import AnimatedCard from '../components/AnimatedCard';
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
  
  // CRITICAL: Ensure all numeric values are actual numbers, not strings
  // This prevents "java.lang.String cannot be cast to java.lang.Double" errors
  const totalSpentRaw = getTotalSpending(true);
  const totalSpent = Number(totalSpentRaw) || 0;
  const totalBudgetNum = Number(totalBudget) || 0;
  
  // Defensive calculation with explicit Number() wrapping and fallbacks
  const budgetRemainingCalc = totalBudgetNum - totalSpent;
  const budgetRemaining = Number.isFinite(budgetRemainingCalc) ? budgetRemainingCalc : 0;
  
  const budgetPercentageCalc = totalBudgetNum > 0 ? (totalSpent / totalBudgetNum) * 100 : 0;
  const budgetPercentage = Number.isFinite(budgetPercentageCalc) ? budgetPercentageCalc : 0;

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
    console.log('🔄 Manual refresh triggered - reloading data from backend...');
    
    // Reload all data from backend
    await loadUserData(true);

    // Reset warnings on manual refresh
    setHasWarned80(false);
    setHasWarned100(false);

    console.log('✅ Refresh complete - all data reloaded and calculations updated');
    setRefreshing(false);
  }, [loadUserData]);

  // Budget Notification Logic
  React.useEffect(() => {
    if (totalBudgetNum > 0) {
      if (budgetPercentage >= 100 && !hasWarned100) {
        Alert.alert(
          "🚨 Budget Exceeded!",
          `You have completely run out of your ${budgetPeriod} budget. You've spent ₹${totalSpent.toFixed(0)} out of ₹${totalBudgetNum.toFixed(0)}.`,
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
  }, [budgetPercentage, totalBudgetNum, hasWarned80, hasWarned100, budgetPeriod]);

  // Enhanced Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const headerScale = React.useRef(new Animated.Value(0.9)).current;
  const statsSlide = React.useRef(new Animated.Value(50)).current;
  const cardsSlide = React.useRef(new Animated.Value(30)).current;

  // Run sophisticated entrance animations on mount
  React.useEffect(() => {
    // Pulse animation for budget card
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered entrance animations
    Animated.stagger(100, [
      Animated.parallel([
        Animated.spring(headerScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(statsSlide, {
        toValue: 0,
        friction: 9,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.spring(cardsSlide, {
        toValue: 0,
        friction: 9,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Force recalculation when key data changes
  React.useEffect(() => {
    // Log recalculation for debugging
    console.log('📊 Home calculations updated:', {
      expenses: expenses.length,
      totalBudget: totalBudgetNum,
      totalSpent,
      budgetRemaining,
      budgetPercentage: budgetPercentage.toFixed(1) + '%'
    });
  }, [expenses.length, totalBudgetNum, totalSpent]);

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
    const categoryBudget = Number(categoryBudgets[category.name]) || 0;
    if (categoryBudget > 0) {
      const currentPeriodSpent = Number(getCategorySpending(category.name, true)) || 0;
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

  // Calculate financial insights with defensive type checking
  const daysInPeriod = budgetPeriod === 'weekly' ? 7 : 30;
  const dailyBudgetCalc = totalBudgetNum > 0 ? totalBudgetNum / daysInPeriod : 0;
  const dailyBudget = Number.isFinite(dailyBudgetCalc) ? dailyBudgetCalc : 0;
  
  const dailySpentCalc = periodExpenses.length > 0 ? totalSpent / Math.max(periodExpenses.length, 1) : 0;
  const dailySpent = Number.isFinite(dailySpentCalc) ? dailySpentCalc : 0;
  
  // Calculate actual days remaining in current budget period
  const calculateDaysRemaining = () => {
    const now = new Date();
    
    if (budgetPeriod === 'weekly') {
      // Calculate days until end of week (Sunday)
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      return Math.max(1, daysUntilSunday); // At least 1 day
    } else {
      // Calculate days until end of month
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const currentDay = now.getDate();
      const daysUntilEndOfMonth = lastDayOfMonth - currentDay + 1; // +1 to include today
      return Math.max(1, daysUntilEndOfMonth);
    }
  };
  
  const daysRemaining = calculateDaysRemaining();
  const safeToSpendCalc = totalBudgetNum > 0 ? Math.max(0, budgetRemaining / daysRemaining) : 0;
  const safeToSpend = Number.isFinite(safeToSpendCalc) ? safeToSpendCalc : 0;
  
  const avgDailySpendingCalc = periodExpenses.length > 0 ? totalSpent / Math.max(periodExpenses.length, 1) : 0;
  const avgDailySpending = Number.isFinite(avgDailySpendingCalc) ? avgDailySpendingCalc : 0;

  // Show skeleton loaders while loading
  if (isLoading) {
    return (
      <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Skeleton */}
          <View style={[tailwind`px-6 pt-6 pb-8`, { backgroundColor: colors.primary }]}>
            <View style={tailwind`flex-row justify-between items-center mb-6`}>
              <View style={tailwind`flex-1`}>
                <SkeletonLoader width="40%" height={14} style={tailwind`mb-2`} />
                <SkeletonLoader width="60%" height={24} />
              </View>
              <SkeletonLoader width={56} height={56} borderRadius={16} />
            </View>
            <View style={[tailwind`p-5 rounded-3xl`, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <SkeletonLoader width="50%" height={14} style={tailwind`mb-2`} />
              <SkeletonLoader width="70%" height={40} style={tailwind`mb-2`} />
              <SkeletonLoader width="80%" height={12} />
            </View>
          </View>

          {/* Stats Skeleton */}
          <View style={tailwind`px-6 -mt-6 mb-4`}>
            <View style={tailwind`flex-row gap-3 mb-4`}>
              <StatCardSkeleton />
              <StatCardSkeleton />
            </View>
          </View>

          {/* Cards Skeleton */}
          <View style={tailwind`px-6`}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Enhanced Modern Header with Scale Animation */}
        <Animated.View style={{ 
          opacity: fadeAnim, 
          transform: [
            { translateY: slideAnim },
            { scale: headerScale }
          ] 
        }}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tailwind`px-6 pt-6 pb-8`}
          >
            <View style={tailwind`flex-row justify-between items-center mb-6`}>
              <View style={tailwind`flex-1`}>
                <Animated.Text style={[tailwind`text-white text-sm opacity-80 font-medium`, { opacity: fadeAnim }]}>
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},
                </Animated.Text>
                <Animated.Text style={[tailwind`text-white text-3xl font-bold mt-1`, { opacity: fadeAnim }]}>
                  {userData.name || 'User'} 👋
                </Animated.Text>
              </View>
              <Pressable 
                onPress={() => navigation.navigate('Profile')}
                style={({ pressed }) => [
                  tailwind`w-14 h-14 rounded-2xl items-center justify-center`,
                  { 
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    transform: [{ scale: pressed ? 0.9 : 1 }]
                  }
                ]}
              >
                <Text style={tailwind`text-3xl`}>👤</Text>
              </Pressable>
            </View>

            {/* Safe to Spend Card - Animated Glassmorphism with Pulse */}
            {totalBudgetNum > 0 && (
              <Animated.View style={[
                tailwind`p-5 rounded-3xl`,
                { 
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  transform: [{ scale: pulseAnim }]
                }
              ]}>
                <Text style={tailwind`text-white text-sm font-semibold mb-2 opacity-90`}>💰 Safe to Spend Today</Text>
                <Text style={tailwind`text-white text-5xl font-bold tracking-tight`}>
                  ₹{safeToSpend.toFixed(0)}
                </Text>
                <Text style={tailwind`text-white text-sm mt-2 opacity-80`}>
                  Daily budget: ₹{dailyBudget.toFixed(0)} • {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                </Text>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Financial Insights Grid with Staggered Animation */}
        <Animated.View style={[
          tailwind`px-6 -mt-6 mb-4`,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: statsSlide }]
          }
        ]}>
          <View style={tailwind`flex-row gap-3`}>
            {/* Spent This Period Card */}
            <View style={[tailwind`flex-1 p-4 rounded-2xl shadow-md`, { backgroundColor: colors.surface }]}>
              <View style={[tailwind`w-10 h-10 rounded-xl items-center justify-center mb-3`, { backgroundColor: budgetPercentage > 90 ? colors.error + '15' : colors.primary + '15' }]}>
                <Text style={tailwind`text-xl`}>{budgetPercentage > 90 ? '⚠️' : '💸'}</Text>
              </View>
              <Text style={[tailwind`text-sm font-medium mb-1`, { color: colors.textSecondary }]}>Spent</Text>
              <Text style={[tailwind`text-2xl font-bold`, { color: colors.text }]}>₹{totalSpent.toFixed(0)}</Text>
              <Text style={[tailwind`text-xs mt-1 font-medium`, { color: budgetPercentage > 90 ? colors.error : colors.textTertiary }]}>
                {budgetPercentage.toFixed(0)}% of budget
              </Text>
            </View>

            {/* Average Daily Spending Card */}
            <View style={[tailwind`flex-1 p-4 rounded-2xl shadow-md`, { backgroundColor: colors.surface }]}>
              <View style={[tailwind`w-10 h-10 rounded-xl items-center justify-center mb-3`, { backgroundColor: colors.success + '15' }]}>
                <Text style={tailwind`text-xl`}>📊</Text>
              </View>
              <Text style={[tailwind`text-sm font-medium mb-1`, { color: colors.textSecondary }]}>Daily Avg</Text>
              <Text style={[tailwind`text-2xl font-bold`, { color: colors.text }]}>₹{avgDailySpending.toFixed(0)}</Text>
              <Text style={[tailwind`text-xs mt-1 font-medium`, { color: colors.textTertiary }]}>
                {periodExpenses.length} transactions
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Budget Progress Card */}
        {totalBudgetNum > 0 && (
          <Animated.View style={[
            tailwind`mx-6 mb-4 p-5 rounded-2xl shadow-lg`,
            { 
              backgroundColor: colors.surface,
              opacity: fadeAnim
            }
          ]}>
            <View style={tailwind`flex-row justify-between items-center mb-4`}>
              <View>
                <Text style={[tailwind`text-xs font-semibold mb-1`, { color: colors.textSecondary }]}>
                  {budgetPeriod === 'weekly' ? 'WEEKLY' : 'MONTHLY'} BUDGET
                </Text>
                <Text style={[tailwind`text-3xl font-bold`, { color: colors.text }]}>
                  ₹{totalBudgetNum.toFixed(0)}
                </Text>
              </View>
              <View style={[
                tailwind`px-3 py-2 rounded-lg`,
                { backgroundColor: budgetRemaining < 0 ? colors.error + '20' : colors.success + '20' }
              ]}>
                <Text style={[tailwind`text-xs font-bold`, { color: budgetRemaining < 0 ? colors.error : colors.success }]}>
                  {budgetRemaining < 0 ? '⚠️ EXCEEDED' : '✓ ON TRACK'}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={tailwind`mb-4`}>
              <View style={[tailwind`h-3 rounded-full overflow-hidden`, { backgroundColor: colors.borderLight }]}>
                <View style={{
                  width: `${Math.min(budgetPercentage, 100)}%`,
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: budgetPercentage > 90 ? colors.error : budgetPercentage > 70 ? colors.warning : colors.success
                }} />
              </View>
              <View style={tailwind`flex-row justify-between mt-2`}>
                <View>
                  <Text style={[tailwind`text-xs font-medium`, { color: colors.textTertiary }]}>Spent</Text>
                  <Text style={[tailwind`text-sm font-bold mt-0.5`, { color: colors.text }]}>₹{totalSpent.toFixed(0)}</Text>
                </View>
                <View style={tailwind`items-end`}>
                  <Text style={[tailwind`text-xs font-medium`, { color: budgetRemaining < 0 ? colors.error : colors.success }]}>
                    {budgetRemaining < 0 ? 'Over' : 'Left'}
                  </Text>
                  <Text style={[tailwind`text-sm font-bold mt-0.5`, { color: budgetRemaining < 0 ? colors.error : colors.success }]}>
                    ₹{Math.abs(budgetRemaining).toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Budget Breakdown */}
            <View style={[tailwind`pt-4 border-t flex-row justify-between`, { borderColor: colors.border }]}>
              <View>
                <Text style={[tailwind`text-xs font-medium mb-1`, { color: colors.textTertiary }]}>Remaining</Text>
                <Text style={[tailwind`text-xl font-bold`, { color: budgetRemaining < 0 ? colors.error : colors.success }]}>
                  ₹{Math.max(budgetRemaining, 0).toFixed(0)}
                </Text>
              </View>
              <View style={tailwind`items-end`}>
                <Text style={[tailwind`text-xs font-medium mb-1`, { color: colors.textTertiary }]}>Transactions</Text>
                <Text style={[tailwind`text-xl font-bold`, { color: colors.text }]}>
                  {periodExpenses.length}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* No Budget Set */}
        {totalBudgetNum <= 0 && (
          <Animated.View style={[tailwind`mx-6 mb-4`, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark || '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={tailwind`p-6 rounded-3xl shadow-lg items-center`}
            >
              <Text style={tailwind`text-white text-lg font-bold mb-2`}>💸 Total Spending</Text>
              <Text style={tailwind`text-white text-6xl font-bold tracking-tight`}>
                ₹{totalSpent.toFixed(0)}
              </Text>
              <Text style={tailwind`text-white text-sm mt-3 opacity-90`}>
                {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
              </Text>
              <Pressable 
                onPress={() => navigation.navigate('Profile')}
                style={[tailwind`mt-5 px-6 py-3 rounded-xl`, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
              >
                <Text style={tailwind`text-white font-bold`}>Set a Budget →</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View style={[
          tailwind`px-6 mb-5`,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: cardsSlide }]
          }
        ]}>
          <View style={tailwind`flex-row justify-between items-center mb-3`}>
            <Text style={[tailwind`text-xl font-bold`, { color: colors.text }]}>Quick Actions</Text>
            <Text style={tailwind`text-xl`}>⚡</Text>
          </View>

          <View style={tailwind`flex-row gap-3 mb-3`}>
            <Pressable
              style={({ pressed }) => [
                tailwind`flex-1 rounded-2xl shadow-lg overflow-hidden`,
                { transform: [{ scale: pressed ? 0.96 : 1 }] }
              ]}
              onPress={() => setShowPaymentModal(true)}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tailwind`p-5`}
              >
                <View style={[tailwind`w-12 h-12 rounded-xl items-center justify-center mb-3`, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={tailwind`text-2xl`}>💳</Text>
                </View>
                <Text style={[tailwind`text-white font-bold mb-1`, { fontSize: 16 }]}>Pay via UPI</Text>
                <Text style={[tailwind`text-white text-xs`, { opacity: 0.85 }]}>QR or UPI ID</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                tailwind`flex-1 rounded-2xl shadow-lg overflow-hidden`,
                { transform: [{ scale: pressed ? 0.96 : 1 }] }
              ]}
              onPress={() => navigation.navigate('Create')}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tailwind`p-5`}
              >
                <View style={[tailwind`w-12 h-12 rounded-xl items-center justify-center mb-3`, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={tailwind`text-2xl`}>➕</Text>
                </View>
                <Text style={[tailwind`text-white font-bold mb-1`, { fontSize: 16 }]}>Add Expense</Text>
                <Text style={[tailwind`text-white text-xs`, { opacity: 0.85 }]}>Manual entry</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Secondary Actions */}
          <View style={tailwind`flex-row gap-3`}>
            <Pressable
              style={({ pressed }) => [
                tailwind`flex-1 p-4 rounded-2xl shadow-md flex-row items-center`,
                { 
                  backgroundColor: colors.surface,
                  transform: [{ scale: pressed ? 0.96 : 1 }]
                }
              ]}
              onPress={() => navigation.navigate('Insights')}
            >
              <View style={[tailwind`w-10 h-10 rounded-xl items-center justify-center mr-3`, { backgroundColor: colors.primary + '20' }]}>
                <Text style={tailwind`text-xl`}>📈</Text>
              </View>
              <View>
                <Text style={[tailwind`text-sm font-bold`, { color: colors.text }]}>Insights</Text>
                <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>View Analytics</Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                tailwind`flex-1 p-4 rounded-2xl shadow-md flex-row items-center`,
                { 
                  backgroundColor: colors.surface,
                  transform: [{ scale: pressed ? 0.96 : 1 }]
                }
              ]}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[tailwind`w-10 h-10 rounded-xl items-center justify-center mr-3`, { backgroundColor: colors.success + '20' }]}>
                <Text style={tailwind`text-xl`}>⚙️</Text>
              </View>
              <View>
                <Text style={[tailwind`text-sm font-bold`, { color: colors.text }]}>Settings</Text>
                <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>Manage Profile</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View style={[tailwind`px-6 mb-3`, { opacity: fadeAnim }]}>
          <View style={tailwind`flex-row justify-between items-center`}>
            <View>
              <Text style={[tailwind`text-lg font-bold`, { color: colors.text }]}>Recent Transactions</Text>
              <Text style={[tailwind`text-xs mt-0.5`, { color: colors.textSecondary }]}>
                {budgetPeriod === 'weekly' ? 'This Week' : 'This Month'} • {periodExpenses.length} total
              </Text>
            </View>
            {periodExpenses.length > 0 && (
              <Pressable onPress={() => navigation.navigate('Insights')}>
                <Text style={[tailwind`text-sm font-bold`, { color: colors.primary }]}>View All →</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {periodExpenses.length > 0 ? (
          <View style={tailwind`px-6 pb-6`}>
            {periodExpenses.slice(0, 10).map((item, index) => (
              <ExpenceItemCard key={item.id.toString()} item={item} index={index} />
            ))}
          </View>
        ) : (
          <View style={tailwind`px-6 pb-6`}>
            <EmptyList />
          </View>
        )}
      </ScrollView>

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
