import { StyleSheet, Text, View, ScrollView, SafeAreaView, Pressable, Animated } from 'react-native'
import React, { useMemo, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient';
import { useExpense } from '../context/ExpenseContext'
import { useTheme } from '../context/ThemeContext'
import tailwind from 'twrnc'

const Insights = () => {
  const {
    expenses,
    totalBudget,
    getCategoryBudgetStatus,
    budgetPeriod,
    getExpensesForCurrentPeriod,
    getTotalSpending
  } = useExpense()
  const { colors, isDarkMode } = useTheme()

  // Period selection state
  const [selectedPeriodOffset, setSelectedPeriodOffset] = useState(0) // 0 = current, -1 = previous, etc.

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  // Run entrance animation on mount and when period changes
  React.useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim, selectedPeriodOffset]);

  // Get the date range for selected period
  const getSelectedPeriodRange = () => {
    const now = new Date()
    let startDate, endDate

    if (budgetPeriod === 'weekly') {
      // Calculate week start (Monday)
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() + diff + (selectedPeriodOffset * 7))
      weekStart.setHours(0, 0, 0, 0)

      startDate = weekStart
      endDate = new Date(weekStart)
      endDate.setDate(weekStart.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Monthly
      const monthStart = new Date(now.getFullYear(), now.getMonth() + selectedPeriodOffset, 1)
      monthStart.setHours(0, 0, 0, 0)

      startDate = monthStart
      endDate = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
    }

    return { startDate, endDate }
  }

  const { startDate, endDate } = getSelectedPeriodRange()

  // Filter expenses for selected period (excluding income/credit)
  const periodExpenses = useMemo(() => {
    const start = startDate.getTime()
    const end = endDate.getTime()

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date).getTime()

      // Check if it's income/credit
      const isIncome =
        expense.type === 'credit' ||
        ['income', 'salary', 'deposit', 'credit'].includes(expense.category?.toLowerCase() || '') ||
        expense.category === 'Income';

      return expenseDate >= start && expenseDate <= end && !isIncome
    })
  }, [expenses, startDate, endDate])

  // Filter income/credit for selected period
  const periodIncome = useMemo(() => {
    const start = startDate.getTime()
    const end = endDate.getTime()

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date).getTime()

      const isIncome =
        expense.type === 'credit' ||
        ['income', 'salary', 'deposit', 'credit'].includes(expense.category?.toLowerCase() || '') ||
        expense.category === 'Income';

      return expenseDate >= start && expenseDate <= end && isIncome
    })
  }, [expenses, startDate, endDate])

  const periodSpent = useMemo(() => {
    return periodExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0)
  }, [periodExpenses])

  const totalPeriodIncome = useMemo(() => {
    return periodIncome.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0)
  }, [periodIncome])

  // Format period display
  const getPeriodLabel = () => {
    if (selectedPeriodOffset === 0) {
      return budgetPeriod === 'weekly' ? 'This Week' : 'This Month'
    }

    if (budgetPeriod === 'weekly') {
      const options = { month: 'short', day: 'numeric' }
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
    } else {
      return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  }

  // Calculate period analytics
  const periodAnalytics = useMemo(() => {
    const daysInPeriod = budgetPeriod === 'weekly' ? 7 : 30
    const dailyAverage = periodExpenses.length > 0 ? periodSpent / daysInPeriod : 0
    const remaining = totalBudget - periodSpent
    const savingsRate = totalBudget > 0 ? (remaining / totalBudget) * 100 : 0
    const utilizationRate = totalBudget > 0 ? (periodSpent / totalBudget) * 100 : 0

    return {
      spent: periodSpent,
      remaining: Math.max(remaining, 0),
      savings: remaining > 0 ? remaining : 0,
      overBudget: remaining < 0 ? Math.abs(remaining) : 0,
      dailyAverage,
      savingsRate: Math.max(savingsRate, 0),
      utilizationRate: Math.min(utilizationRate, 100),
      transactionCount: periodExpenses.length,
      daysInPeriod,
      isOverBudget: remaining < 0
    }
  }, [periodExpenses, periodSpent, totalBudget, budgetPeriod])

  // Calculate category-wise spending (period-specific)
  const categoryStats = useMemo(() => {
    const stats = {}
    let total = 0

    periodExpenses.forEach(expense => {
      const amount = parseFloat(expense.amount) || 0
      total += amount

      if (stats[expense.category]) {
        stats[expense.category].amount += amount
        stats[expense.category].count += 1
      } else {
        stats[expense.category] = {
          amount: amount,
          count: 1,
          color: expense.color,
          icon: expense.icon
        }
      }
    })

    // Convert to array and add percentage + budget info
    const categoryArray = Object.keys(stats).map(category => {
      const budgetStatus = getCategoryBudgetStatus(category, true);
      const categoryAmount = stats[category].amount;

      // Calculate percentage: if budget exists, show % of budget used, otherwise % of total spending
      let percentage;
      if (budgetStatus.budget > 0) {
        percentage = (categoryAmount / budgetStatus.budget) * 100;
      } else {
        percentage = total > 0 ? (categoryAmount / total) * 100 : 0;
      }

      return {
        name: category,
        amount: categoryAmount,
        count: stats[category].count,
        color: stats[category].color,
        icon: stats[category].icon,
        percentage: percentage,
        budget: budgetStatus.budget,
        budgetRemaining: budgetStatus.remaining,
        isOverBudget: budgetStatus.isOverBudget
      };
    })

    // Sort by amount (highest first)
    categoryArray.sort((a, b) => b.amount - a.amount)

    return { categories: categoryArray, total }
  }, [periodExpenses, getCategoryBudgetStatus])

  if (periodExpenses.length === 0) {
    return (
      <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
        <ScrollView style={[tailwind`flex-1`, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || '#4f46e5']}
            style={tailwind`p-6 pb-12 rounded-b-3xl shadow-lg`}
          >
            <Text style={tailwind`text-3xl font-bold text-white`}>Insights</Text>
            <Text style={tailwind`text-white opacity-90 mt-1`}>
              {budgetPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Budget Analysis
            </Text>
          </LinearGradient>

          {/* Period Selector */}
          <View style={[tailwind`mx-5 -mt-8 mb-3 p-4 rounded-2xl shadow-lg`, { backgroundColor: colors.surface }]}>
            <View style={tailwind`flex-row items-center justify-between`}>
              <Pressable
                onPress={() => setSelectedPeriodOffset(selectedPeriodOffset - 1)}
                style={[tailwind`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: colors.primary + '20' }]}
              >
                <Text style={[tailwind`text-xl font-bold`, { color: colors.primary }]}>‹</Text>
              </Pressable>

              <View style={tailwind`flex-1 mx-3 items-center`}>
                <Text style={[tailwind`text-xs font-semibold mb-1`, { color: colors.textSecondary }]}>
                  {budgetPeriod === 'weekly' ? '📆 Week' : '📅 Month'}
                </Text>
                <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>
                  {getPeriodLabel()}
                </Text>
                {selectedPeriodOffset !== 0 && (
                  <Pressable
                    onPress={() => setSelectedPeriodOffset(0)}
                    style={[tailwind`mt-2 px-3 py-1 rounded-full`, { backgroundColor: colors.primary + '20' }]}
                  >
                    <Text style={[tailwind`text-xs font-semibold`, { color: colors.primary }]}>Back to Current</Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => setSelectedPeriodOffset(selectedPeriodOffset + 1)}
                disabled={selectedPeriodOffset >= 0}
                style={[tailwind`w-10 h-10 rounded-full items-center justify-center`, {
                  backgroundColor: selectedPeriodOffset >= 0 ? colors.border : colors.primary + '20',
                  opacity: selectedPeriodOffset >= 0 ? 0.5 : 1
                }]}
              >
                <Text style={[tailwind`text-xl font-bold`, { color: colors.primary }]}>›</Text>
              </Pressable>
            </View>
          </View>

            {/* Empty State */}
            <Animated.View style={[tailwind`flex-1 justify-center items-center p-8 mt-12`, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={tailwind`text-6xl mb-4`}>📊</Text>
              <Text style={[tailwind`text-xl font-bold mb-2`, { color: colors.text }]}>
                No expenses for {getPeriodLabel()}
              </Text>
              <Text style={[tailwind`text-base text-center mb-4`, { color: colors.textSecondary }]}>
                {selectedPeriodOffset === 0
                  ? 'Add some expenses to see your spending insights'
                : 'Try selecting a different period or add new expenses'
              }
            </Text>
            {expenses.length > 0 && (
              <View style={[tailwind`mt-4 p-4 rounded-xl`, { backgroundColor: colors.info + '20' }]}>
                <Text style={[tailwind`text-sm text-center`, { color: colors.info }]}>
                  💡 You have {expenses.length} total expense{expenses.length > 1 ? 's' : ''} in other periods
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <ScrollView style={[tailwind`flex-1`, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark || '#4f46e5']}
          style={tailwind`p-6 pb-12 rounded-b-3xl shadow-lg`}
        >
          <Text style={tailwind`text-3xl font-bold text-white`}>Insights</Text>
          <Text style={tailwind`text-white opacity-90 mt-1`}>
            {budgetPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Budget Analysis
          </Text>
        </LinearGradient>

        {/* Period Selector */}
        <View style={[tailwind`mx-5 -mt-8 mb-3 p-4 rounded-2xl shadow-lg`, { backgroundColor: colors.surface }]}>
          <View style={tailwind`flex-row items-center justify-between`}>
            <Pressable
              onPress={() => setSelectedPeriodOffset(selectedPeriodOffset - 1)}
              style={[tailwind`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: colors.primary + '20' }]}
            >
              <Text style={[tailwind`text-xl font-bold`, { color: colors.primary }]}>‹</Text>
            </Pressable>

            <View style={tailwind`flex-1 mx-3 items-center`}>
              <Text style={[tailwind`text-xs font-semibold mb-1`, { color: colors.textSecondary }]}>
                {budgetPeriod === 'weekly' ? '📆 Week' : '📅 Month'}
              </Text>
              <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>
                {getPeriodLabel()}
              </Text>
              {selectedPeriodOffset !== 0 && (
                <Pressable
                  onPress={() => setSelectedPeriodOffset(0)}
                  style={[tailwind`mt-2 px-3 py-1 rounded-full`, { backgroundColor: colors.primary + '20' }]}
                >
                  <Text style={[tailwind`text-xs font-semibold`, { color: colors.primary }]}>Back to Current</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => setSelectedPeriodOffset(selectedPeriodOffset + 1)}
              disabled={selectedPeriodOffset >= 0}
              style={[tailwind`w-10 h-10 rounded-full items-center justify-center`, {
                backgroundColor: selectedPeriodOffset >= 0 ? colors.border : colors.primary + '20',
                opacity: selectedPeriodOffset >= 0 ? 0.5 : 1
              }]}
            >
              <Text style={[tailwind`text-xl font-bold`, { color: colors.primary }]}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* Period Overview Cards */}
        <View style={tailwind`mx-5 mb-6`}>
          {/* Main Budget Card */}
          <View style={[tailwind`p-6 rounded-3xl shadow-lg mb-3`, {
            backgroundColor: periodAnalytics.isOverBudget ? colors.error : colors.surface
          }]}>
            <View style={tailwind`flex-row items-center justify-between mb-4`}>
              <View style={tailwind`flex-1`}>
                <Text style={[tailwind`text-sm font-semibold mb-1`, {
                  color: periodAnalytics.isOverBudget ? 'rgba(255,255,255,0.9)' : colors.textSecondary
                }]}>
                  {selectedPeriodOffset === 0
                    ? (budgetPeriod === 'weekly' ? '📆 This Week' : '📅 This Month')
                    : (budgetPeriod === 'weekly' ? '📆 Week' : '📅 Month')
                  }
                </Text>
                <Text style={[tailwind`text-4xl font-bold`, {
                  color: periodAnalytics.isOverBudget ? '#fff' : colors.text
                }]}>
                  ₹{periodAnalytics.spent.toFixed(0)}
                </Text>
                <Text style={[tailwind`text-xs mt-1`, {
                  color: periodAnalytics.isOverBudget ? 'rgba(255,255,255,0.8)' : colors.textTertiary
                }]}>
                  of ₹{totalBudget.toFixed(0)} budget
                </Text>
              </View>
              <View style={[tailwind`w-20 h-20 rounded-full items-center justify-center`, {
                backgroundColor: periodAnalytics.isOverBudget ? 'rgba(255,255,255,0.2)' : colors.primary + '20'
              }]}>
                <Text style={[tailwind`text-xl font-bold`, {
                  color: periodAnalytics.isOverBudget ? '#fff' : colors.primary
                }]}>
                  {periodAnalytics.utilizationRate.toFixed(0)}%
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={[tailwind`h-3 rounded-full overflow-hidden mb-3`, {
              backgroundColor: periodAnalytics.isOverBudget ? 'rgba(255,255,255,0.3)' : colors.borderLight
            }]}>
              <View style={[tailwind`h-full`, {
                width: `${Math.min(periodAnalytics.utilizationRate, 100)}%`,
                backgroundColor: periodAnalytics.isOverBudget ? '#fff' :
                  periodAnalytics.utilizationRate > 80 ? colors.warning : colors.success
              }]} />
            </View>

            <View style={tailwind`flex-row justify-between`}>
              <Text style={[tailwind`text-xs font-semibold`, {
                color: periodAnalytics.isOverBudget ? 'rgba(255,255,255,0.9)' : colors.textSecondary
              }]}>
                {periodAnalytics.transactionCount} expenses
              </Text>
              <Text style={[tailwind`text-xs font-semibold`, {
                color: periodAnalytics.isOverBudget ? '#fff' :
                  periodAnalytics.isOverBudget ? colors.error : colors.success
              }]}>
                {periodAnalytics.isOverBudget ?
                  `₹${periodAnalytics.overBudget.toFixed(0)} over budget` :
                  `₹${periodAnalytics.savings.toFixed(0)} remaining`
                }
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={tailwind`flex-row gap-3`}>
            <View style={[tailwind`flex-1 p-4 rounded-2xl`, { backgroundColor: colors.surface }]}>
              <Text style={tailwind`text-2xl mb-2`}>💰</Text>
              <Text style={[tailwind`text-xl font-bold`, { color: colors.text }]}>
                ₹{periodAnalytics.dailyAverage.toFixed(0)}
              </Text>
              <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>Daily Avg</Text>
            </View>

            <View style={[tailwind`flex-1 p-4 rounded-2xl`, {
              backgroundColor: periodAnalytics.savingsRate > 50 ? colors.success + '20' : colors.warning + '20'
            }]}>
              <Text style={tailwind`text-2xl mb-2`}>
                {periodAnalytics.savingsRate > 50 ? '📈' : '📉'}
              </Text>
              <Text style={[tailwind`text-xl font-bold`, {
                color: periodAnalytics.savingsRate > 50 ? colors.success : colors.warning
              }]}>
                {periodAnalytics.savingsRate.toFixed(0)}%
              </Text>
              <Text style={[tailwind`text-xs`, {
                color: periodAnalytics.savingsRate > 50 ? colors.success : colors.warning
              }]}>
                {periodAnalytics.isOverBudget ? 'Over Spent' : 'Saved'}
              </Text>
            </View>
          </View>
        </View>

        {/* Budget Summary */}
        {totalBudget > 0 && (
          <View style={[tailwind`mx-5 p-4 rounded-2xl mb-6`, { backgroundColor: colors.surface }]}>
            <Text style={[tailwind`text-base font-bold mb-3`, { color: colors.text }]}>
              💼 Budget Summary
            </Text>
            <View style={tailwind`gap-2`}>
              <View style={tailwind`flex-row justify-between`}>
                <Text style={[tailwind`text-sm`, { color: colors.textSecondary }]}>Total Budget</Text>
                <Text style={[tailwind`text-sm font-bold`, { color: colors.text }]}>₹{totalBudget.toFixed(0)}</Text>
              </View>
              <View style={tailwind`flex-row justify-between`}>
                <Text style={[tailwind`text-sm`, { color: colors.textSecondary }]}>Spent</Text>
                <Text style={[tailwind`text-sm font-bold`, { color: colors.error }]}>- ₹{periodAnalytics.spent.toFixed(0)}</Text>
              </View>
              <View style={[tailwind`h-px`, { backgroundColor: colors.border }]} />
              <View style={tailwind`flex-row justify-between`}>
                <Text style={[tailwind`text-sm font-bold`, { color: colors.text }]}>
                  {periodAnalytics.isOverBudget ? 'Over Budget' : 'Remaining / Savings'}
                </Text>
                <Text style={[tailwind`text-sm font-bold`, {
                  color: periodAnalytics.isOverBudget ? colors.error : colors.success
                }]}>
                  {periodAnalytics.isOverBudget ? '- ' : ''}₹{(periodAnalytics.isOverBudget ? periodAnalytics.overBudget : periodAnalytics.savings).toFixed(0)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Total Spending Card (All Time) */}
        <View style={[tailwind`mx-5 p-5 rounded-2xl shadow-sm mb-6`, { backgroundColor: colors.border }]}>
          <View style={tailwind`flex-row items-center justify-between`}>
            <View>
              <Text style={[tailwind`text-xs font-semibold mb-1`, { color: colors.textSecondary }]}>
                📊 All Time Total
              </Text>
              <Text style={[tailwind`text-3xl font-bold`, { color: colors.text }]}>
                ₹{expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toFixed(0)}
              </Text>
              <Text style={[tailwind`text-xs mt-1`, { color: colors.textSecondary }]}>
                {expenses.length} total transactions
              </Text>
            </View>
            <Text style={tailwind`text-4xl`}>💸</Text>
          </View>
        </View>

        {/* Credit Analysis (Income) Card - Green Theme */}
        {totalPeriodIncome > 0 && (
          <View style={[
            tailwind`mx-5 p-5 rounded-2xl mb-6`,
            {
              backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              zIndex: 10
            }
          ]}>
            <View style={tailwind`flex-row items-center justify-between`}>
              <View style={tailwind`flex-row items-center flex-1`}>
                <View style={[tailwind`w-12 h-12 rounded-full items-center justify-center mr-4`, { backgroundColor: isDarkMode ? '#047857' : '#10B981' }]}>
                  <Text style={[tailwind`text-2xl`, { color: '#FFFFFF' }]}>💰</Text>
                </View>
                <View>
                  <Text style={[tailwind`text-xs font-bold uppercase tracking-wide mb-1`, { color: isDarkMode ? '#A7F3D0' : '#047857' }]}>
                    Income & Credits
                  </Text>
                  <Text style={[tailwind`text-2xl font-bold`, { color: isDarkMode ? '#ECFDF5' : '#064E3B' }]}>
                    +₹{totalPeriodIncome.toFixed(0)}
                  </Text>
                </View>
              </View>
              <View style={[tailwind`px-3 py-1.5 rounded-lg`, { backgroundColor: isDarkMode ? '#065F46' : '#A7F3D0' }]}>
                <Text style={[tailwind`text-xs font-bold`, { color: isDarkMode ? '#ECFDF5' : '#065F46' }]}>
                  {periodIncome.length} txn
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        <View style={tailwind`p-5`}>
          <Text style={[tailwind`text-xl font-bold mb-4`, { color: colors.text }]}>
            📊 Category Breakdown
          </Text>

          {categoryStats.categories.map((category, index) => (
            <View key={index} style={[tailwind`rounded-2xl p-4 mb-3 shadow-sm`, { backgroundColor: colors.surface }]}>
              <View style={tailwind`flex-row justify-between items-start mb-3`}>
                <View style={tailwind`flex-row items-start flex-1`}>
                  <View style={[tailwind`p-3 rounded-xl mr-3`, { backgroundColor: category.color + '20' }]}>
                    <Text style={tailwind`text-2xl`}>{category.icon}</Text>
                  </View>
                  <View style={tailwind`flex-1`}>
                    <View style={tailwind`flex-row items-center gap-2 mb-1`}>
                      <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>{category.name}</Text>
                      {category.isOverBudget && (
                        <Text style={[tailwind`text-xs font-bold`, { color: colors.error }]}>⚠️ Over</Text>
                      )}
                    </View>
                    <Text style={[tailwind`text-xs mb-1`, { color: colors.textTertiary }]}>
                      {category.count} transaction{category.count > 1 ? 's' : ''}
                    </Text>
                    {category.budget > 0 && (
                      <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>
                        Budget: ₹{category.budget.toFixed(0)} • Left: ₹{Math.max(category.budgetRemaining, 0).toFixed(0)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={tailwind`items-end ml-2`}>
                  <Text style={[tailwind`text-xl font-bold`, { color: colors.text }]}>₹{category.amount.toFixed(0)}</Text>
                  <Text style={[tailwind`text-xs font-semibold`, { color: category.color }]}>{category.percentage.toFixed(1)}%</Text>
                </View>
              </View>

              {/* Progress Bar */}
              {category.budget > 0 ? (
                <View style={[tailwind`h-2 rounded-full overflow-hidden`, { backgroundColor: colors.borderLight }]}>
                  <View
                    style={{
                      width: `${Math.min((category.amount / category.budget) * 100, 100)}%`,
                      height: '100%',
                      borderRadius: 4,
                      backgroundColor: category.isOverBudget ? colors.error : category.color
                    }}
                  />
                </View>
              ) : (
                <View style={[tailwind`h-2 rounded-full overflow-hidden`, { backgroundColor: colors.borderLight }]}>
                  <View
                    style={{
                      width: `${Math.min(category.percentage, 100)}%`,
                      height: '100%',
                      borderRadius: 4,
                      backgroundColor: category.color
                    }}
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Top Categories */}
        {categoryStats.categories.length >= 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 3 Spending Categories</Text>
            <View style={styles.topCategoriesContainer}>
              {categoryStats.categories.slice(0, 3).map((category, index) => (
                <View key={index} style={[styles.topCategoryCard, { borderLeftColor: category.color }]}>
                  <Text style={styles.topCategoryRank}>#{index + 1}</Text>
                  <Text style={styles.topCategoryIcon}>{category.icon}</Text>
                  <Text style={styles.topCategoryName}>{category.name}</Text>
                  <Text style={styles.topCategoryAmount}>₹{category.amount.toFixed(2)}</Text>
                  {category.budget > 0 && (
                    <Text style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                      of ₹{category.budget.toFixed(2)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Insights

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  totalCard: {
    backgroundColor: '#6200ee',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 8,
  },
  totalAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  budgetText: {
    fontSize: 11,
    color: '#6200ee',
    marginTop: 2,
    fontWeight: '500',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: '600',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  topCategoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topCategoryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topCategoryRank: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  topCategoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  topCategoryName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  topCategoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
})