import { StyleSheet, Text, View, TextInput, Pressable, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import tailwind from 'twrnc';
import { useTheme } from '../context/ThemeContext';
import { useExpense } from '../context/ExpenseContext';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../constant';
import { userAPI, categoryAPI } from '../services/appwriteAPI';

const Onboarding = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { setBudget, setBatchCategoryBudgets, addMultipleCategories, completeOnboarding, setUser } = useExpense();
  const [loading, setLoading] = useState(false);
  
  // Get user data from registration
  const userName = route.params?.userName || 'User';
  const userEmail = route.params?.userEmail || '';
  const userPhone = route.params?.userPhone || '';
  
  const [step, setStep] = useState(1);
  const [totalBudget, setTotalBudget] = useState('');
  const [categories, setCategories] = useState([
    { name: 'Food', icon: '🍔', color: '#FF6B6B', budget: '' },
    { name: 'Shopping', icon: '🛍️', color: '#4ECDC4', budget: '' },
    { name: 'Transportation', icon: '🚗', color: '#95E1D3', budget: '' },
  ]);

  const handleAddCategory = () => {
    setCategories([...categories, { name: '', icon: '🎯', color: '#FFB347', budget: '' }]);
  };

  const handleUpdateCategory = (index, field, value) => {
    const updated = [...categories];
    updated[index][field] = value;
    setCategories(updated);
  };

  const handleRemoveCategory = (index) => {
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);
  };

  const handleFinish = async () => {
    // Validate budget
    const budgetAmount = parseFloat(totalBudget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid total budget');
      return;
    }

    // Calculate total of all category budgets
    let totalCategoryBudgets = 0;
    categories.forEach(cat => {
      if (cat.name && cat.name.trim() && cat.budget) {
        const catBudget = parseFloat(cat.budget);
        if (!isNaN(catBudget) && catBudget > 0) {
          totalCategoryBudgets += catBudget;
        }
      }
    });

    // Validate that total category budgets don't exceed total budget
    if (totalCategoryBudgets > budgetAmount) {
      Alert.alert(
        'Budget Exceeded',
        `Total category budgets (₹${totalCategoryBudgets.toFixed(2)}) exceed your total budget (₹${budgetAmount.toFixed(2)}).\\n\\nPlease adjust your category budgets or increase your total budget.`
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Update total budget in backend
      const budgetResult = await userAPI.updateBudget(budgetAmount);
      if (!budgetResult.success) {
        Alert.alert('Error', budgetResult.message || 'Failed to set budget');
        setLoading(false);
        return;
      }

      // 2. Prepare categories for backend
      const categoriesToCreate = categories
        .filter(cat => cat.name && cat.name.trim())
        .map(cat => ({
          name: cat.name.trim(),
          icon: cat.icon,
          color: cat.color,
          budget: parseFloat(cat.budget) || 0
        }));

      // 3. Create categories in backend
      if (categoriesToCreate.length > 0) {
        const categoryResult = await categoryAPI.createMultiple(categoriesToCreate);
        if (!categoryResult.success) {
          Alert.alert('Error', categoryResult.message || 'Failed to create categories');
          setLoading(false);
          return;
        }
      }

      // 4. Complete onboarding in backend
      const onboardingResult = await userAPI.completeOnboarding();
      if (!onboardingResult.success) {
        Alert.alert('Error', onboardingResult.message || 'Failed to complete onboarding');
        setLoading(false);
        return;
      }

      // 5. Update local context (for immediate UI updates)
      setUser({
        name: userName,
        email: userEmail,
        phone: userPhone
      });
      setBudget(budgetAmount);

      const validCategories = categories
        .filter(cat => cat.name && cat.name.trim())
        .map(cat => ({
          name: cat.name.trim(),
          icon: cat.icon,
          color: cat.color
        }));
      addMultipleCategories(validCategories);

      const budgetsToSet = {};
      categories.forEach(cat => {
        if (cat.name && cat.name.trim()) {
          const catBudget = parseFloat(cat.budget);
          if (!isNaN(catBudget) && catBudget > 0) {
            budgetsToSet[cat.name.trim()] = catBudget;
          }
        }
      });
      if (Object.keys(budgetsToSet).length > 0) {
        setBatchCategoryBudgets(budgetsToSet);
      }
      completeOnboarding();

      // Give a small delay to allow state to update, then navigate
      setTimeout(() => {
        Alert.alert(
          'Welcome to BudgetBuddy! 🎉',
          'Your budget has been set up successfully',
          [{ 
            text: 'Get Started', 
            onPress: () => {
              // Reset navigation stack to BottomTabs
              navigation.reset({
                index: 0,
                routes: [{ name: 'BottomTabs' }],
              });
            }
          }]
        );
      }, 300);
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
        <View style={tailwind`flex-1 px-6 py-8`}>
          {/* Header */}
          <View style={tailwind`items-center mb-10`}>
            <View style={[tailwind`w-24 h-24 rounded-full items-center justify-center mb-4 shadow-lg`, { backgroundColor: colors.primary + '20' }]}>
              <Text style={tailwind`text-5xl`}>💰</Text>
            </View>
            <Text style={[tailwind`text-3xl font-bold mb-2`, { color: colors.text }]}>Set Your Budget</Text>
            <Text style={[tailwind`text-base text-center px-4`, { color: colors.textSecondary }]}>
              Let's start by setting your monthly budget
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={tailwind`flex-row mb-10 gap-2`}>
            <View style={[tailwind`flex-1 h-2 rounded-full`, { backgroundColor: colors.primary }]} />
            <View style={[tailwind`flex-1 h-2 rounded-full`, { backgroundColor: colors.border }]} />
          </View>

          {/* Budget Input */}
          <View style={[tailwind`mb-8 p-6 rounded-3xl shadow-lg`, { backgroundColor: colors.surface }]}>
            <Text style={[tailwind`text-base font-bold mb-4 text-center`, { color: colors.textSecondary }]}>
              Monthly Budget Amount
            </Text>
            <View style={tailwind`flex-row items-center justify-center`}>
              <Text style={[tailwind`text-5xl mr-2`, { color: colors.primary }]}>₹</Text>
              <TextInput
                placeholder="10000"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                value={totalBudget}
                onChangeText={setTotalBudget}
                style={[tailwind`flex-1 p-4 rounded-2xl text-4xl font-bold shadow-sm`, {
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                  textAlign: 'center'
                }]}
              />
            </View>
          </View>

          <View style={[tailwind`p-5 rounded-2xl mb-8`, { backgroundColor: colors.info + '15', borderLeftWidth: 4, borderLeftColor: colors.info }]}>
            <Text style={[tailwind`text-sm font-semibold`, { color: colors.text }]}>
              💡 Pro Tip
            </Text>
            <Text style={[tailwind`text-sm mt-1`, { color: colors.textSecondary }]}>
              Set a realistic monthly budget based on your income and expenses. You can always adjust it later!
            </Text>
          </View>

          {/* Next Button */}
          <View style={tailwind`flex-1 justify-end`}>
            <Pressable
              onPress={() => {
                if (!totalBudget || parseFloat(totalBudget) <= 0) {
                  Alert.alert('Error', 'Please enter a valid budget amount');
                  return;
                }
                setStep(2);
              }}
              style={[tailwind`py-5 rounded-2xl shadow-lg`, { backgroundColor: colors.primary }]}
            >
              <Text style={tailwind`text-white text-center font-bold text-lg`}>Next →</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={tailwind`px-6 py-8`}>
        {/* Header */}
        <View style={tailwind`items-center mb-8`}>
          <View style={[tailwind`w-24 h-24 rounded-full items-center justify-center mb-4 shadow-lg`, { backgroundColor: colors.success + '20' }]}>
            <Text style={tailwind`text-5xl`}>📂</Text>
          </View>
          <Text style={[tailwind`text-3xl font-bold mb-2`, { color: colors.text }]}>Create Categories</Text>
          <Text style={[tailwind`text-base text-center px-4`, { color: colors.textSecondary }]}>
            Organize your spending into categories
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={tailwind`flex-row mb-8 gap-2`}>
          <View style={[tailwind`flex-1 h-2 rounded-full`, { backgroundColor: colors.primary }]} />
          <View style={[tailwind`flex-1 h-2 rounded-full`, { backgroundColor: colors.primary }]} />
        </View>

        {/* Categories */}
        {categories.map((cat, index) => (
          <View key={index} style={[tailwind`mb-4 p-5 rounded-2xl border-2 shadow-sm`, { 
            backgroundColor: colors.surface,
            borderColor: colors.border
          }]}>
            <View style={tailwind`flex-row items-center justify-between mb-4`}>
              <View style={tailwind`flex-row items-center`}>
                <View style={[tailwind`w-12 h-12 rounded-xl items-center justify-center mr-3`, { backgroundColor: cat.color + '30' }]}>
                  <Text style={tailwind`text-2xl`}>{cat.icon}</Text>
                </View>
                <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>Category {index + 1}</Text>
              </View>
              {categories.length > 1 && (
                <Pressable 
                  onPress={() => handleRemoveCategory(index)}
                  style={[tailwind`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: colors.error + '20' }]}
                >
                  <Text style={[tailwind`text-xl`, { color: colors.error }]}>🗑️</Text>
                </Pressable>
              )}
            </View>

            {/* Category Name */}
            <TextInput
              placeholder="Category Name (e.g., Food, Transport)"
              placeholderTextColor={colors.placeholder}
              value={cat.name}
              onChangeText={(text) => handleUpdateCategory(index, 'name', text)}
              style={[tailwind`p-4 rounded-xl mb-3 text-base border shadow-sm`, {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text
              }]}
            />

            {/* Budget Amount */}
            <TextInput
              placeholder="Budget Amount (Optional)"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              value={cat.budget}
              onChangeText={(text) => handleUpdateCategory(index, 'budget', text)}
              style={[tailwind`p-4 rounded-xl mb-4 text-base border shadow-sm`, {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.text
              }]}
            />

            {/* Icon Selection */}
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>Choose Icon</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={tailwind`mb-4`}
            >
              {AVAILABLE_ICONS.map((icon, iconIndex) => (
                <Pressable
                  key={iconIndex}
                  onPress={() => handleUpdateCategory(index, 'icon', icon)}
                  style={[
                    tailwind`p-3 m-1 rounded-xl border-2`,
                    { 
                      backgroundColor: cat.icon === icon ? colors.primary + '20' : colors.card,
                      borderColor: cat.icon === icon ? colors.primary : colors.border
                    }
                  ]}
                >
                  <Text style={tailwind`text-2xl`}>{icon}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Color Selection */}
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>Choose Color</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={tailwind`mb-2`}
            >
              {AVAILABLE_COLORS.map((color, colorIndex) => (
                <Pressable
                  key={colorIndex}
                  onPress={() => handleUpdateCategory(index, 'color', color)}
                  style={[
                    tailwind`w-10 h-10 m-1 rounded-full border-3`,
                    { backgroundColor: color },
                    cat.color === color 
                      ? { borderColor: colors.text, borderWidth: 3 }
                      : { borderColor: colors.border, borderWidth: 2 }
                  ]}
                />
              ))}
            </ScrollView>
          </View>
        ))}

        {/* Add Category Button */}
        <Pressable
          onPress={handleAddCategory}
          style={[tailwind`py-4 rounded-2xl mb-6 border-2 flex-row items-center justify-center shadow-sm`, {
            borderColor: colors.primary,
            backgroundColor: colors.primary + '10'
          }]}
        >
          <Text style={tailwind`text-2xl mr-2`}>➕</Text>
          <Text style={[tailwind`font-bold text-base`, { color: colors.primary }]}>Add Another Category</Text>
        </Pressable>

        {/* Buttons */}
        <View style={tailwind`flex-row gap-3 mb-6`}>
          <Pressable
            onPress={() => setStep(1)}
            style={[tailwind`flex-1 py-4 rounded-2xl border-2 shadow-sm`, {
              borderColor: colors.border,
              backgroundColor: colors.surface
            }]}
          >
            <Text style={[tailwind`text-center font-bold text-base`, { color: colors.text }]}>← Back</Text>
          </Pressable>

          <Pressable
            onPress={handleFinish}
            disabled={loading}
            style={[tailwind`flex-1 py-4 rounded-2xl shadow-lg`, { backgroundColor: colors.success, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tailwind`text-white text-center font-bold text-base`}>Finish 🎉</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Onboarding;

const styles = StyleSheet.create({});
