import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, Alert, Modal, Switch, SafeAreaView } from 'react-native'
import React, { useState } from 'react'
import tailwind from 'twrnc'
import { useExpense } from '../context/ExpenseContext'
import { useTheme } from '../context/ThemeContext'
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../constant'
import { authAPI } from '../services/appwriteAPI'

const Profile = ({ navigation }) => {
  const { 
    totalBudget, 
    setBudget, 
    categoryBudgets, 
    setCategoryBudget,
    getCategoryBudgetStatus,
    getTotalSpending,
    getAllCategories,
    addCustomCategory,
    userData,
    clearAllData
  } = useExpense();
  
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const categories = getAllCategories() || [];

  const [budgetInput, setBudgetInput] = useState(totalBudget.toString());
  const [categoryInputs, setCategoryInputs] = useState({});
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // New category fields
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [selectedColor, setSelectedColor] = useState('#FFB347');

  const handleSetBudget = () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid budget amount");
      return;
    }

    // Calculate total of all category budgets
    const totalCategoryBudgets = Object.values(categoryBudgets).reduce((sum, budget) => sum + budget, 0);
    
    // Ensure new total budget is not less than sum of category budgets
    if (amount < totalCategoryBudgets) {
      Alert.alert(
        "Budget Too Low",
        `Your total budget cannot be less than your allocated category budgets.\n\nCategory Budgets Total: ₹${totalCategoryBudgets.toFixed(2)}\n\nPlease set a budget ≥ ₹${totalCategoryBudgets.toFixed(2)} or reduce your category budgets first.`
      );
      return;
    }

    setBudget(amount);
    setShowEditBudgetModal(false);
    Alert.alert("Success", `Monthly budget set to ₹${amount.toFixed(2)}`);
  };

  const handleEditBudget = () => {
    setBudgetInput(totalBudget.toString());
    setShowEditBudgetModal(true);
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

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const result = addCustomCategory({
      name: newCategoryName.trim(),
      icon: selectedIcon,
      color: selectedColor
    });

    if (result.success) {
      // Set budget if provided
      if (newCategoryBudget && parseFloat(newCategoryBudget) > 0) {
        const newBudgetAmount = parseFloat(newCategoryBudget);
        
        // Calculate current total of all category budgets
        const currentTotalCategoryBudgets = Object.values(categoryBudgets).reduce((sum, budget) => sum + budget, 0);
        
        // Check if adding this budget would exceed total budget
        if (currentTotalCategoryBudgets + newBudgetAmount > totalBudget) {
          const available = totalBudget - currentTotalCategoryBudgets;
          Alert.alert(
            'Budget Exceeded',
            `Adding this category budget would exceed your total budget.\n\nTotal Budget: ₹${totalBudget.toFixed(2)}\nAllocated: ₹${currentTotalCategoryBudgets.toFixed(2)}\nAvailable: ₹${available.toFixed(2)}\n\nPlease set a budget ≤ ₹${available.toFixed(2)}`
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
    setCategoryInputs({...categoryInputs, [category.name]: currentBudget.toString()});
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
    const currentBudget = categoryBudgets[editingCategory.name] || 0;
    const otherCategoriesBudgets = Object.entries(categoryBudgets)
      .filter(([name]) => name !== editingCategory.name)
      .reduce((sum, [, budget]) => sum + budget, 0);
    
    // Check if new total would exceed total budget
    if (otherCategoriesBudgets + amount > totalBudget) {
      const maxAllowed = totalBudget - otherCategoriesBudgets;
      Alert.alert(
        'Budget Exceeded',
        `This budget would exceed your total budget.\n\nTotal Budget: ₹${totalBudget.toFixed(2)}\nOther Categories: ₹${otherCategoriesBudgets.toFixed(2)}\nMax Allowed: ₹${maxAllowed.toFixed(2)}\n\nPlease set a budget ≤ ₹${maxAllowed.toFixed(2)}`
      );
      return;
    }
    
    setCategoryBudget(editingCategory.name, amount);
    setShowEditCategoryModal(false);
    setEditingCategory(null);
    Alert.alert("Success", `Budget for ${editingCategory.name} updated to ₹${amount.toFixed(2)}`);
  };

  const totalAllocated = Object.values(categoryBudgets).reduce((sum, val) => sum + val, 0);
  const allocationPercentage = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
  const totalSpent = getTotalSpending();

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <ScrollView style={[tailwind`flex-1`, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Modern Header */}
        <View style={[tailwind`px-6 pt-6 pb-8`, { backgroundColor: colors.primary }]}>
          <View style={tailwind`flex-row justify-between items-center mb-6`}>
            <View style={tailwind`flex-1`}>
              <Text style={tailwind`text-3xl font-bold text-white`}>Profile</Text>
              <Text style={tailwind`text-white opacity-80 text-sm mt-1`}>
                Manage your finances
              </Text>
            </View>
            
            {/* Theme Toggle */}
            <View style={tailwind`flex-row items-center bg-white bg-opacity-15 rounded-full px-3 py-2 mr-2`}>
              <Text style={tailwind`text-base mr-2`}>{isDarkMode ? '🌙' : '☀️'}</Text>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#FFFFFF40', true: '#8B5CF6' }}
                thumbColor='#FFFFFF'
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>
            
            {/* Logout Button */}
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
                        navigation.replace('Login');
                      }
                    }
                  ]
                );
              }}
              style={[tailwind`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            >
              <Text style={tailwind`text-xl`}>🚪</Text>
            </Pressable>
          </View>
          
          {/* User Info */}
          <View style={[tailwind`flex-row items-center p-4 rounded-2xl`, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <View style={[tailwind`w-14 h-14 rounded-full items-center justify-center mr-3`, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
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
          </View>
        </View>

        {/* Total Budget Card */}
        <View style={[tailwind`mx-5 -mt-6 rounded-3xl p-6 shadow-lg`, { backgroundColor: colors.surface }]}>
          <View style={tailwind`flex-row justify-between items-start mb-4`}>
            <View style={tailwind`flex-1`}>
              <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>💰 Monthly Budget</Text>
              {totalBudget > 0 ? (
                <>
                  <Text style={[tailwind`text-4xl font-bold`, { color: colors.text }]}>
                    ₹{totalBudget.toFixed(0)}
                  </Text>
                  <View style={tailwind`flex-row items-center mt-2`}>
                    <Text style={[tailwind`text-sm`, { color: colors.textSecondary }]}>
                      Spent: ₹{totalSpent.toFixed(0)}
                    </Text>
                    <View style={[tailwind`ml-2 px-2 py-0.5 rounded-full`, { 
                      backgroundColor: totalSpent > totalBudget ? colors.error + '20' : colors.success + '20' 
                    }]}>
                      <Text style={[tailwind`text-xs font-bold`, { 
                        color: totalSpent > totalBudget ? colors.error : colors.success 
                      }]}>
                        {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={[tailwind`text-2xl font-bold`, { color: colors.textSecondary }]}>Not Set</Text>
              )}
            </View>
            <Pressable
              style={[tailwind`px-5 py-2.5 rounded-xl shadow-sm`, { backgroundColor: colors.primary }]}
              onPress={totalBudget > 0 ? handleEditBudget : () => setShowEditBudgetModal(true)}
            >
              <Text style={tailwind`text-white font-bold text-sm`}>
                {totalBudget > 0 ? 'Edit' : 'Set'}
              </Text>
            </Pressable>
          </View>

          {totalBudget > 0 && (
            <>
              {/* Progress Bar */}
              <View style={[tailwind`h-3 rounded-full overflow-hidden mb-4`, { backgroundColor: colors.borderLight }]}>
                <View 
                  style={[tailwind`h-full rounded-full`, { 
                    width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
                    backgroundColor: totalSpent > totalBudget ? colors.error : totalSpent > totalBudget * 0.8 ? colors.warning : colors.success
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
                    color: totalBudget - totalSpent < 0 ? colors.error : colors.success 
                  }]}>
                    ₹{Math.max(totalBudget - totalSpent, 0).toFixed(0)}
                  </Text>
                </View>
                <View style={tailwind`flex-1 items-center`}>
                  <Text style={[tailwind`text-xs mb-1`, { color: colors.textSecondary }]}>Unallocated</Text>
                  <Text style={[tailwind`text-base font-bold`, { 
                    color: totalBudget - totalAllocated < 0 ? colors.error : colors.textSecondary 
                  }]}>
                    ₹{(totalBudget - totalAllocated).toFixed(0)}
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
            style={[tailwind`px-5 py-2 rounded-xl shadow-sm`, { backgroundColor: colors.success }]}
            onPress={() => setShowAddCategoryModal(true)}
          >
            <Text style={tailwind`text-white font-bold text-sm`}>➕ Add</Text>
          </Pressable>
        </View>

        {categories.map((category, index) => {
          const status = getCategoryBudgetStatus(category.name);
          
          return (
            <View key={index} style={[tailwind`rounded-3xl p-5 mb-3 shadow-sm`, { backgroundColor: colors.surface }]}>
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
                <Pressable
                  style={[tailwind`px-4 py-2 rounded-xl shadow-sm`, { backgroundColor: colors.primary }]}
                  onPress={() => handleEditCategory(category)}
                >
                  <Text style={tailwind`text-white font-semibold text-xs`}>Edit</Text>
                </Pressable>
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
            </View>
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
              {totalBudget > 0 ? 'Edit Budget' : 'Set Budget'}
            </Text>

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
                style={[tailwind`flex-1 p-4 rounded-xl`, { backgroundColor: colors.primary }]}
                onPress={handleSetBudget}
              >
                <Text style={tailwind`text-white font-bold text-center`}>Save</Text>
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
          <ScrollView style={[tailwind`rounded-t-3xl p-6 max-h-[90%]`, { backgroundColor: colors.surface }]}>
            <Text style={[tailwind`text-2xl font-bold mb-4`, { color: colors.text }]}>
              Create New Category
            </Text>

            {/* Category Name */}
            <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>
              Category Name *
            </Text>
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
            <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>
              Monthly Budget (Optional)
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
                style={[tailwind`flex-1 p-4 rounded-xl`, { backgroundColor: colors.primary }]}
                onPress={handleAddCategory}
              >
                <Text style={tailwind`text-white font-bold text-center`}>Create</Text>
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
                  onChangeText={(text) => setCategoryInputs({...categoryInputs, [editingCategory.name]: text})}
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
                    style={[tailwind`flex-1 p-4 rounded-xl`, { backgroundColor: colors.success }]}
                    onPress={handleSaveEditCategory}
                  >
                    <Text style={tailwind`text-white font-bold text-center`}>Save</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile

const styles = StyleSheet.create({})