import { Text, View, ScrollView, SafeAreaView } from 'react-native'
import React, { useMemo } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { useTheme } from '../context/ThemeContext'
import { formatCurrency } from '../helper'
import tailwind from 'twrnc'

const Insights = () => {
  const { expenses, totalBudget, getCategoryBudgetStatus } = useExpense()
  const { colors } = useTheme()

  // Calculate category-wise spending
  const categoryStats = useMemo(() => {
    const stats = {}
    let total = 0

    expenses.forEach(expense => {
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
      const budgetStatus = getCategoryBudgetStatus(category);
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
  }, [expenses, getCategoryBudgetStatus])

  if (expenses.length === 0) {
    return (
      <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
        <View style={[tailwind`flex-1 justify-center items-center p-8`]}>
          <Text style={tailwind`text-6xl mb-4`}>📊</Text>
          <Text style={[tailwind`text-xl font-bold mb-2`, { color: colors.text }]}>No expenses yet</Text>
          <Text style={[tailwind`text-base text-center`, { color: colors.textSecondary }]}>
            Add some expenses to see your spending insights
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <ScrollView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[tailwind`p-6 pb-8`, { backgroundColor: colors.primary }]}>
        <Text style={tailwind`text-3xl font-bold text-white`}>Insights</Text>
        <Text style={tailwind`text-white opacity-90 mt-1`}>
          Analyze your spending patterns
        </Text>
      </View>

      {/* Total Spending Card */}
      <View style={[tailwind`mx-5 -mt-4 p-6 rounded-3xl shadow-lg items-center`, { backgroundColor: colors.surface }]}>
        <Text style={[tailwind`text-sm font-semibold`, { color: colors.textSecondary }]}>💸 Total Spending</Text>
        <Text style={[tailwind`text-5xl font-bold mt-2`, { color: colors.text }]}>{formatCurrency(categoryStats.total)}</Text>
        <Text style={[tailwind`text-sm mt-1`, { color: colors.textTertiary }]}>
          {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
        </Text>
        {totalBudget > 0 && (
          <View style={[tailwind`mt-3 px-4 py-2 rounded-full`, { 
            backgroundColor: categoryStats.total > totalBudget ? colors.error + '20' : colors.success + '20'
          }]}>
            <Text style={[tailwind`text-xs font-bold`, { 
              color: categoryStats.total > totalBudget ? colors.error : colors.success
            }]}>
              {((categoryStats.total / totalBudget) * 100).toFixed(0)}% of budget used
            </Text>
          </View>
        )}
      </View>

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
                      Budget: {formatCurrency(category.budget)} • Left: {formatCurrency(Math.max(category.budgetRemaining, 0))}
                    </Text>
                  )}
                </View>
              </View>
              <View style={tailwind`items-end ml-2`}>
                <Text style={[tailwind`text-xl font-bold`, { color: colors.text }]}>{formatCurrency(category.amount)}</Text>
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
        <View style={tailwind`mx-5 mb-6`}>
          <Text style={[tailwind`text-lg font-semibold mb-3`, { color: colors.text }]}>Top 3 Spending Categories</Text>
          <View style={tailwind`flex-row justify-between gap-2`}>
            {categoryStats.categories.slice(0, 3).map((category, index) => (
              <View 
                key={index} 
                style={[
                  tailwind`flex-1 p-4 rounded-2xl items-center border-l-4 shadow-sm`, 
                  { backgroundColor: colors.surface, borderLeftColor: category.color }
                ]}
              >
                <Text style={[tailwind`text-xs font-semibold mb-2`, { color: colors.textSecondary }]}>#{index + 1}</Text>
                <Text style={tailwind`text-3xl mb-2`}>{category.icon}</Text>
                <Text style={[tailwind`text-xs font-medium text-center mb-1`, { color: colors.textSecondary }]}>{category.name}</Text>
                <Text style={[tailwind`text-sm font-bold`, { color: colors.text }]}>₹{category.amount.toFixed(0)}</Text>
                {category.budget > 0 && (
                  <Text style={[tailwind`text-xs mt-1`, { color: colors.textTertiary }]}>
                    of ₹{category.budget.toFixed(0)}
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

export default Insights;