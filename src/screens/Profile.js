import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, Alert, Modal, Switch, SafeAreaView, ActivityIndicator, FlatList } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react'
import tailwind from 'twrnc'
import { useExpense } from '../context/ExpenseContext'
import { useTheme } from '../context/ThemeContext'
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../constant'
import { authAPI } from '../services/appwriteAPI'
import { exportExpensesAsPDF, exportExpensesAsCSV, importExpensesFromCSV } from '../services/pdfService'
import ExpenceItemCard from '../components/ExpenceItemCard';
import EmptyList from '../components/EmptyList';

const Profile = ({ navigation }) => {
  const {
    totalBudget,
    setBudget,
    budgetPeriod,
    updateBudgetPeriod,
    categoryBudgets,
    setCategoryBudget,
    getCategoryBudgetStatus,
    getTotalSpending,
    getExpensesForCurrentPeriod,
    getAllCategories,
    addCustomCategory,
    deleteCategory,
    userData,
    clearAllData,
    expenses,
    importExpenses,
    addExpense
  } = useExpense();

  const { isDarkMode, toggleTheme, colors } = useTheme();
  const categories = getAllCategories() || [];

  const [budgetInput, setBudgetInput] = useState(totalBudget.toString());
  const [categoryInputs, setCategoryInputs] = useState({});
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategoryToView, setSelectedCategoryToView] = useState(null);

  // New category fields
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [selectedColor, setSelectedColor] = useState('#FFB347');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState(false);

  const handleSetBudget = () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    let newTotal = amount;
    if (isAddingFunds) {
      newTotal = totalBudgetNum + amount;

      // Track as "Income" transaction
      addExpense({
        title: 'Budget Added',
        amount: amount,
        category: {
          name: 'Income',
          icon: '💰',
          color: '#10B981' // Emerald Green
        },
        date: new Date().toISOString(),
        type: 'credit' // Flag as credit as requested
      });
    }

    // Calculate total of all category budgets
    const totalCategoryBudgets = Object.values(categoryBudgets).reduce((sum, budget) => sum + Number(budget || 0), 0);

    // Ensure new total budget is not less than sum of category budgets
    if (newTotal < totalCategoryBudgets) {
      Alert.alert(
        "Budget Too Low",
        `Your total budget cannot be less than your allocated category budgets.\n\nCategory Budgets Total: ₹${totalCategoryBudgets.toFixed(2)}\n\nPlease set a budget ≥ ₹${totalCategoryBudgets.toFixed(2)} or reduce your category budgets first.`
      );
      return;
    }

    setBudget(newTotal);
    setShowEditBudgetModal(false);
    setIsAddingFunds(false);
    Alert.alert("Success", isAddingFunds
      ? `Added ₹${amount.toFixed(2)} to budget. New Total: ₹${newTotal.toFixed(2)}`
      : `Monthly budget set to ₹${newTotal.toFixed(2)}`
    );
  };

  const handleEditBudget = () => {
    setBudgetInput(totalBudget.toString());
    setShowEditBudgetModal(true);
    setIsAddingFunds(false);
  };

  const handleSetCategoryBudget = (categoryName) => {
    const amount = parseFloat(categoryInputs[categoryName] || '0');
    if (isNaN(amount) || amount < 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }
    setCategoryBudget(categoryName, amount);
    Alert.alert("Success", `Budget for ${categoryName} set to ₹${amount.toFixed(2)}`);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const result = await addCustomCategory({
      name: newCategoryName.trim(),
      icon: selectedIcon,
      color: selectedColor
    });

    if (result.success) {
      // Set budget if provided
      if (newCategoryBudget && parseFloat(newCategoryBudget) > 0) {
        const newBudgetAmount = parseFloat(newCategoryBudget);

        // Calculate current total of all category budgets
        const currentTotalCategoryBudgets = Object.values(categoryBudgets).reduce((sum, budget) => sum + Number(budget || 0), 0);

        // Check if adding this budget would exceed total budget
        if (currentTotalCategoryBudgets + newBudgetAmount > totalBudgetNum) {
          const available = totalBudgetNum - currentTotalCategoryBudgets;
          Alert.alert(
            'Budget Exceeded',
            `Adding this category budget would exceed your total budget.\n\nTotal Budget: ₹${totalBudgetNum.toFixed(2)}\nAllocated: ₹${currentTotalCategoryBudgets.toFixed(2)}\nAvailable: ₹${available.toFixed(2)}\n\nPlease set a budget ≤ ₹${available.toFixed(2)}`
          );
          return;
        }

        setCategoryBudget(newCategoryName.trim(), newBudgetAmount);
      }

      setShowAddCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryBudget('');
      setSelectedIcon('🎯');
      setSelectedColor('#FFB347');
      Alert.alert('Success', 'Category added successfully!');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    const currentBudget = categoryBudgets[category.name] || 0;
    setCategoryInputs({ ...categoryInputs, [category.name]: currentBudget.toString() });
    setShowEditCategoryModal(true);
  };

  const handleSaveEditCategory = () => {
    if (!editingCategory) return;

    const amount = parseFloat(categoryInputs[editingCategory.name] || '0');
    if (isNaN(amount) || amount < 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    // Calculate total of all OTHER category budgets (excluding current one being edited)
    const currentBudget = Number(categoryBudgets[editingCategory.name]) || 0;
    const otherCategoriesBudgets = Object.entries(categoryBudgets)
      .filter(([name]) => name !== editingCategory.name)
      .reduce((sum, [, budget]) => sum + Number(budget || 0), 0);

    // Check if new total would exceed total budget
    if (otherCategoriesBudgets + amount > totalBudgetNum) {
      const maxAllowed = totalBudgetNum - otherCategoriesBudgets;
      Alert.alert(
        'Budget Exceeded',
        `This budget would exceed your total budget.\n\nTotal Budget: ₹${totalBudgetNum.toFixed(2)}\nOther Categories: ₹${otherCategoriesBudgets.toFixed(2)}\nMax Allowed: ₹${maxAllowed.toFixed(2)}\n\nPlease set a budget ≤ ₹${maxAllowed.toFixed(2)}`
      );
      return;
    }

    setCategoryBudget(editingCategory.name, amount);
    setShowEditCategoryModal(false);
    Alert.alert("Success", `Budget for ${editingCategory.name} updated to ₹${amount.toFixed(2)}`);
  };

  const handleDeleteCategory = async (category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteCategory(category.name);
            if (result.success) {
              Alert.alert('Success', 'Category deleted successfully');
            } else {
              if (result.hasExpenses) {
                Alert.alert(
                  'Cannot Delete Category',
                  `This category has ${result.expenseCount} expense(s) associated with it.\n\nPlease delete or reassign these expenses first before deleting the category.`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', result.message || 'Failed to delete category');
              }
            }
          }
        }
      ]
    );
  };

  const totalAllocated = Object.values(categoryBudgets).reduce((sum, val) => sum + Number(val || 0), 0);
  const totalBudgetNum = Number(totalBudget) || 0;
  const allocationPercentage = totalBudgetNum > 0 ? Number((totalAllocated / totalBudgetNum) * 100) : 0;
  // Use current period spending (like Home screen does) so it resets each term
  const totalSpent = Number(getTotalSpending(true)) || 0;

  const categoryTransactions = selectedCategoryToView 
    ? expenses.filter(e => e.category === selectedCategoryToView.name)
        .sort((a,b) => new Date(b.date) - new Date(a.date))
    : [];

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <ScrollView style={[tailwind`flex-1`, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Modern Header */}
        <LinearGradient
          colors={[colors.primary || '#6366F1', colors.primaryDark || '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tailwind`px-6 pt-6 pb-10`}
        >
          <View style={tailwind`flex-row justify-between items-center mb-6`}>
            <View style={tailwind`flex-1`}>
              <Text style={tailwind`text-white text-3xl font-bold tracking-tight`}>Profile</Text>
              <Text style={tailwind`text-white text-sm opacity-80 mt-1`}>
                Manage your budget
              </Text>
            </View>

            {/* Theme & Logout */}
            <View style={tailwind`flex-row items-center gap-2`}>
              <Pressable
                onPress={toggleTheme}
                style={[tailwind`w-11 h-11 rounded-xl items-center justify-center`, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              >
                <Text style={tailwind`text-xl`}>{isDarkMode ? '🌙' : '☀️'}</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  Alert.alert(
                    'Logout',
                    'Are you sure you want to logout?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: async () => {
                          await authAPI.logout();
                          clearAllData();
                        }
                      }
                    ]
                  );
                }}
                style={[tailwind`w-11 h-11 rounded-xl items-center justify-center`, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              >
                <Text style={tailwind`text-xl`}>🚪</Text>
              </Pressable>
            </View>
          </View>

          {/* User Info Card - Glassmorphism */}
          <Pressable
            onPress={() => setShowUserProfileModal(true)}
            style={[tailwind`flex-row items-center p-4 rounded-2xl border border-white/20`, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
          >
            <View style={[tailwind`w-14 h-14 rounded-full items-center justify-center mr-3 bg-white/20`]}>
              <Text style={tailwind`text-3xl`}>👤</Text>
            </View>
            <View style={tailwind`flex-1`}>
              <Text style={tailwind`text-xl font-bold text-white mb-0.5`}>
                {userData.name || 'User'}
              </Text>
              {userData.email && (
                <Text style={tailwind`text-white opacity-75 text-xs`}>
                  {userData.email}
                </Text>
              )}
            </View>
            <Text style={tailwind`text-white text-lg`}>›</Text>
          </Pressable>
        </LinearGradient>

        <View style={[tailwind`mx-5 -mt-6 rounded-3xl p-6 shadow-lg`, { backgroundColor: colors.surface }]}>
          <View style={tailwind`flex-row justify-between items-start mb-4`}>
            <View style={tailwind`flex-1`}>
              <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>
                💰 {budgetPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Budget
              </Text>
              {totalBudget > 0 ? (
                <>
                  <Text style={[tailwind`text-4xl font-bold`, { color: colors.text }]}>
                    ₹{totalBudgetNum.toFixed(0)}
                  </Text>
                  <View style={tailwind`flex-row items-center mt-2`}>
                    <Text style={[tailwind`text-sm`, { color: colors.textSecondary }]}>
                      Spent: ₹{totalSpent.toFixed(0)}
                    </Text>
                    <View style={[tailwind`ml-2 px-2 py-0.5 rounded-full`, {
                      backgroundColor: totalSpent > totalBudget ? colors.error + '20' : colors.success + '20'
                    }]}>
                      <Text style={[tailwind`text-xs font-bold`, {
                        color: totalSpent > totalBudgetNum ? colors.error : colors.success
                      }]}>
                        {totalBudgetNum > 0 ? Number((totalSpent / totalBudgetNum) * 100).toFixed(0) : 0}%
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={[tailwind`text-2xl font-bold`, { color: colors.textSecondary }]}>Not Set</Text>
              )}
            </View>
            <View style={tailwind`flex-row gap-2`}>
              <Pressable
                style={({ pressed }) => [tailwind`rounded-xl shadow-sm overflow-hidden`, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                onPress={() => {
                  setBudgetInput('');
                  setShowEditBudgetModal(true);
                  setIsAddingFunds(true);
                }}
              >
                <LinearGradient
                  colors={[colors.success, '#059669']}
                  style={tailwind`px-4 py-2.5`}
                >
                  <Text style={tailwind`text-white font-bold text-sm`}>+ Add</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [tailwind`rounded-xl shadow-sm overflow-hidden`, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                onPress={() => {
                  setIsAddingFunds(false);
                  handleEditBudget();
                }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={tailwind`px-4 py-2.5`}
                >
                  <Text style={tailwind`text-white font-bold text-sm`}>
                    {totalBudget > 0 ? 'Edit' : 'Set'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {totalBudgetNum > 0 && (
            <>
              {/* Progress Bar */}
              <View style={[tailwind`h-3 rounded-full overflow-hidden mb-4`, { backgroundColor: colors.borderLight }]}>
                <View
                  style={[tailwind`h-full rounded-full`, {
                    width: `${Math.min(Number((totalSpent / totalBudgetNum) * 100), 100)}%`,
                    backgroundColor: totalSpent > totalBudgetNum ? colors.error : totalSpent > totalBudgetNum * 0.8 ? colors.warning : colors.success
                  }]}
                />
              </View>

              {/* Budget Stats Grid */}
              <View style={[tailwind`flex-row pt-4 border-t`, { borderTopColor: colors.border }]}>
                <View style={tailwind`flex-1 items-center`}>
                  <Text style={[tailwind`text-xs mb-1`, { color: colors.textSecondary }]}>Allocated</Text>
                  <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>
                    ₹{totalAllocated.toFixed(0)}
                  </Text>
                </View>
                <View style={tailwind`flex-1 items-center`}>
                  <Text style={[tailwind`text-xs mb-1`, { color: colors.textSecondary }]}>Remaining</Text>
                  <Text style={[tailwind`text-base font-bold`, {
                    color: totalBudgetNum - totalSpent < 0 ? colors.error : colors.success
                  }]}>
                    ₹{Math.max(totalBudgetNum - totalSpent, 0).toFixed(0)}
                  </Text>
                </View>
                <View style={tailwind`flex-1 items-center`}>
                  <Text style={[tailwind`text-xs mb-1`, { color: colors.textSecondary }]}>Unallocated</Text>
                  <Text style={[tailwind`text-base font-bold`, {
                    color: totalBudgetNum - totalAllocated < 0 ? colors.error : colors.textSecondary
                  }]}>
                    ₹{(totalBudgetNum - totalAllocated).toFixed(0)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Category Budgets */}
        <View style={tailwind`px-5 py-6`}>
          <View style={tailwind`flex-row justify-between items-center mb-4`}>
            <Text style={[tailwind`text-xl font-bold`, { color: colors.text }]}>
              📊 Categories
            </Text>
            <Pressable
              style={({ pressed }) => [tailwind`rounded-xl shadow-sm overflow-hidden`, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
              onPress={() => setShowAddCategoryModal(true)}
            >
              <LinearGradient colors={[colors.success, '#059669']} style={tailwind`px-5 py-2`}>
                <Text style={tailwind`text-white font-bold text-sm`}>➕ Add</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {categories.map((category, index) => {
            const status = getCategoryBudgetStatus(category.name);

            return (
              <Pressable 
                key={index} 
                style={({ pressed }) => [
                  tailwind`rounded-3xl p-5 mb-3 shadow-sm border`, 
                  { 
                    backgroundColor: colors.surface,
                    borderColor: 'transparent',
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => setSelectedCategoryToView(category)}
              >
                <View style={tailwind`flex-row items-center justify-between mb-3`}>
                  <View style={tailwind`flex-row items-center flex-1`}>
                    <View style={[tailwind`w-12 h-12 rounded-2xl items-center justify-center mr-3 shadow-sm`, { backgroundColor: category.color + '30' }]}>
                      <Text style={tailwind`text-2xl`}>{category.icon}</Text>
                    </View>
                    <View style={tailwind`flex-1`}>
                      <Text style={[tailwind`text-base font-bold mb-1`, { color: colors.text }]}>
                        {category.name}
                      </Text>
                      {status.budget > 0 ? (
                        <View style={tailwind`flex-row items-center`}>
                          <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>
                            ₹{status.spent.toFixed(0)} / ₹{status.budget.toFixed(0)}
                          </Text>
                          {status.isOverBudget && (
                            <Text style={[tailwind`text-xs ml-2 font-bold`, { color: colors.error }]}>
                              ⚠️ Over!
                            </Text>
                          )}
                        </View>
                      ) : (
                        <Text style={[tailwind`text-xs`, { color: colors.textTertiary }]}>
                          No budget set
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={tailwind`flex-row gap-2`}>
                    <Pressable
                      style={({ pressed }) => [tailwind`rounded-xl shadow-sm overflow-hidden`, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                      onPress={() => handleEditCategory(category)}
                    >
                      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={tailwind`px-4 py-2`}>
                        <Text style={tailwind`text-white font-semibold text-xs`}>Edit</Text>
                      </LinearGradient>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [tailwind`rounded-xl shadow-sm overflow-hidden`, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                      onPress={() => handleDeleteCategory(category)}
                    >
                      <LinearGradient colors={[colors.error, '#991B1B']} style={tailwind`px-3 py-2`}>
                        <Text style={tailwind`text-white font-semibold text-xs`}>🗑️</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>

                {/* Progress bar for category */}
                {status.budget > 0 && (
                  <View style={[tailwind`h-2.5 rounded-full overflow-hidden`, { backgroundColor: colors.borderLight }]}>
                    <View
                      style={[
                        tailwind`h-full rounded-full`,
                        {
                          width: `${Math.min(status.percentage, 100)}%`,
                          backgroundColor: status.isOverBudget ? colors.error : status.percentage > 80 ? colors.warning : category.color
                        }
                      ]}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}

          {categories.length === 0 && (
            <View style={[tailwind`p-10 rounded-3xl items-center`, { backgroundColor: colors.surface }]}>
              <Text style={tailwind`text-5xl mb-3`}>📂</Text>
              <Text style={[tailwind`text-lg font-bold mb-1`, { color: colors.text }]}>No Categories Yet</Text>
              <Text style={[tailwind`text-sm text-center`, { color: colors.textSecondary }]}>
                Create your first category to start budgeting
              </Text>
            </View>
          )}
        </View>

        {/* Settings Section */}
        <View style={tailwind`px-5 pb-6`}>
          <Text style={[tailwind`text-xl font-bold mb-4`, { color: colors.text }]}>
            ⚙️ Settings
          </Text>

          {/* Budget Period */}
          <Pressable
            style={[tailwind`rounded-2xl p-5 mb-3 shadow-sm flex-row items-center`, { backgroundColor: colors.surface }]}
            onPress={() => setShowPeriodModal(true)}
          >
            <View style={[tailwind`w-12 h-12 rounded-2xl items-center justify-center mr-4`, { backgroundColor: colors.primary + '20' }]}>
              <Text style={tailwind`text-2xl`}>📅</Text>
            </View>
            <View style={tailwind`flex-1`}>
              <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>Budget Period</Text>
              <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>
                Currently: {budgetPeriod === 'weekly' ? 'Weekly' : 'Monthly'}
              </Text>
            </View>
            <Text style={[tailwind`text-lg`, { color: colors.primary }]}>›</Text>
          </Pressable>

          {/* Clear Data */}
          <Pressable
            style={[tailwind`rounded-2xl p-5 mb-3 shadow-sm flex-row items-center`, { backgroundColor: colors.surface }]}
            onPress={() => {
              Alert.alert(
                'Clear All Data',
                'This will permanently delete all your expenses, categories, and budget settings. This action cannot be undone.\n\nAre you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => {
                      clearAllData();
                      Alert.alert('Success', 'All data has been cleared');
                    }
                  }
                ]
              );
            }}
          >
            <View style={[tailwind`w-12 h-12 rounded-2xl items-center justify-center mr-4`, { backgroundColor: colors.error + '20' }]}>
              <Text style={tailwind`text-2xl`}>🗑️</Text>
            </View>
            <View style={tailwind`flex-1`}>
              <Text style={[tailwind`text-base font-bold`, { color: colors.error }]}>Clear All Data</Text>
              <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>Permanently delete everything</Text>
            </View>
            <Text style={[tailwind`text-lg`, { color: colors.error }]}>›</Text>
          </Pressable>
        </View>

        {/* Export & Import Section */}
        <View style={tailwind`px-5 pb-6`}>
          <Text style={[tailwind`text-xl font-bold mb-4`, { color: colors.text }]}>
            📤 Export & Import
          </Text>

          {/* Export as PDF */}
          <Pressable
            style={[tailwind`rounded-2xl p-5 mb-3 shadow-sm flex-row items-center`, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('PDFExport')}
          >
            <View style={[tailwind`w-12 h-12 rounded-2xl items-center justify-center mr-4`, { backgroundColor: '#EF444420' }]}>
              <Text style={tailwind`text-2xl`}>📄</Text>
            </View>
            <View style={tailwind`flex-1`}>
              <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>Export as PDF</Text>
              <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>View and download expense report</Text>
            </View>
            <Text style={[tailwind`text-lg`, { color: colors.primary }]}>›</Text>
          </Pressable>

          {/* Export as CSV */}
          <Pressable
            style={[tailwind`rounded-2xl p-5 mb-3 shadow-sm flex-row items-center`, { backgroundColor: colors.surface }]}
            onPress={async () => {
              setIsExportingCSV(true);
              try {
                const result = await exportExpensesAsCSV({
                  expenses,
                  userData,
                });
                if (!result.success) {
                  Alert.alert('Export Failed', result.error || 'Could not generate CSV');
                }
              } catch (e) {
                Alert.alert('Error', 'Failed to export CSV: ' + e.message);
              } finally {
                setIsExportingCSV(false);
              }
            }}
            disabled={isExportingCSV}
          >
            <View style={[tailwind`w-12 h-12 rounded-2xl items-center justify-center mr-4`, { backgroundColor: '#10B98120' }]}>
              <Text style={tailwind`text-2xl`}>📊</Text>
            </View>
            <View style={tailwind`flex-1`}>
              <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>Export as CSV</Text>
              <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>Spreadsheet-compatible data file</Text>
            </View>
            {isExportingCSV ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[tailwind`text-lg`, { color: colors.primary }]}>›</Text>
            )}
          </Pressable>

          {/* Import from CSV */}
          <Pressable
            style={[tailwind`rounded-2xl p-5 mb-3 shadow-sm flex-row items-center`, { backgroundColor: colors.surface }]}
            onPress={async () => {
              setIsImporting(true);
              try {
                // Get fresh categories
                const currentCategories = getAllCategories() || [];

                const result = await importExpensesFromCSV(currentCategories);

                if (result.canceled) {
                  // User canceled, do nothing
                  return;
                }

                if (!result.success) {
                  Alert.alert('Import Failed', result.message || 'Could not parse file');
                  return;
                }

                if (result.data.length === 0) {
                  Alert.alert('No Expenses Found', 'No valid expenses found in the CSV file.');
                  return;
                }

                // Confirm import
                Alert.alert(
                  'Import Expenses',
                  `Found ${result.stats.success} valid expenses. ${result.stats.failed > 0 ? `${result.stats.failed} failed/skipped.` : ''}\n\nProceed with import?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Import',
                      onPress: async () => {
                        setIsImporting(true);
                        try {
                          const importResult = await importExpenses(result.data);
                          if (importResult.success) {
                            Alert.alert('Success', `Successfully imported ${importResult.count} expenses.`);
                          } else {
                            Alert.alert('Error', importResult.error || 'Import failed');
                          }
                        } catch (e) {
                          Alert.alert('Error', 'Failed to import: ' + e.message);
                        } finally {
                          setIsImporting(false);
                        }
                      }
                    }
                  ]
                );
              } catch (e) {
                Alert.alert('Error', 'Failed to import CSV: ' + e.message);
              } finally {
                setIsImporting(false);
              }
            }}
            disabled={isImporting}
          >
            <View style={[tailwind`w-12 h-12 rounded-2xl items-center justify-center mr-4`, { backgroundColor: '#3B82F620' }]}>
              <Text style={tailwind`text-2xl`}>📥</Text>
            </View>
            <View style={tailwind`flex-1`}>
              <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>Import from CSV</Text>
              <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>Restore data from backup file</Text>
            </View>
            {isImporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[tailwind`text-lg`, { color: colors.primary }]}>›</Text>
            )}
          </Pressable>

          {expenses.length === 0 && (
            <View style={[tailwind`p-4 rounded-xl`, { backgroundColor: colors.info + '15' }]}>
              <Text style={[tailwind`text-sm text-center`, { color: colors.info }]}>
                💡 Add some expenses first to generate a report
              </Text>
            </View>
          )}
        </View>

        {/* Edit Budget Modal */}
        <Modal
          visible={showEditBudgetModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEditBudgetModal(false)}
        >
          <View style={[tailwind`flex-1 justify-end`, { backgroundColor: colors.overlay }]}>
            <View style={[tailwind`rounded-t-3xl p-6`, { backgroundColor: colors.surface }]}>
              <Text style={[tailwind`text-2xl font-bold mb-4`, { color: colors.text }]}>
                {isAddingFunds ? 'Add Funds' : (totalBudget > 0 ? 'Edit Budget' : 'Set Budget')}
              </Text>

              <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>
                {isAddingFunds ? 'Amount to Add' : 'Monthly Budget'}
              </Text>
              <TextInput
                placeholder="₹0.00"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                style={[tailwind`p-4 rounded-xl text-lg mb-4 border-2`, {
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                  color: colors.text
                }]}
                value={budgetInput}
                onChangeText={setBudgetInput}
              />

              {totalSpent > 0 && (
                <View style={[tailwind`p-3 rounded-xl mb-4`, { backgroundColor: colors.info + '20' }]}>
                  <Text style={[tailwind`text-sm`, { color: colors.info }]}>
                    💡 Current spending: ₹{totalSpent.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={tailwind`flex-row gap-3`}>
                <Pressable
                  style={[tailwind`flex-1 p-4 rounded-xl`, { backgroundColor: colors.border }]}
                  onPress={() => setShowEditBudgetModal(false)}
                >
                  <Text style={[tailwind`font-bold text-center`, { color: colors.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    tailwind`flex-1 rounded-xl shadow-md overflow-hidden`,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] }
                  ]}
                  onPress={handleSetBudget}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={tailwind`p-4 items-center justify-center`}
                  >
                    <Text style={tailwind`text-white font-bold text-center`}>Save</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Category Modal */}
        <Modal
          visible={showAddCategoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddCategoryModal(false)}
        >
          <View style={[tailwind`flex-1 justify-end`, { backgroundColor: colors.overlay }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
              <ScrollView style={[tailwind`rounded-t-3xl p-6 max-h-[90%]`, { backgroundColor: colors.surface }]}>
                <Text style={[tailwind`text-2xl font-bold mb-4`, { color: colors.text }]}>Create New Category</Text>
                {/* Category Name */}
                <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>Category Name *</Text>
                <TextInput
                  placeholder="e.g., Gym, Coffee, Pets"
                  placeholderTextColor={colors.placeholder}
                  style={[tailwind`p-4 rounded-xl text-lg mb-4 border-2`, {
                    backgroundColor: colors.input,
                    borderColor: colors.inputBorder,
                    color: colors.text
                  }]}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
                {/* Budget */}
                <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>Monthly Budget (Optional)</Text>
              <TextInput
                placeholder="₹0.00"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                style={[tailwind`p-4 rounded-xl text-lg mb-4 border-2`, {
                  backgroundColor: colors.input,
                  borderColor: colors.inputBorder,
                  color: colors.text
                }]}
                value={newCategoryBudget}
                onChangeText={setNewCategoryBudget}
              />

              {/* Icon Selection */}
              <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>
                Choose Icon
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={tailwind`mb-4`}
              >
                {AVAILABLE_ICONS.map((icon, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setSelectedIcon(icon)}
                    style={[
                      tailwind`p-3 m-1 rounded-xl border-2`,
                      {
                        backgroundColor: selectedIcon === icon ? colors.primary + '20' : colors.card,
                        borderColor: selectedIcon === icon ? colors.primary : colors.border
                      }
                    ]}
                  >
                    <Text style={tailwind`text-3xl`}>{icon}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Color Selection */}
              <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>
                Choose Color
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={tailwind`mb-4`}
              >
                {AVAILABLE_COLORS.map((color, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      tailwind`w-12 h-12 m-1 rounded-full border-2`,
                      { backgroundColor: color },
                      selectedColor === color
                        ? tailwind`border-black border-4`
                        : { borderColor: colors.border }
                    ]}
                  />
                ))}
              </ScrollView>

              {/* Preview */}
              <View style={[tailwind`p-4 rounded-xl mb-4 items-center`, { backgroundColor: colors.borderLight }]}>
                <Text style={[tailwind`text-sm mb-2`, { color: colors.textSecondary }]}>Preview</Text>
                <View
                  style={[
                    tailwind`p-4 rounded-xl`,
                    { backgroundColor: selectedColor }
                  ]}
                >
                  <Text style={tailwind`text-4xl mb-2 text-center`}>{selectedIcon}</Text>
                  <Text style={tailwind`text-white font-bold text-center`}>
                    {newCategoryName || 'Your Category'}
                  </Text>
                  {newCategoryBudget && (
                    <Text style={tailwind`text-white text-sm text-center mt-1`}>
                      Budget: ₹{newCategoryBudget}
                    </Text>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={tailwind`flex-row gap-3 mb-6`}>
                <Pressable
                  style={[tailwind`flex-1 p-4 rounded-xl`, { backgroundColor: colors.border }]}
                  onPress={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                    setNewCategoryBudget('');
                  }}
                >
                  <Text style={[tailwind`font-bold text-center`, { color: colors.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    tailwind`flex-1 rounded-xl shadow-md overflow-hidden`,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] }
                  ]}
                  onPress={handleAddCategory}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={tailwind`p-4 items-center justify-center`}
                  >
                    <Text style={tailwind`text-white font-bold text-center`}>Create</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Edit Category Modal */}
        <Modal
          visible={showEditCategoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEditCategoryModal(false)}
        >
          <View style={[tailwind`flex-1 justify-end`, { backgroundColor: colors.overlay }]}>
            <View style={[tailwind`rounded-t-3xl p-6`, { backgroundColor: colors.surface }]}>
              {editingCategory && (
                <>
                  <Text style={[tailwind`text-2xl font-bold mb-4`, { color: colors.text }]}>
                    Edit Budget
                  </Text>

                  <View style={[tailwind`p-4 rounded-xl mb-4 items-center`, { backgroundColor: colors.borderLight }]}>
                    <Text style={tailwind`text-4xl mb-2`}>{editingCategory.icon}</Text>
                    <Text style={[tailwind`text-lg font-bold`, { color: colors.text }]}>{editingCategory.name}</Text>
                  </View>

                  <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>
                    Monthly Budget
                  </Text>
                  <TextInput
                    placeholder="₹0.00"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="numeric"
                    style={[tailwind`p-4 rounded-xl text-lg mb-4 border-2`, {
                      backgroundColor: colors.input,
                      borderColor: colors.inputBorder,
                      color: colors.text
                    }]}
                    value={categoryInputs[editingCategory.name] || ''}
                    onChangeText={(text) => setCategoryInputs({ ...categoryInputs, [editingCategory.name]: text })}
                  />

                  {getCategoryBudgetStatus(editingCategory.name).spent > 0 && (
                    <View style={[tailwind`p-3 rounded-xl mb-4`, { backgroundColor: colors.info + '20' }]}>
                      <Text style={[tailwind`text-sm`, { color: colors.info }]}>
                        💡 Currently spent: ₹{getCategoryBudgetStatus(editingCategory.name).spent.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <View style={tailwind`flex-row gap-3`}>
                    <Pressable
                      style={[tailwind`flex-1 p-4 rounded-xl`, { backgroundColor: colors.border }]}
                      onPress={() => {
                        setShowEditCategoryModal(false);
                        setEditingCategory(null);
                      }}
                    >
                      <Text style={[tailwind`font-bold text-center`, { color: colors.text }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        tailwind`flex-1 rounded-xl shadow-md overflow-hidden`,
                        { transform: [{ scale: pressed ? 0.98 : 1 }] }
                      ]}
                      onPress={handleSaveEditCategory}
                    >
                      <LinearGradient
                        colors={[colors.success, '#059669']}
                        style={tailwind`p-4 items-center justify-center`}
                      >
                        <Text style={tailwind`text-white font-bold text-center`}>Save</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Category Transactions Modal */}
        <Modal
          visible={selectedCategoryToView !== null}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedCategoryToView(null)}
        >
          <View style={[tailwind`flex-1 justify-end`, { backgroundColor: colors.overlay }]}>
            <View style={[tailwind`rounded-t-3xl pt-2 pb-6 flex-1 mt-20`, { backgroundColor: colors.background }]}>
              {/* Pull Bar */}
              <View style={tailwind`items-center pb-4 pt-2`}>
                <View style={[tailwind`w-12 h-1.5 rounded-full`, { backgroundColor: colors.border }]} />
              </View>

              {selectedCategoryToView && (
                <>
                  <View style={tailwind`px-6 mb-4 flex-row items-center justify-between`}>
                    <View style={tailwind`flex-row items-center flex-1`}>
                      <View style={[tailwind`w-12 h-12 rounded-2xl items-center justify-center mr-3 shadow-sm`, { backgroundColor: selectedCategoryToView.color + '30' }]}>
                        <Text style={tailwind`text-2xl`}>{selectedCategoryToView.icon}</Text>
                      </View>
                      <View style={tailwind`flex-1`}>
                        <Text style={[tailwind`text-2xl font-bold`, { color: colors.text }]}>
                          {selectedCategoryToView.name}
                        </Text>
                        <Text style={[tailwind`text-sm font-semibold mt-1`, { color: colors.textSecondary }]}>
                          {categoryTransactions.length} transaction{categoryTransactions.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    
                    <Pressable
                      onPress={() => setSelectedCategoryToView(null)}
                      style={[tailwind`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: colors.border }]}
                    >
                      <Text style={[tailwind`text-xl`, { color: colors.text }]}>✕</Text>
                    </Pressable>
                  </View>

                  <FlatList
                    data={categoryTransactions}
                    renderItem={({ item, index }) => <ExpenceItemCard item={item} index={index} />}
                    keyExtractor={(item) => item.id ? item.id.toString() : index.toString()}
                    contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
                    ListEmptyComponent={<EmptyList />}
                    showsVerticalScrollIndicator={false}
                  />
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* User Profile Modal - Enhanced */}
        <Modal
          visible={showUserProfileModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowUserProfileModal(false)}
        >
          <View style={[tailwind`flex-1`, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <Pressable 
              style={tailwind`flex-1`}
              onPress={() => setShowUserProfileModal(false)}
            />
            <View style={[tailwind`rounded-t-3xl shadow-2xl`, { backgroundColor: colors.surface, maxHeight: '90%' }]}>
              {/* Modern Gradient Header */}
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tailwind`rounded-t-3xl overflow-hidden`}
              >
                <View style={tailwind`px-6 pt-6 pb-8`}>
                  {/* Close Button */}
                  <View style={tailwind`flex-row justify-end mb-4`}>
                    <Pressable
                      onPress={() => setShowUserProfileModal(false)}
                      style={[tailwind`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
                    >
                      <Text style={tailwind`text-white text-xl font-bold`}>✕</Text>
                    </Pressable>
                  </View>

                  {/* User Avatar & Info */}
                  <View style={tailwind`items-center`}>
                    <View style={[tailwind`w-28 h-28 rounded-full items-center justify-center mb-4 border-4 border-white/30`, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={tailwind`text-6xl`}>👤</Text>
                    </View>
                    <Text style={tailwind`text-white text-3xl font-bold mb-2`}>
                      {userData.name || 'User'}
                    </Text>
                    {userData.email && (
                      <View style={[tailwind`flex-row items-center px-4 py-2 rounded-full mb-2`, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Text style={tailwind`text-white mr-2`}>📧</Text>
                        <Text style={[tailwind`text-sm`, { color: 'rgba(255,255,255,0.95)' }]}>
                          {userData.email}
                        </Text>
                      </View>
                    )}
                    {userData.phone && (
                      <View style={[tailwind`flex-row items-center px-4 py-2 rounded-full`, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Text style={tailwind`text-white mr-2`}>📱</Text>
                        <Text style={[tailwind`text-sm`, { color: 'rgba(255,255,255,0.95)' }]}>
                          {userData.phone}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </LinearGradient>

              <ScrollView
                contentContainerStyle={tailwind`px-6 pb-8`}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                {/* Activity Stats */}
                <View style={tailwind`-mt-6 mb-5`}>
                  <View style={[tailwind`rounded-2xl p-5 shadow-lg`, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                    <View style={tailwind`flex-row items-center mb-4`}>
                      <Text style={tailwind`text-2xl mr-2`}>📊</Text>
                      <Text style={[tailwind`text-lg font-bold`, { color: colors.text }]}>
                        Activity Overview
                      </Text>
                    </View>
                    
                    <View style={tailwind`flex-row gap-3`}>
                      {/* Total Expenses */}
                      <View style={[tailwind`flex-1 p-4 rounded-xl items-center`, { backgroundColor: '#667eea15' }]}>
                        <Text style={tailwind`text-3xl mb-2`}>💰</Text>
                        <Text style={[tailwind`text-2xl font-bold mb-1`, { color: colors.text }]}>
                          {expenses.length}
                        </Text>
                        <Text style={[tailwind`text-xs text-center`, { color: colors.textSecondary }]}>
                          Total{'\n'}Transactions
                        </Text>
                      </View>

                      {/* Total Amount */}
                      <View style={[tailwind`flex-1 p-4 rounded-xl items-center`, { backgroundColor: '#f093fb15' }]}>
                        <Text style={tailwind`text-3xl mb-2`}>💸</Text>
                        <Text style={[tailwind`text-lg font-bold mb-1`, { color: colors.text }]} numberOfLines={1}>
                          ₹{expenses.filter(exp => !['income', 'salary', 'deposit', 'credit'].includes(exp.category?.toLowerCase()) && exp.type !== 'credit').reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0).toFixed(0)}
                        </Text>
                        <Text style={[tailwind`text-xs text-center`, { color: colors.textSecondary }]}>
                          Total{'\n'}Spent
                        </Text>
                      </View>

                      {/* Categories Used */}
                      <View style={[tailwind`flex-1 p-4 rounded-xl items-center`, { backgroundColor: '#4facfe15' }]}>
                        <Text style={tailwind`text-3xl mb-2`}>🏷️</Text>
                        <Text style={[tailwind`text-2xl font-bold mb-1`, { color: colors.text }]}>
                          {categories.length}
                        </Text>
                        <Text style={[tailwind`text-xs text-center`, { color: colors.textSecondary }]}>
                          Active{'\n'}Categories
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Account Information */}
                <View style={[tailwind`rounded-2xl p-5 mb-5 shadow-sm`, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                  <View style={tailwind`flex-row items-center mb-4`}>
                    <Text style={tailwind`text-2xl mr-2`}>🔐</Text>
                    <Text style={[tailwind`text-lg font-bold`, { color: colors.text }]}>
                      Account Details
                    </Text>
                  </View>

                  {/* Member Since */}
                  <View style={[tailwind`flex-row items-center p-3 rounded-xl mb-3`, { backgroundColor: colors.primary + '10' }]}>
                    <View style={[tailwind`w-10 h-10 rounded-full items-center justify-center mr-3`, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={tailwind`text-lg`}>📅</Text>
                    </View>
                    <View style={tailwind`flex-1`}>
                      <Text style={[tailwind`text-xs mb-1`, { color: colors.textSecondary }]}>
                        Member Since
                      </Text>
                      <Text style={[tailwind`text-base font-semibold`, { color: colors.text }]}>
                        {userData.$createdAt ? new Date(userData.$createdAt).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* User ID */}
                  <View style={[tailwind`flex-row items-center p-3 rounded-xl`, { backgroundColor: colors.info + '10' }]}>
                    <View style={[tailwind`w-10 h-10 rounded-full items-center justify-center mr-3`, { backgroundColor: colors.info + '20' }]}>
                      <Text style={tailwind`text-lg`}>🆔</Text>
                    </View>
                    <View style={tailwind`flex-1`}>
                      <Text style={[tailwind`text-xs mb-1`, { color: colors.textSecondary }]}>
                        User ID
                      </Text>
                      <Text style={[tailwind`text-xs font-mono`, { color: colors.text }]} numberOfLines={1}>
                        {userData.$id || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Budget Settings */}
                <View style={[tailwind`rounded-2xl p-5 shadow-sm`, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                  <View style={tailwind`flex-row items-center justify-between mb-4`}>
                    <View style={tailwind`flex-row items-center`}>
                      <Text style={tailwind`text-2xl mr-2`}>⚙️</Text>
                      <Text style={[tailwind`text-lg font-bold`, { color: colors.text }]}>
                        Budget Settings
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setShowPeriodModal(true)}
                      style={({ pressed }) => [
                        tailwind`px-4 py-2 rounded-xl`,
                        { 
                          backgroundColor: colors.primary,
                          opacity: pressed ? 0.8 : 1
                        }
                      ]}
                    >
                      <Text style={tailwind`text-white font-bold text-xs`}>Change Period</Text>
                    </Pressable>
                  </View>

                  {/* Current Period */}
                  <View style={[tailwind`p-4 rounded-xl mb-3`, {
                    backgroundColor: budgetPeriod === 'weekly' ? '#667eea15' : '#764ba215',
                  }]}>
                    <View style={tailwind`flex-row items-center justify-between`}>
                      <View style={tailwind`flex-row items-center flex-1`}>
                        <View style={[tailwind`w-12 h-12 rounded-full items-center justify-center mr-3`, {
                          backgroundColor: budgetPeriod === 'weekly' ? '#667eea' : '#764ba2',
                        }]}>
                          <Text style={tailwind`text-2xl`}>
                            {budgetPeriod === 'weekly' ? '📆' : '📅'}
                          </Text>
                        </View>
                        <View>
                          <Text style={[tailwind`text-base font-bold mb-1`, { color: colors.text }]}>
                            {budgetPeriod === 'weekly' ? 'Weekly Budget' : 'Monthly Budget'}
                          </Text>
                          <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>
                            {budgetPeriod === 'weekly'
                              ? 'Resets every Monday'
                              : 'Resets on 1st of month'}
                          </Text>
                        </View>
                      </View>
                      <View style={[tailwind`w-8 h-8 rounded-full items-center justify-center`, {
                        backgroundColor: budgetPeriod === 'weekly' ? '#667eea' : '#764ba2',
                      }]}>
                        <Text style={tailwind`text-white font-bold text-sm`}>✓</Text>
                      </View>
                    </View>
                  </View>

                  {/* Period Stats */}
                  <View style={tailwind`flex-row gap-2`}>
                    <View style={[tailwind`flex-1 p-3 rounded-xl`, { backgroundColor: colors.success + '15' }]}>
                      <Text style={[tailwind`text-center text-lg font-bold mb-1`, { color: colors.text }]}>
                        {budgetPeriod === 'weekly' ? '7' : '30'}
                      </Text>
                      <Text style={[tailwind`text-center text-xs`, { color: colors.textSecondary }]}>
                        Days
                      </Text>
                    </View>
                    <View style={[tailwind`flex-1 p-3 rounded-xl`, { backgroundColor: colors.warning + '15' }]}>
                      <Text style={[tailwind`text-center text-lg font-bold mb-1`, { color: colors.text }]}>
                        {budgetPeriod === 'weekly' ? '52' : '12'}
                      </Text>
                      <Text style={[tailwind`text-center text-xs`, { color: colors.textSecondary }]}>
                        Per Year
                      </Text>
                    </View>
                    <View style={[tailwind`flex-1 p-3 rounded-xl`, { backgroundColor: colors.info + '15' }]}>
                      <Text style={tailwind`text-center text-lg mb-1`}>
                        {budgetPeriod === 'weekly' ? '🔥' : '📊'}
                      </Text>
                      <Text style={[tailwind`text-center text-xs`, { color: colors.textSecondary }]}>
                        {budgetPeriod === 'weekly' ? 'Active' : 'Standard'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Spacer for bottom padding */}
                <View style={tailwind`h-4`} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Budget Period Modal - Enhanced */}
        <Modal
          visible={showPeriodModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPeriodModal(false)}
        >
          <Pressable
            style={[tailwind`flex-1 justify-end`, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
            onPress={() => setShowPeriodModal(false)}
          >
            <View style={[tailwind`rounded-t-3xl p-6 shadow-2xl`, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={tailwind`flex-row items-center justify-between mb-6`}>
                <View>
                  <Text style={[tailwind`text-2xl font-bold mb-1`, { color: colors.text }]}>
                    Budget Period
                  </Text>
                  <Text style={[tailwind`text-sm`, { color: colors.textSecondary }]}>
                    Choose your budgeting cycle
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowPeriodModal(false)}
                  style={[tailwind`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: colors.border }]}
                >
                  <Text style={[tailwind`text-xl`, { color: colors.text }]}>✕</Text>
                </Pressable>
              </View>

              {/* Weekly Option */}
              <Pressable
                onPress={async () => {
                  if (budgetPeriod === 'weekly') {
                    setShowPeriodModal(false);
                    return;
                  }
                  setSavingPeriod(true);
                  await updateBudgetPeriod('weekly');
                  setSavingPeriod(false);
                  setShowPeriodModal(false);
                  Alert.alert('✅ Budget Period Updated', 'Your budget is now set to weekly cycle. It will reset every Monday at 12:00 AM.', [
                    { text: 'Got it', style: 'default' }
                  ]);
                }}
                disabled={savingPeriod}
                style={[tailwind`rounded-2xl mb-4 border-3 overflow-hidden shadow-sm`, {
                  backgroundColor: budgetPeriod === 'weekly' ? '#EEF2FF' : colors.surface,
                  borderColor: budgetPeriod === 'weekly' ? '#6366F1' : colors.border,
                  borderWidth: budgetPeriod === 'weekly' ? 3 : 2,
                }]}
              >
                {budgetPeriod === 'weekly' && (
                  <View style={[tailwind`absolute top-0 right-0 px-3 py-1 rounded-bl-xl`, { backgroundColor: '#6366F1' }]}>
                    <Text style={tailwind`text-white text-xs font-bold`}>ACTIVE</Text>
                  </View>
                )}

                <View style={tailwind`p-5`}>
                  <View style={tailwind`flex-row items-center mb-3`}>
                    <View style={[tailwind`w-14 h-14 rounded-2xl items-center justify-center mr-4`, {
                      backgroundColor: budgetPeriod === 'weekly' ? '#6366F1' : colors.border
                    }]}>
                      <Text style={tailwind`text-3xl`}>📆</Text>
                    </View>
                    <View style={tailwind`flex-1`}>
                      <Text style={[tailwind`text-xl font-bold`, {
                        color: budgetPeriod === 'weekly' ? '#6366F1' : colors.text
                      }]}>
                        Weekly Budget
                      </Text>
                      <Text style={[tailwind`text-xs mt-1`, { color: colors.textSecondary }]}>
                        7 days • 52 cycles per year
                      </Text>
                    </View>
                    {budgetPeriod === 'weekly' && (
                      <View style={[tailwind`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: '#6366F1' }]}>
                        <Text style={tailwind`text-white text-base font-bold`}>✓</Text>
                      </View>
                    )}
                  </View>

                  <View style={[tailwind`p-3 rounded-xl`, { backgroundColor: budgetPeriod === 'weekly' ? 'rgba(99,102,241,0.1)' : colors.border }]}>
                    <View style={tailwind`flex-row items-center mb-2`}>
                      <Text style={tailwind`mr-2`}>🔄</Text>
                      <Text style={[tailwind`text-sm font-semibold`, { color: colors.text }]}>
                        Resets every Monday
                      </Text>
                    </View>
                    <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>
                      Perfect for weekly planning and tracking short-term spending habits. Great for frequent budgeters.
                    </Text>
                  </View>
                </View>
              </Pressable>

              {/* Monthly Option */}
              <Pressable
                onPress={async () => {
                  if (budgetPeriod === 'monthly') {
                    setShowPeriodModal(false);
                    return;
                  }
                  setSavingPeriod(true);
                  await updateBudgetPeriod('monthly');
                  setSavingPeriod(false);
                  setShowPeriodModal(false);
                  Alert.alert('✅ Budget Period Updated', 'Your budget is now set to monthly cycle. It will reset on the 1st of each month.', [
                    { text: 'Got it', style: 'default' }
                  ]);
                }}
                disabled={savingPeriod}
                style={[tailwind`rounded-2xl mb-4 border-3 overflow-hidden shadow-sm`, {
                  backgroundColor: budgetPeriod === 'monthly' ? '#F5F3FF' : colors.surface,
                  borderColor: budgetPeriod === 'monthly' ? '#8B5CF6' : colors.border,
                  borderWidth: budgetPeriod === 'monthly' ? 3 : 2,
                }]}
              >
                {budgetPeriod === 'monthly' && (
                  <View style={[tailwind`absolute top-0 right-0 px-3 py-1 rounded-bl-xl`, { backgroundColor: '#8B5CF6' }]}>
                    <Text style={tailwind`text-white text-xs font-bold`}>ACTIVE</Text>
                  </View>
                )}

                <View style={tailwind`p-5`}>
                  <View style={tailwind`flex-row items-center mb-3`}>
                    <View style={[tailwind`w-14 h-14 rounded-2xl items-center justify-center mr-4`, {
                      backgroundColor: budgetPeriod === 'monthly' ? '#8B5CF6' : colors.border
                    }]}>
                      <Text style={tailwind`text-3xl`}>📅</Text>
                    </View>
                    <View style={tailwind`flex-1`}>
                      <Text style={[tailwind`text-xl font-bold`, {
                        color: budgetPeriod === 'monthly' ? '#8B5CF6' : colors.text
                      }]}>
                        Monthly Budget
                      </Text>
                      <Text style={[tailwind`text-xs mt-1`, { color: colors.textSecondary }]}>
                        ~30 days • 12 cycles per year
                      </Text>
                    </View>
                    {budgetPeriod === 'monthly' && (
                      <View style={[tailwind`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: '#8B5CF6' }]}>
                        <Text style={tailwind`text-white text-base font-bold`}>✓</Text>
                      </View>
                    )}
                  </View>

                  <View style={[tailwind`p-3 rounded-xl`, { backgroundColor: budgetPeriod === 'monthly' ? 'rgba(139,92,246,0.1)' : colors.border }]}>
                    <View style={tailwind`flex-row items-center mb-2`}>
                      <Text style={tailwind`mr-2`}>🔄</Text>
                      <Text style={[tailwind`text-sm font-semibold`, { color: colors.text }]}>
                        Resets on 1st of each month
                      </Text>
                    </View>
                    <Text style={[tailwind`text-xs`, { color: colors.textSecondary }]}>
                      Traditional budgeting approach aligned with monthly bills and salary cycles. Most popular choice.
                    </Text>
                  </View>
                </View>
              </Pressable>

              {savingPeriod && (
                <View style={[tailwind`p-4 rounded-xl mb-4 flex-row items-center justify-center`, { backgroundColor: colors.primary + '20' }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[tailwind`ml-3 font-semibold`, { color: colors.primary }]}>Saving to database...</Text>
                </View>
              )}

              <Pressable
                style={[tailwind`p-4 rounded-xl`, {
                  backgroundColor: colors.border,
                  opacity: savingPeriod ? 0.5 : 1
                }]}
                onPress={() => setShowPeriodModal(false)}
                disabled={savingPeriod}
              >
                <Text style={[tailwind`font-bold text-center`, { color: colors.text }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

export default Profile

const styles = StyleSheet.create({})