import { getCategoryColor, getDate, getId } from "../helper";
import { DEFAULT_CATEGORIES } from "../constant";
import { userAPI, categoryAPI, expenseAPI } from "../services/appwriteAPI";

const { createContext, useContext, useState } = require("react");

export const ExpenseContext = createContext();

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [customCategories, setCustomCategories] = useState([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [budgetPeriod, setBudgetPeriod] = useState('monthly'); // 'weekly' or 'monthly'
  const [periodStartDate, setPeriodStartDate] = useState(new Date().toISOString());

  // Load all user data from backend
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // 1. Load user profile
      const profileResult = await userAPI.getProfile();
      if (profileResult.success) {
        const user = profileResult.user;
        setUserData({
          name: user.name,
          email: user.email,
          phone: user.phone
        });
        setTotalBudget(user.totalBudget || 0);
        setHasCompletedOnboarding(user.hasCompletedOnboarding || false);
        setBudgetPeriod(user.budgetPeriod || 'monthly');
        setPeriodStartDate(user.periodStartDate || new Date().toISOString());
      }

      // 2. Load categories
      const categoriesResult = await categoryAPI.getAll();
      if (categoriesResult.success) {
        const cats = categoriesResult.categories.map(cat => ({
          name: cat.name,
          icon: cat.icon,
          color: cat.color
        }));
        setCustomCategories(cats);

        // Load category budgets
        const budgets = {};
        categoriesResult.categories.forEach(cat => {
          budgets[cat.name] = cat.budget || 0;
        });
        setCategoryBudgets(budgets);
      }

      // 3. Load expenses
      const expensesResult = await expenseAPI.getAll();
      if (expensesResult.success) {
        const exps = expensesResult.expenses.map(exp => ({
          id: exp.id,
          title: exp.title,
          amount: exp.amount,
          category: exp.category,
          date: exp.date,
          color: exp.color,
          icon: exp.icon
        }));
        setExpenses(exps);
      }

      console.log('✅ User data loaded from backend');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all data (for logout)
  const clearAllData = () => {
    setExpenses([]);
    setTotalBudget(0);
    setCategoryBudgets({});
    setCustomCategories([]);
    setHasCompletedOnboarding(false);
    setUserData({ name: '', email: '', phone: '' });
    setBudgetPeriod('monthly');
    setPeriodStartDate(new Date().toISOString());
  };
  
  // Add expense
  const addExpense = (expense) => {
    const newExpense = {
      id: getId(),
      title: expense.title,
      amount: parseFloat(expense.amount),
      category: expense.category.name,
      date: getDate(),
      color: getCategoryColor(expense.category.color),
      icon: expense.category.icon,
    };

    setExpenses([...expenses, newExpense]);
  };

  // Update expense
  const updateExpense = (expenseId, updatedData) => {
    setExpenses(expenses.map(expense => 
      expense.id === expenseId 
        ? { ...expense, ...updatedData }
        : expense
    ));
  };

  // Delete expense
  const deleteExpense = (expenseId) => {
    setExpenses(expenses.filter(expense => expense.id !== expenseId));
  };

  // Add custom category
  const addCustomCategory = (category) => {
    // Check if category already exists in custom categories
    const exists = customCategories.some(cat => cat.name.toLowerCase() === category.name.toLowerCase());
    
    if (exists) {
      return { success: false, message: 'Category already exists' };
    }
    
    setCustomCategories([...customCategories, category]);
    return { success: true, message: 'Category added successfully' };
  };

  // Add multiple categories at once (for onboarding)
  const addMultipleCategories = (categoriesArray) => {
    const validCategories = categoriesArray.filter(cat => 
      cat.name && cat.name.trim() && 
      !customCategories.some(existing => existing.name.toLowerCase() === cat.name.toLowerCase())
    );
    
    setCustomCategories([...customCategories, ...validCategories]);
    return { success: true, count: validCategories.length };
  };

  // Delete category
  const deleteCategory = async (categoryName) => {
    try {
      // Check if category has expenses
      const categoryExpenses = expenses.filter(exp => exp.category === categoryName);
      
      if (categoryExpenses.length > 0) {
        return {
          success: false,
          hasExpenses: true,
          expenseCount: categoryExpenses.length,
          message: `Cannot delete category. ${categoryExpenses.length} expense(s) are using this category.`
        };
      }

      // Delete from backend
      const result = await categoryAPI.delete(categoryName);
      
      if (result.success) {
        // Remove from local state
        setCustomCategories(customCategories.filter(cat => cat.name !== categoryName));
        
        // Remove category budget
        const newBudgets = { ...categoryBudgets };
        delete newBudgets[categoryName];
        setCategoryBudgets(newBudgets);
        
        return { success: true, message: 'Category deleted successfully' };
      }
      
      return result;
    } catch (error) {
      console.error('Delete category error:', error);
      return { success: false, message: 'Failed to delete category' };
    }
  };

  // Set user data
  const setUser = (user) => {
    setUserData(user);
  };

  // Get all categories (only custom if onboarding completed, otherwise default + custom)
  const getAllCategories = () => {
    // After onboarding, only show categories created by user
    if (hasCompletedOnboarding) {
      return customCategories;
    }
    // Before onboarding, show defaults for backwards compatibility
    return [...DEFAULT_CATEGORIES, ...customCategories];
  };

  // Mark onboarding as complete
  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
  };

  // Set budget for a specific category
  const setCategoryBudget = async (categoryName, amount) => {
    const budgetAmount = parseFloat(amount) || 0;
    
    // Update local state immediately
    setCategoryBudgets(prev => ({
      ...prev,
      [categoryName]: budgetAmount
    }));
    
    // Sync with backend
    try {
      await categoryAPI.updateBudget(categoryName, budgetAmount);
    } catch (error) {
      console.error('Failed to update category budget in backend:', error);
    }
  };

  // Set multiple category budgets at once (for onboarding)
  const setBatchCategoryBudgets = (budgetsObject) => {
    setCategoryBudgets(prev => ({
      ...prev,
      ...budgetsObject
    }));
  };

  // Set total budget
  const setBudget = (amount) => {
    setTotalBudget(parseFloat(amount) || 0);
  };

  // Set budget period
  const updateBudgetPeriod = async (period) => {
    setBudgetPeriod(period);
    // Reset period start date when changing period
    const newStartDate = new Date().toISOString();
    setPeriodStartDate(newStartDate);
    
    // Save to backend
    try {
      await userAPI.updateBudgetPeriod(period, newStartDate);
      console.log('✅ Budget period saved to backend');
    } catch (error) {
      console.error('❌ Failed to save budget period:', error);
    }
  };

  // Get period start date based on budget period
  const getPeriodStartDate = () => {
    const now = new Date();
    const start = new Date(periodStartDate);
    
    if (budgetPeriod === 'weekly') {
      // Get start of current week (Monday)
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    } else {
      // Get start of current month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      return monthStart;
    }
  };

  // Filter expenses by current period
  const getExpensesForCurrentPeriod = () => {
    const periodStart = getPeriodStartDate();
    return expenses.filter(exp => {
      const expenseDate = new Date(exp.date);
      return expenseDate >= periodStart;
    });
  };

  // Get spending by category for current period
  const getCategorySpending = (categoryName, useCurrentPeriod = false) => {
    const expensesToUse = useCurrentPeriod ? getExpensesForCurrentPeriod() : expenses;
    return expensesToUse
      .filter(exp => exp.category === categoryName)
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Get total spending
  const getTotalSpending = (useCurrentPeriod = false) => {
    const expensesToUse = useCurrentPeriod ? getExpensesForCurrentPeriod() : expenses;
    return expensesToUse.reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Get budget status for a category
  const getCategoryBudgetStatus = (categoryName) => {
    const budget = categoryBudgets[categoryName] || 0;
    const spent = getCategorySpending(categoryName);
    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    
    return {
      budget,
      spent,
      remaining,
      percentage,
      isOverBudget: spent > budget
    };
  };

  return (
    <ExpenseContext.Provider value={{ 
      expenses, 
      addExpense,
      updateExpense,
      deleteExpense,
      totalBudget,
      setBudget,
      budgetPeriod,
      updateBudgetPeriod,
      getPeriodStartDate,
      getExpensesForCurrentPeriod,
      categoryBudgets,
      setCategoryBudget,
      setBatchCategoryBudgets,
      getCategorySpending,
      getTotalSpending,
      getCategoryBudgetStatus,
      customCategories,
      addCustomCategory,
      addMultipleCategories,
      deleteCategory,
      getAllCategories,
      completeOnboarding,
      hasCompletedOnboarding,
      userData,
      setUser,
      loadUserData,
      clearAllData,
      isLoading
    }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export const useExpense = () => useContext(ExpenseContext);
