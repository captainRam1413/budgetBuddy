import { StyleSheet, Text, View, TextInput, Pressable, SafeAreaView, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import tailwind from 'twrnc';
import { useTheme } from '../context/ThemeContext';
import { useExpense } from '../context/ExpenseContext';
import { expenseAPI } from '../services/appwriteAPI';

const ExpenseDetails = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { updateExpense, deleteExpense } = useExpense();
  
  // Store initial expense from route params on first mount
  const [initialExpense] = useState(route.params?.expense);
  
  const [amount, setAmount] = useState(initialExpense?.amount.toString() || '');
  const [title, setTitle] = useState(initialExpense?.title || '');
  const [category, setCategory] = useState({
    name: initialExpense?.category || '',
    icon: initialExpense?.icon || '🎯',
    color: initialExpense?.color || '#FFB347'
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Safety check on mount only
  React.useEffect(() => {
    if (!initialExpense) {
      Alert.alert('Error', 'Expense not found', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, []);

  // Handle category selection from Category screen
  React.useEffect(() => {
    if (route.params?.item) {
      const { item } = route.params;
      setCategory(item);
      // Clear the params after using them
      navigation.setParams({ item: undefined });
    }
  }, [route.params?.item]);

  if (!initialExpense) {
    return null;
  }

  const handleUpdate = async () => {
    if (!amount || !title || !category.name) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const updatedAmount = parseFloat(amount);
    if (isNaN(updatedAmount) || updatedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Update in backend
      const result = await expenseAPI.update(
        initialExpense.id,
        title,
        updatedAmount,
        category.name,
        category.icon,
        category.color
      );

      if (result.success) {
        // Update local context
        updateExpense(initialExpense.id, {
          title,
          amount: updatedAmount,
          category: category.name,
          icon: category.icon,
          color: category.color
        });

        Alert.alert('Success', 'Expense updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to update expense');
      }
    } catch (error) {
      console.error('Update expense error:', error);
      Alert.alert('Error', 'Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await expenseAPI.delete(initialExpense.id);
              
              if (result.success) {
                deleteExpense(initialExpense.id);
                Alert.alert('Success', 'Expense deleted successfully', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Error', result.message || 'Failed to delete expense');
              }
            } catch (error) {
              console.error('Delete expense error:', error);
              Alert.alert('Error', 'Failed to delete expense');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCategoryInput = () => {
    navigation.navigate('Category', { 
      fromScreen: 'ExpenseDetails'
    });
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
          <View style={tailwind`mb-8`}>
            <View style={tailwind`flex-row justify-between items-center mb-2`}>
              <Text style={[tailwind`text-3xl font-bold`, { color: colors.text }]}>
                {isEditing ? 'Edit Expense' : 'Expense Details'}
              </Text>
              {!isEditing && (
                <Pressable onPress={() => setIsEditing(true)}>
                  <Text style={tailwind`text-2xl`}>✏️</Text>
                </Pressable>
              )}
            </View>
            <Text style={[tailwind`text-base`, { color: colors.textSecondary }]}>
              {initialExpense.date}
            </Text>
          </View>

          {/* Amount */}
          <View style={tailwind`mb-5`}>
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>💵 Amount</Text>
            <TextInput 
              placeholder="₹0.00" 
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
              editable={isEditing}
              style={[tailwind`p-4 rounded-2xl text-lg shadow-sm`, { 
                backgroundColor: isEditing ? colors.input : colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                opacity: isEditing ? 1 : 0.7
              }]} 
              value={amount}
              onChangeText={setAmount}
            />
            {amount && parseFloat(amount) > 0 && (
              <Text style={[tailwind`text-xs mt-1`, { color: colors.success || '#10b981' }]}>
                ✓ Amount: ₹{parseFloat(amount).toFixed(2)}
              </Text>
            )}
          </View>

          {/* Title */}
          <View style={tailwind`mb-5`}>
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>📝 Description</Text>
            <TextInput 
              placeholder="e.g., Grocery Shopping" 
              placeholderTextColor={colors.placeholder}
              returnKeyType="done"
              editable={isEditing}
              style={[tailwind`p-4 rounded-2xl text-lg shadow-sm`, { 
                backgroundColor: isEditing ? colors.input : colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                opacity: isEditing ? 1 : 0.7
              }]} 
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category */}
          <View style={tailwind`mb-8`}>
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>📊 Category</Text>
            <Pressable 
              onPress={isEditing ? handleCategoryInput : null}
              disabled={!isEditing}
              style={[tailwind`p-4 rounded-2xl flex-row justify-between items-center shadow-sm`, {
                backgroundColor: isEditing ? colors.input : colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: isEditing ? 1 : 0.7
              }]}
            >
              <View style={tailwind`flex-row items-center`}>
                <View style={[tailwind`w-10 h-10 rounded-xl items-center justify-center mr-3`, { 
                  backgroundColor: category.color ? category.color + '30' : colors.border 
                }]}>
                  <Text style={tailwind`text-xl`}>{category.icon || '🎯'}</Text>
                </View>
                <Text style={[tailwind`text-base font-semibold`, { color: colors.text }]}>
                  {category.name || 'Select Category'}
                </Text>
              </View>
              {isEditing && (
                <Text style={[tailwind`text-xl`, { color: colors.textSecondary }]}>›</Text>
              )}
            </Pressable>
          </View>

          {/* Action Buttons */}
          {isEditing ? (
            <View>
              <Pressable
                style={({ pressed }) => [
                  tailwind`p-5 rounded-2xl mb-3 shadow-lg`, 
                  { 
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={handleUpdate}
                disabled={loading}
              >
                <Text style={tailwind`text-white text-lg font-bold text-center`}>
                  {loading ? '⏳ Saving...' : '💾 Save Changes'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  tailwind`p-5 rounded-2xl shadow-lg`, 
                  { 
                    backgroundColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => {
                  setAmount(initialExpense.amount.toString());
                  setTitle(initialExpense.title);
                  setCategory({
                    name: initialExpense.category,
                    icon: initialExpense.icon,
                    color: initialExpense.color
                  });
                  setIsEditing(false);
                }}
                disabled={loading}
              >
                <Text style={[tailwind`text-lg font-bold text-center`, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                tailwind`p-5 rounded-2xl shadow-lg`, 
                { 
                  backgroundColor: colors.error || '#ef4444',
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                }
              ]}
              onPress={handleDelete}
              disabled={loading}
            >
              <Text style={tailwind`text-white text-lg font-bold text-center`}>
                {loading ? '⏳ Deleting...' : '🗑️ Delete Expense'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ExpenseDetails;

const styles = StyleSheet.create({});
