import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI, categoryAPI, expenseAPI, authAPI } from './api';
import { DEFAULT_CATEGORIES } from './constants';

export const ExpenseContext = createContext();

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [baseBudget, setBaseBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [customCategories, setCustomCategories] = useState([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userData, setUserData] = useState({ id: '', name: '', email: '', phone: '', totalBudget: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [budgetPeriod, setBudgetPeriod] = useState('monthly');
  const [isAuthenticated, setIsAuthenticated] = useState(authAPI.isAuthenticated());
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const getPeriodStartDate = () => {
    const now = new Date();
    if (budgetPeriod === 'weekly') {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      return monthStart;
    }
  };

  const isIncome = (expense) => {
    if (expense.type === 'credit') return true;
    if (expense.type === 'debit') return false;
    const cat = expense.category?.toLowerCase() || '';
    return cat === 'income' || cat === 'salary' || cat === 'deposit' || cat === 'credit';
  };

  const getIncomeForCurrentPeriod = () => {
    const periodStart = getPeriodStartDate();
    const income = expenses
      .filter(exp => new Date(exp.date) >= periodStart && isIncome(exp))
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    return Number.isFinite(income) ? income : 0;
  };

  const totalBudgetCalc = Number(baseBudget) + Number(getIncomeForCurrentPeriod());
  const totalBudget = Number.isFinite(totalBudgetCalc) ? totalBudgetCalc : 0;

  const loadUserData = async () => {
    if (!authAPI.isAuthenticated()) {
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }

    setIsLoading(true);
    try {
      const profileResult = await userAPI.getProfile();
      if (profileResult.success) {
        const user = profileResult.user;
        const totalBudgetNum = Number(parseFloat(user.totalBudget) || 0);
        setBaseBudget(totalBudgetNum);
        setUserData({
          id: user.id || user.$id,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          totalBudget: totalBudgetNum
        });
        setHasCompletedOnboarding(user.hasCompletedOnboarding || false);
        setBudgetPeriod(user.budgetPeriod || 'monthly');
        setIsAuthenticated(true);
      } else {
        authAPI.logout();
        setIsAuthenticated(false);
      }

      const categoriesResult = await categoryAPI.getAll();
      if (categoriesResult.success) {
        const cats = categoriesResult.categories.map(cat => ({
          name: cat.name,
          icon: cat.icon,
          color: cat.color
        }));
        setCustomCategories(cats);

        const budgets = {};
        categoriesResult.categories.forEach(cat => {
          budgets[cat.name] = Number(parseFloat(cat.budget) || 0);
        });
        setCategoryBudgets(budgets);
      }

      const expensesResult = await expenseAPI.getAll();
      if (expensesResult.success) {
        const exps = expensesResult.expenses.map(exp => ({
          id: exp.id,
          title: exp.title,
          amount: Number(parseFloat(exp.amount) || 0),
          category: exp.category,
          date: exp.date,
          color: exp.color,
          icon: exp.icon,
          type: exp.type || 'debit'
        }));
        setExpenses(exps);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loginUser = async (email, password) => {
    const res = await authAPI.login(email, password);
    if (res.success) {
      setIsAuthenticated(true);
      await loadUserData();
    }
    return res;
  };

  const registerUser = async (name, email, phone, password) => {
    const res = await authAPI.register(name, email, phone, password);
    if (res.success) {
      setIsAuthenticated(true);
      await loadUserData();
    }
    return res;
  };

  const logoutUser = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setExpenses([]);
    setBaseBudget(0);
    setCategoryBudgets({});
    setCustomCategories([]);
    setHasCompletedOnboarding(false);
    setUserData({ id: '', name: '', email: '', phone: '', totalBudget: 0 });
  };

  const addExpense = async (expense) => {
    const tempId = Date.now().toString();
    const newExpense = {
      id: tempId,
      title: expense.title,
      amount: parseFloat(expense.amount),
      category: expense.category.name || expense.category,
      date: expense.date || new Date().toISOString(),
      color: expense.category.color || '#4F46E5',
      icon: expense.category.icon || '💸',
      type: expense.type || 'debit'
    };

    setExpenses(prev => [newExpense, ...prev]);

    try {
      const result = await expenseAPI.create(
        newExpense.title,
        newExpense.amount,
        newExpense.category,
        newExpense.icon,
        newExpense.color,
        newExpense.date,
        newExpense.type
      );
      if (result.success) {
        setExpenses(prev => prev.map(e => e.id === tempId ? { ...e, id: result.expenseId || result.id } : e));
      }
    } catch (err) {
      console.error('Add expense error:', err);
    }
  };

  const updateExpense = async (id, updatedData) => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updatedData } : exp));
    try {
      const target = expenses.find(e => e.id === id);
      const merged = { ...target, ...updatedData };
      await expenseAPI.update(
        id,
        merged.title,
        merged.amount,
        merged.category,
        merged.icon,
        merged.color,
        merged.date,
        merged.type
      );
    } catch (err) {
      console.error('Update expense error:', err);
    }
  };

  const deleteExpense = async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    try {
      await expenseAPI.delete(id);
    } catch (err) {
      console.error('Delete expense error:', err);
    }
  };

  const setBudget = async (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    setBaseBudget(numericAmount);
    try {
      await userAPI.updateBudget(numericAmount);
    } catch (err) {
      console.error('Update budget error:', err);
    }
  };

  const setCategoryBudget = async (categoryName, amount) => {
    const numericAmount = parseFloat(amount) || 0;
    setCategoryBudgets(prev => ({ ...prev, [categoryName]: numericAmount }));
    try {
      await categoryAPI.updateBudget(categoryName, numericAmount);
    } catch (err) {
      console.error('Category budget update error:', err);
    }
  };

  const addCustomCategory = async (category) => {
    const exists = customCategories.some(c => c.name.toLowerCase() === category.name.toLowerCase());
    if (exists) return { success: false, message: 'Category already exists' };

    setCustomCategories(prev => [...prev, category]);
    try {
      await categoryAPI.create(category.name, category.icon, category.color, category.budget || 0);
      return { success: true };
    } catch (err) {
      return { success: true, message: 'Category added locally' };
    }
  };

  const deleteCategory = async (categoryName) => {
    setCustomCategories(prev => prev.filter(c => c.name !== categoryName));
    try {
      await categoryAPI.delete(categoryName);
    } catch (err) {
      console.error('Delete category error:', err);
    }
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    try {
      await userAPI.completeOnboarding();
    } catch (err) {
      console.error('Onboarding complete error:', err);
    }
  };

  const getAllCategories = () => {
    const map = new Map();
    DEFAULT_CATEGORIES.forEach(c => map.set(c.name.toLowerCase(), c));
    customCategories.forEach(c => map.set(c.name.toLowerCase(), c));
    return Array.from(map.values());
  };

  const getExpensesForCurrentPeriod = () => {
    const start = getPeriodStartDate();
    return expenses.filter(exp => new Date(exp.date) >= start);
  };

  const getCategorySpending = (categoryName, useCurrentPeriod = false) => {
    const targetExpenses = useCurrentPeriod ? getExpensesForCurrentPeriod() : expenses;
    return targetExpenses
      .filter(exp => exp.category?.toLowerCase() === categoryName.toLowerCase() && !isIncome(exp))
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  };

  const getTotalSpending = (useCurrentPeriod = false) => {
    const targetExpenses = useCurrentPeriod ? getExpensesForCurrentPeriod() : expenses;
    return targetExpenses
      .filter(exp => !isIncome(exp))
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  };

  const getCategoryBudgetStatus = (categoryName) => {
    const budget = Number(categoryBudgets[categoryName]) || 0;
    const spent = Number(getCategorySpending(categoryName, true)) || 0;
    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    return { budget, spent, remaining, percentage, isOverBudget: spent > budget };
  };

  return (
    <ExpenseContext.Provider value={{
      expenses,
      addExpense,
      updateExpense,
      deleteExpense,
      totalBudget,
      baseBudget,
      setBudget,
      categoryBudgets,
      setCategoryBudget,
      customCategories,
      addCustomCategory,
      deleteCategory,
      getAllCategories,
      getCategorySpending,
      getTotalSpending,
      getCategoryBudgetStatus,
      getExpensesForCurrentPeriod,
      completeOnboarding,
      hasCompletedOnboarding,
      userData,
      setUserData,
      isLoading,
      isAuthenticated,
      loginUser,
      registerUser,
      logoutUser,
      loadUserData,
      darkMode,
      toggleDarkMode
    }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export const useExpense = () => useContext(ExpenseContext);
