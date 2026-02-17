import { getCategoryColor, getDate, getId } from "../helper";
import { DEFAULT_CATEGORIES } from "../constant";
import { userAPI, categoryAPI, expenseAPI } from "../services/appwriteAPI";

const { createContext, useContext, useState } = require("react");

export const ExpenseContext = createContext();

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [baseBudget, setBaseBudget] = useState(0); // Renamed from totalBudget to baseBudget
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [customCategories, setCustomCategories] = useState([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [budgetPeriod, setBudgetPeriod] = useState('monthly'); // 'weekly' or 'monthly'
  const [periodStartDate, setPeriodStartDate] = useState(new Date().toISOString());

  // Get period start date based on budget period
  const getPeriodStartDate = () => {
    const now = new Date();
    // const start = new Date(periodStartDate);

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

  // Helper to determine income
  const isIncome = (expense) => {
    if (expense.type === 'credit') return true;
    if (expense.type === 'debit') return false;
    const cat = expense.category?.toLowerCase() || '';
    return cat === 'income' || cat === 'salary' || cat === 'deposit' || cat === 'credit' || (expense.category === 'Income');
  };

  // Calculate Total Income for current period (Added Funds)
  const getIncomeForCurrentPeriod = () => {
    const periodStart = getPeriodStartDate();
    return expenses
      .filter(exp => {
        const expenseDate = new Date(exp.date);
        return expenseDate >= periodStart && isIncome(exp);
      })
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  };

  // Effective Total Budget = Base (DB) + Income (Current Period)
  const totalBudget = baseBudget + getIncomeForCurrentPeriod();

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
        setBaseBudget(user.totalBudget || 0);
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
          icon: exp.icon,
          type: exp.type || 'debit' // Load type
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
    setBaseBudget(0);
    setCategoryBudgets({});
    setCustomCategories([]);
    setHasCompletedOnboarding(false);
    setUserData({ name: '', email: '', phone: '' });
    setBudgetPeriod('monthly');
    setPeriodStartDate(new Date().toISOString());
  };

  // Add expense
  const addExpense = async (expense) => {
    const tempId = getId();
    const newExpense = {
      id: tempId,
      title: expense.title,
      amount: parseFloat(expense.amount),
      category: expense.category.name,
      date: expense.date || new Date().toISOString(),
      color: getCategoryColor(expense.category.color),
      icon: expense.category.icon,
      type: expense.type || 'debit'
    };

    // Optimistic update
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
        // Update with real ID from backend
        setExpenses(prev => prev.map(exp =>
          exp.id === tempId ? { ...exp, id: result.expenseId } : exp
        ));
      } else {
        // Revert on failure
        console.error('Failed to add expense:', result.message);
        setExpenses(prev => prev.filter(exp => exp.id !== tempId));
      }
    } catch (error) {
      console.error('Add expense error:', error);
      setExpenses(prev => prev.filter(exp => exp.id !== tempId));
    }
  };

  // Import multiple expenses
  const importExpenses = async (newExpenses) => {
    setIsLoading(true);
    let successCount = 0;

    try {
      const promises = newExpenses.map(exp =>
        expenseAPI.create(
          exp.title,
          parseFloat(exp.amount),
          exp.category.name,
          exp.category.icon,
          getCategoryColor(exp.category.color),
          exp.date || new Date().toISOString(),
          exp.type || 'debit'
        )
      );

      const results = await Promise.all(promises);
      successCount = results.filter(r => r.success).length;

      // Reload all data to ensure sync and get correct IDs
      await loadUserData();

      return { success: true, count: successCount };
    } catch (error) {
      console.error('Import expenses error:', error);
      return { success: false, error: error.message, count: successCount };
    } finally {
      setIsLoading(false);
    }
  };

  // Update expense
  const updateExpense = async (expenseId, updatedData) => {
    // Optimistic update
    const previousExpenses = [...expenses];
    setExpenses(prev => prev.map(expense =>
      expense.id === expenseId
        ? { ...expense, ...updatedData }
        : expense
    ));

    try {
      const expenseToUpdate = expenses.find(e => e.id === expenseId);
      if (!expenseToUpdate) return;

      const merged = { ...expenseToUpdate, ...updatedData };

      const result = await expenseAPI.update(
        expenseId,
        merged.title,
        merged.amount,
        merged.category,
        merged.icon,
        merged.color,
        merged.date,
        merged.type // Include type in update
      );

      if (!result.success) {
        console.error('Failed to update expense:', result.message);
        setExpenses(previousExpenses);
      }
    } catch (error) {
      console.error('Update expense error:', error);
      setExpenses(previousExpenses);
    }
  };

  // Delete expense
  const deleteExpense = async (expenseId) => {
    // Optimistic delete
    const previousExpenses = [...expenses];
    setExpenses(prev => prev.filter(expense => expense.id !== expenseId));

    try {
      const result = await expenseAPI.delete(expenseId);

      if (!result.success) {
        // If document not found, it's already deleted on server, so don't revert
        if (result.message && (result.message.includes('could not be found') || result.message.includes('404'))) {
          console.warn('Expense not found on server, keeping local deletion:', expenseId);
          return;
        }

        // Revert on other failures
        console.error('Failed to delete expense:', result.message);
        setExpenses(previousExpenses);
      }
    } catch (error) {
      console.error('Delete expense error:', error);
      // Check for 404 in catch block too if API throws directly
      if (error.message && (error.message.includes('could not be found') || error.message.includes('404'))) {
        console.warn('Expense not found on server, keeping local deletion:', expenseId);
        return;
      }
      setExpenses(previousExpenses);
    }
  };

  // Add custom category
  const addCustomCategory = (category) => {
    const exists = customCategories.some(cat => cat.name.toLowerCase() === category.name.toLowerCase());

    if (exists) {
      return { success: false, message: 'Category already exists' };
    }

    setCustomCategories([...customCategories, category]);
    return { success: true, message: 'Category added successfully' };
  };

  // Add multiple categories
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
      const categoryExpenses = expenses.filter(exp => exp.category === categoryName);

      if (categoryExpenses.length > 0) {
        return {
          success: false,
          hasExpenses: true,
          expenseCount: categoryExpenses.length,
          message: `Cannot delete category. ${categoryExpenses.length} expense(s) are using this category.`
        };
      }

      const result = await categoryAPI.delete(categoryName);

      if (result.success) {
        setCustomCategories(customCategories.filter(cat => cat.name !== categoryName));
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

  // Get all categories
  const getAllCategories = () => {
    if (hasCompletedOnboarding) {
      return customCategories;
    }
    return [...DEFAULT_CATEGORIES, ...customCategories];
  };

  // Complete onboarding
  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
  };

  // Set category budget
  const setCategoryBudget = async (categoryName, amount) => {
    const budgetAmount = parseFloat(amount) || 0;
    setCategoryBudgets(prev => ({
      ...prev,
      [categoryName]: budgetAmount
    }));

    try {
      await categoryAPI.updateBudget(categoryName, budgetAmount);
    } catch (error) {
      console.error('Failed to update category budget in backend:', error);
    }
  };

  // Set batch category budgets
  const setBatchCategoryBudgets = (budgetsObject) => {
    setCategoryBudgets(prev => ({
      ...prev,
      ...budgetsObject
    }));
  };

  // Set total budget (Base)
  const setBudget = (amount) => {
    const newBudget = parseFloat(amount) || 0;
    setBaseBudget(newBudget);

    try {
      if (userAPI.updateBudget) {
        userAPI.updateBudget(newBudget);
      } else {
        console.warn("userAPI.updateBudget not found");
      }
    } catch (e) {
      console.error("Failed to save budget", e);
    }
  };

  // Update budget period
  const updateBudgetPeriod = async (period) => {
    setBudgetPeriod(period);
    const newStartDate = new Date().toISOString();
    setPeriodStartDate(newStartDate);

    try {
      await userAPI.updateBudgetPeriod(period, newStartDate);
    } catch (error) {
      console.error('❌ Failed to save budget period:', error);
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

  // Get spending by category
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

  // Get budget status
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
      importExpenses,
      updateExpense,
      deleteExpense,
      totalBudget,
      setBudget,
      baseBudget,
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
