import { getCategoryColor, getDate, getId } from "../helper";
import { DEFAULT_CATEGORIES } from "../constant";
import { userAPI, categoryAPI, expenseAPI } from "../services/api";

const { createContext, useContext, useState } = require("react");

export const ExpenseContext = createContext();

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [baseBudget, setBaseBudget] = useState(0); // Renamed from totalBudget to baseBudget
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [customCategories, setCustomCategories] = useState([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userData, setUserData] = useState({ id: '', $id: '', $createdAt: '', $updatedAt: '', name: '', email: '', phone: '', totalBudget: 0 });
  const [isLoading, setIsLoading] = useState(true); // Start with true to show skeleton
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
    const income = expenses
      .filter(exp => {
        const expenseDate = new Date(exp.date);
        return expenseDate >= periodStart && isIncome(exp);
      })
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    
    // Ensure it's always a valid number
    return Number.isFinite(income) ? income : 0;
  };

  // Effective Total Budget = Base (DB) + Income (Current Period)
  const totalBudgetCalc = Number(baseBudget) + Number(getIncomeForCurrentPeriod());
  const totalBudget = Number.isFinite(totalBudgetCalc) ? totalBudgetCalc : 0;

  // Load all user data from backend with forced recalculation
  const loadUserData = async (forceRecalculate = true) => {
    setIsLoading(true);
    
    try {
      // STEP 1: Load user profile with strict type conversion (no state reset - let backend data update state directly)
      const profileResult = await userAPI.getProfile();
      if (profileResult.success) {
        const user = profileResult.user;
        const totalBudgetNum = Number(parseFloat(user.totalBudget) || 0);
        
        // Validate budget is a proper number
        if (!Number.isFinite(totalBudgetNum)) {
          console.error('❌ Invalid budget from backend:', user.totalBudget);
          setBaseBudget(0);
        } else {
          setBaseBudget(totalBudgetNum);
          console.log('✅ Base budget loaded:', totalBudgetNum, 'type:', typeof totalBudgetNum);
        }
        
        setUserData({
          id: user.id,
          $id: user.$id,
          $createdAt: user.$createdAt,
          $updatedAt: user.$updatedAt,
          name: user.name,
          email: user.email,
          phone: user.phone,
          totalBudget: totalBudgetNum
        });
        setHasCompletedOnboarding(user.hasCompletedOnboarding || false);
        setBudgetPeriod(user.budgetPeriod || 'monthly');
        setPeriodStartDate(user.periodStartDate || new Date().toISOString());
      }

      // STEP 2: Load categories with strict type conversion
      const categoriesResult = await categoryAPI.getAll();
      if (categoriesResult.success) {
        const cats = categoriesResult.categories.map(cat => ({
          name: cat.name,
          icon: cat.icon,
          color: cat.color
        }));
        setCustomCategories(cats);

        // Load category budgets with validation
        const budgets = {};
        categoriesResult.categories.forEach(cat => {
          const budgetNum = Number(parseFloat(cat.budget) || 0);
          if (!Number.isFinite(budgetNum)) {
            console.warn('⚠️ Invalid category budget:', cat.name, cat.budget);
            budgets[cat.name] = 0;
          } else {
            budgets[cat.name] = budgetNum;
          }
        });
        setCategoryBudgets(budgets);
        console.log('✅ Category budgets loaded:', Object.keys(budgets).length, 'categories');
      }

      // STEP 3: Load expenses with strict type conversion and validation
      const expensesResult = await expenseAPI.getAll();
      if (expensesResult.success) {
        const exps = expensesResult.expenses.map(exp => {
          const amountNum = Number(parseFloat(exp.amount) || 0);
          
          // Validate amount is a proper number
          if (!Number.isFinite(amountNum)) {
            console.warn('⚠️ Invalid amount in expense:', exp.id, 'amount:', exp.amount, 'type:', typeof exp.amount);
            return {
              id: exp.id,
              title: exp.title,
              amount: 0, // Fallback to 0 for invalid amounts
              category: exp.category,
              date: exp.date,
              color: exp.color,
              icon: exp.icon,
              type: exp.type || 'debit'
            };
          }
          
          return {
            id: exp.id,
            title: exp.title,
            amount: amountNum,
            category: exp.category,
            date: exp.date,
            color: exp.color,
            icon: exp.icon,
            type: exp.type || 'debit'
          };
        });
        setExpenses(exps);
        console.log('✅ Expenses loaded:', exps.length, 'transactions');
      }

      console.log('✅ User data loaded and recalculated successfully');
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
    setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    try {
      await expenseAPI.delete(expenseId);
    } catch (error) {
      console.error('Delete expense backend error:', error);
    }
  };

  // Add custom category
  const addCustomCategory = async (category) => {
    // Check if category already exists in custom categories
    const exists = customCategories.some(cat => cat.name.toLowerCase() === category.name.toLowerCase());

    if (exists) {
      return { success: false, message: 'Category already exists' };
    }

    setCustomCategories(prev => [...prev, category]);

    try {
      const res = await categoryAPI.create(category.name, category.icon, category.color, category.budget || 0);
      if (!res.success) {
        console.warn('Backend category creation warning:', res.message);
      }
      return { success: true, message: 'Category added successfully' };
    } catch (error) {
      console.error('Add custom category backend error:', error);
      return { success: true, message: 'Category added locally' };
    }
  };

  // Add multiple categories at once (for onboarding)
  const addMultipleCategories = (categoriesArray) => {
    const validCategories = categoriesArray.filter(cat =>
      cat.name && cat.name.trim() &&
      !customCategories.some(existing => existing.name.toLowerCase() === cat.name.toLowerCase())
    );

    setCustomCategories(prev => [...prev, ...validCategories]);
    return { success: true, count: validCategories.length };
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

  // Set budget for a specific category
  const setCategoryBudget = async (categoryName, amount) => {
    const numericAmount = parseFloat(amount) || 0;
    setCategoryBudgets(prev => ({
      ...prev,
      [categoryName]: numericAmount
    }));

    try {
      await categoryAPI.updateBudget(categoryName, numericAmount);
    } catch (error) {
      console.error('Set category budget backend error:', error);
    }
  };

  // Set batch category budgets
  const setBatchCategoryBudgets = (budgetsObject) => {
    const parsedBudgets = {};
    Object.keys(budgetsObject).forEach(key => {
      parsedBudgets[key] = Number(budgetsObject[key]) || 0;
    });
    setCategoryBudgets(prev => ({
      ...prev,
      ...parsedBudgets
    }));
  };

  // Set total budget
  const setBudget = async (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    setTotalBudget(numericAmount);

    try {
      await userAPI.updateBudget(numericAmount);
    } catch (error) {
      console.error('Set budget backend error:', error);
    }
  };

  // Get spending by category
  const getCategorySpending = (categoryName, useCurrentPeriod = false) => {
    const expensesToUse = useCurrentPeriod ? getExpensesForCurrentPeriod() : expenses;
    const spending = expensesToUse
      .filter(exp => exp.category === categoryName && !isIncome(exp))
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    
    // Ensure it's always a valid number
    return Number.isFinite(spending) ? spending : 0;
  };

  // Get total spending
  const getTotalSpending = (useCurrentPeriod = false) => {
    const expensesToUse = useCurrentPeriod ? getExpensesForCurrentPeriod() : expenses;
    const spending = expensesToUse
      .filter(exp => !isIncome(exp))
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    
    // Ensure it's always a valid number
    return Number.isFinite(spending) ? spending : 0;
  };

  // Get budget status
  const getCategoryBudgetStatus = (categoryName) => {
    const budget = Number(categoryBudgets[categoryName]) || 0;
    // Use current period spending so it resets with each new week/month
    const spent = Number(getCategorySpending(categoryName, true)) || 0;
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
