import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native'
import React, { useMemo } from 'react'
import { useExpense } from '../context/ExpenseContext'
import { useTheme } from '../context/ThemeContext'
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
        <Text style={[tailwind`text-5xl font-bold mt-2`, { color: colors.text }]}>₹{categoryStats.total.toFixed(0)}</Text>
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