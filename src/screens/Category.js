//Modal screen for creating a new category and selecting new category.
import { Pressable, StyleSheet, Text, View, FlatList, TextInput, Modal, ScrollView } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient';
import tailwind from 'twrnc'
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../constant'
import { useExpense } from '../context/ExpenseContext'
import { useTheme } from '../context/ThemeContext'

const Category = ({ navigation, route }) => {
    const { getAllCategories, addCustomCategory, categoryBudgets, getCategorySpending } = useExpense();
    const { colors } = useTheme();
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [newCategoryName, setNewCategoryName] = React.useState('');
    const [selectedIcon, setSelectedIcon] = React.useState('🎯');
    const [selectedColor, setSelectedColor] = React.useState('#FFB347');

    const categories = getAllCategories() || [];
    const fromScreen = route.params?.fromScreen || 'Create';
    const expenseData = route.params?.expense;
    const preservedAmount = route.params?.preservedAmount;
    const preservedTitle = route.params?.preservedTitle;

    const renderItem = ({ item }) => {
        const budget = categoryBudgets[item.name] || 0;
        const spent = getCategorySpending(item.name);
        const remaining = budget - spent;
        const percentage = budget > 0 ? (spent / budget) * 100 : 0;

        return (
            <Pressable
                onPress={() => handleSelectedCategory(item)}
                style={[tailwind`m-2 shadow-lg p-4 rounded-3xl flex-1 border-2`, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                }]}>
                <View style={[tailwind`w-16 h-16 rounded-2xl items-center justify-center mb-3 self-center shadow-sm`, { backgroundColor: item.color + '30' }]}>
                    <Text style={tailwind`text-3xl`}>{item.icon}</Text>
                </View>
                <Text style={[tailwind`text-center text-sm font-bold mb-2`, { color: colors.text }]}>{item.name}</Text>

                {budget > 0 && (
                    <View style={tailwind`mt-1`}>
                        <View style={tailwind`flex-row justify-between mb-1`}>
                            <Text style={[tailwind`text-xs font-semibold`, { color: colors.textSecondary }]}>
                                ₹{spent.toFixed(0)}
                            </Text>
                            <Text style={[tailwind`text-xs font-semibold`, { color: colors.textSecondary }]}>
                                ₹{budget.toFixed(0)}
                            </Text>
                        </View>
                        <View style={[tailwind`h-1.5 rounded-full overflow-hidden`, { backgroundColor: colors.border }]}>
                            <View style={[
                                tailwind`h-full rounded-full`,
                                {
                                    width: `${Math.min(percentage, 100)}%`,
                                    backgroundColor: percentage > 100 ? '#EF4444' : percentage > 80 ? '#F59E0B' : item.color
                                }
                            ]} />
                        </View>
                        <Text style={[tailwind`text-xs mt-1 text-center font-bold`, {
                            color: remaining < 0 ? '#EF4444' : colors.success
                        }]}>
                            {remaining >= 0 ? `₹${remaining.toFixed(0)} left` : `₹${Math.abs(remaining).toFixed(0)} over`}
                        </Text>
                    </View>
                )}
            </Pressable>
        );
    };

    const handleSelectedCategory = (item) => {
        if (fromScreen === 'ExpenseDetails') {
            navigation.navigate('ExpenseDetails', { item });
        } else {
            // Pass back the selected category along with preserved data
            navigation.navigate({
                name: 'BottomTabs',
                params: {
                    screen: fromScreen,
                    params: {
                        item,
                        preservedAmount,
                        preservedTitle
                    }
                },
                merge: true
            });
        }
    }

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) {
            alert('Please enter a category name');
            return;
        }

        const result = addCustomCategory({
            name: newCategoryName.trim(),
            icon: selectedIcon,
            color: selectedColor
        });

        if (result.success) {
            setShowAddModal(false);
            setNewCategoryName('');
            setSelectedIcon('🎯');
            setSelectedColor('#FFB347');
            alert('Category added successfully!');
        } else {
            alert(result.message);
        }
    };

    return (
        <View style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.primaryDark, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tailwind`px-6 pt-6 pb-8 rounded-b-3xl shadow-lg`}
            >
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={[tailwind`w-10 h-10 rounded-full items-center justify-center mb-4`, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                >
                    <Text style={tailwind`text-2xl text-white font-bold`}>×</Text>
                </Pressable>

                <Text style={tailwind`text-3xl font-bold text-white`}>
                    Select Category
                </Text>
                <Text style={tailwind`text-base mt-2 text-white opacity-90`}>
                    Choose a category or create your own
                </Text>
            </LinearGradient>

            <View style={tailwind`mt-4`} />

            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.name + index}
                numColumns={2}
                columnWrapperStyle={tailwind`px-5`}
                ListFooterComponent={
                    <View style={tailwind`px-5 mt-4 mb-6`}>
                        <Pressable
                            onPress={() => setShowAddModal(true)}
                            style={({ pressed }) => [
                                tailwind`rounded-2xl shadow-lg overflow-hidden`,
                                { transform: [{ scale: pressed ? 0.98 : 1 }] }
                            ]}
                        >
                            <LinearGradient
                                colors={[colors.success, '#059669']}
                                style={tailwind`p-5 flex-row justify-center items-center`}
                            >
                                <Text style={tailwind`text-3xl mr-2`}>➕</Text>
                                <Text style={tailwind`text-white text-lg font-bold`}>Create Custom Category</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                }
            />

            {/* Add Category Modal */}
            <Modal
                visible={showAddModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={[tailwind`flex-1 justify-end`, { backgroundColor: colors.overlay }]}>
                    <ScrollView style={[tailwind`rounded-t-3xl p-6 max-h-[90%]`, { backgroundColor: colors.surface }]}>
                        <Text style={[tailwind`text-2xl font-bold mb-4`, { color: colors.text }]}>
                            Create Category
                        </Text>

                        {/* Category Name */}
                        <Text style={[tailwind`text-base font-semibold mb-2`, { color: colors.textSecondary }]}>
                            Category Name
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
                                            : tailwind`border-gray-300`
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
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={tailwind`flex-row gap-3 mb-6`}>
                            <Pressable
                                style={[tailwind`flex-1 p-4 rounded-xl`, { backgroundColor: colors.border }]}
                                onPress={() => {
                                    setShowAddModal(false);
                                    setNewCategoryName('');
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
                                    <Text style={tailwind`text-white font-bold text-center`}>Add Category</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

export default Category

const styles = StyleSheet.create({})