import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useExpense } from '../context/ExpenseContext';
import tailwind from 'twrnc';
import { exportExpensesAsPDF } from '../services/pdfService';
import { Ionicons } from '@expo/vector-icons';
import ExpenceItemCard from '../components/ExpenceItemCard';

const PDFExportScreen = ({ navigation }) => {
    const { colors, isDarkMode } = useTheme();
    const { expenses, userData, totalBudget } = useExpense();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'all'
    const [filterType, setFilterType] = useState('All'); // All, Expense, Income
    const [loading, setLoading] = useState(false);

    // Month navigation
    const nextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const prevMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const nextYear = () => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(newDate.getFullYear() + 1);
        setCurrentDate(newDate);
    };

    const prevYear = () => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(newDate.getFullYear() - 1);
        setCurrentDate(newDate);
    };

    // Helper to determine income
    const isIncome = (expense) => {
        const cat = expense.category?.toLowerCase() || '';
        return cat === 'income' || cat === 'salary' || cat === 'deposit' || cat === 'credit' || (expense.amount < 0);
    };

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            if (viewMode === 'monthly') {
                const expDate = new Date(exp.date);
                const sameMonth = expDate.getMonth() === currentDate.getMonth();
                const sameYear = expDate.getFullYear() === currentDate.getFullYear();
                if (!sameMonth || !sameYear) return false;
            }

            if (filterType === 'All') return true;
            if (filterType === 'Expense') return !isIncome(exp);
            if (filterType === 'Income') return isIncome(exp);
            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first for app view usually
    }, [expenses, currentDate, filterType, viewMode]);

    const totalIncome = filteredExpenses.reduce((sum, exp) => isIncome(exp) ? sum + Math.abs(exp.amount) : sum, 0);
    const totalExpense = filteredExpenses.reduce((sum, exp) => !isIncome(exp) ? sum + Math.abs(exp.amount) : sum, 0);
    const balance = totalIncome - totalExpense;

    const handleExport = async () => {
        setLoading(true);

        let monthName = "";
        let year = "";

        if (viewMode === 'monthly') {
            monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
            year = currentDate.getFullYear();
        } else {
            monthName = "All Time";
            year = "";
        }

        // Pass sorted oldest-first for the PDF report as usually reports are chronological
        const expensesForReport = [...filteredExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));

        const result = await exportExpensesAsPDF({
            expenses: expensesForReport,
            totalBudget,
            budgetPeriod: 'monthly',
            userData,
            totalSpent: totalExpense,
            monthName,
            year
        });

        setLoading(false);
        if (!result.success) {
            Alert.alert('Export Failed', result.error);
        }
    };

    return (
        <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
            {/* Header / Month Select */}
            <View style={[tailwind`p-4 shadow-sm z-10`, { backgroundColor: colors.surface }]}>
                {/* User & Title */}
                <View style={tailwind`mb-4`}>
                    <Text style={[tailwind`text-2xl font-bold`, { color: colors.text }]}>Transaction History</Text>
                    <Text style={[tailwind`text-sm`, { color: colors.textSecondary }]}>View and export your report</Text>
                </View>

                {/* View Mode Toggle */}
                <View style={[tailwind`flex-row p-1 rounded-xl mb-4`, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F3F4F6' }]}>
                    <Pressable
                        onPress={() => setViewMode('monthly')}
                        style={[
                            tailwind`flex-1 py-2 rounded-lg items-center`,
                            { backgroundColor: viewMode === 'monthly' ? (isDarkMode ? '#333' : '#FFFFFF') : 'transparent', shadowOpacity: viewMode === 'monthly' ? 0.1 : 0 }
                        ]}
                    >
                        <Text style={[tailwind`font-bold`, { color: viewMode === 'monthly' ? colors.primary : colors.textSecondary }]}>Monthly View</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setViewMode('all')}
                        style={[
                            tailwind`flex-1 py-2 rounded-lg items-center`,
                            { backgroundColor: viewMode === 'all' ? (isDarkMode ? '#333' : '#FFFFFF') : 'transparent', shadowOpacity: viewMode === 'all' ? 0.1 : 0 }
                        ]}
                    >
                        <Text style={[tailwind`font-bold`, { color: viewMode === 'all' ? colors.primary : colors.textSecondary }]}>All Transactions</Text>
                    </Pressable>
                </View>

                {/* Date Controls (Only visible in Monthly mode) */}
                {viewMode === 'monthly' && (
                    <View style={tailwind`flex-row justify-between mb-4 gap-3`}>
                        {/* Month Picker */}
                        <View style={[tailwind`flex-1 flex-row items-center justify-between px-3 py-3 rounded-2xl border`, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB', borderColor: colors.border }]}>
                            <Pressable onPress={prevMonth} hitSlop={10}>
                                <Ionicons name="chevron-back" size={22} color={colors.primary} />
                            </Pressable>
                            <Text style={[tailwind`font-bold text-base`, { color: colors.text }]}>
                                {currentDate.toLocaleDateString('en-US', { month: 'long' })}
                            </Text>
                            <Pressable onPress={nextMonth} hitSlop={10}>
                                <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                            </Pressable>
                        </View>

                        {/* Year Picker */}
                        <View style={[tailwind`w-1/3 flex-row items-center justify-between px-3 py-3 rounded-2xl border`, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB', borderColor: colors.border }]}>
                            <Pressable onPress={prevYear} hitSlop={10}>
                                <Ionicons name="chevron-back" size={22} color={colors.primary} />
                            </Pressable>
                            <Text style={[tailwind`font-bold text-base`, { color: colors.text }]}>
                                {currentDate.getFullYear()}
                            </Text>
                            <Pressable onPress={nextYear} hitSlop={10}>
                                <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Summary Cards */}
                <View style={tailwind`flex-row gap-3 mb-2`}>
                    <View style={[tailwind`flex-1 p-3 rounded-2xl border border-green-100 bg-green-50 justify-center`]}>
                        <Text style={tailwind`text-xs text-green-600 font-bold uppercase mb-1`}>Income</Text>
                        <Text style={tailwind`text-lg font-bold text-green-700`}>₹{totalIncome.toFixed(0)}</Text>
                    </View>
                    <View style={[tailwind`flex-1 p-3 rounded-2xl border border-red-100 bg-red-50 justify-center`]}>
                        <Text style={tailwind`text-xs text-red-600 font-bold uppercase mb-1`}>Expense</Text>
                        <Text style={tailwind`text-lg font-bold text-red-700`}>₹{totalExpense.toFixed(0)}</Text>
                    </View>
                    <View style={[tailwind`flex-1 p-3 rounded-2xl border border-blue-100 bg-blue-50 justify-center`]}>
                        <Text style={tailwind`text-xs text-blue-600 font-bold uppercase mb-1`}>Balance</Text>
                        <Text style={tailwind`text-lg font-bold text-blue-700`}>₹{balance.toFixed(0)}</Text>
                    </View>
                </View>
            </View>

            {/* Transaction List */}
            <View style={[tailwind`flex-1 px-4 pt-4`, { backgroundColor: colors.background }]}>
                <View style={tailwind`flex-row justify-between items-center mb-3`}>
                    <Text style={[tailwind`text-lg font-bold`, { color: colors.text }]}>
                        {viewMode === 'all' ? 'All Transactions' : 'Monthly Transactions'}
                    </Text>
                    <Text style={[tailwind`text-sm`, { color: colors.textSecondary }]}>{filteredExpenses.length} records</Text>
                </View>

                <FlatList
                    data={filteredExpenses}
                    renderItem={({ item }) => <ExpenceItemCard item={item} />}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={tailwind`pb-24`}
                    ListEmptyComponent={
                        <View style={tailwind`items-center justify-center py-10 opacity-50`}>
                            <Ionicons name="documents-outline" size={48} color={colors.textSecondary} />
                            <Text style={[tailwind`mt-2 text-base`, { color: colors.textSecondary }]}>No transactions found</Text>
                        </View>
                    }
                />
            </View>

            {/* Export Button */}
            <View style={[tailwind`absolute bottom-0 left-0 right-0 p-4 border-t`, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Pressable
                    onPress={handleExport}
                    disabled={loading || filteredExpenses.length === 0}
                    style={({ pressed }) => [
                        tailwind`flex-row items-center justify-center py-4 rounded-2xl shadow-sm`,
                        {
                            backgroundColor: (loading || filteredExpenses.length === 0) ? colors.border : colors.primary,
                            opacity: pressed ? 0.9 : 1
                        }
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Ionicons name="document-text-outline" size={22} color="white" style={tailwind`mr-2`} />
                            <Text style={tailwind`text-white font-bold text-lg`}>Download PDF Report</Text>
                        </>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
};

export default PDFExportScreen;
