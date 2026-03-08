import AsyncStorage from '@react-native-async-storage/async-storage';
import { account, databases, Query, ID, APPWRITE_CONFIG } from '../config/appwrite';

// Helper to get current user ID
const getCurrentUserId = async () => {
  try {
    const user = await account.get();
    return user.$id;
  } catch (error) {
    return null;
  }
};

// ============ Authentication APIs ============

export const authAPI = {
  register: async (name, email, phone, password) => {
    try {
      // Create account
      const user = await account.create(ID.unique(), email, password, name);

      // Create session (auto-login)
      await account.createEmailPasswordSession(email, password);

      // Store user ID
      await AsyncStorage.setItem('userId', user.$id);

      // Create user profile in database with additional fields
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.users,
          user.$id,
          {
            name,
            email,
            phone,
            totalBudget: 0,
            hasCompletedOnboarding: false,
            userId: user.$id,
          }
        );
      } catch (dbError) {
        console.error('Database document creation error:', dbError);
        // Continue even if document creation fails
      }

      return {
        success: true,
        userId: user.$id,
        message: 'User created successfully',
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  },

  login: async (email, password) => {
    try {
      // Create session
      const session = await account.createEmailPasswordSession(email, password);

      // Get user details
      const user = await account.get();

      await AsyncStorage.setItem('userId', user.$id);

      // Try to get user profile from database
      try {
        const profile = await databases.getDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.users,
          user.$id
        );

        return {
          success: true,
          user: {
            id: user.$id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone || '',
            totalBudget: parseFloat(profile.totalBudget) || 0,
            hasCompletedOnboarding: profile.hasCompletedOnboarding,
          },
          message: 'Login successful',
        };
      } catch (profileError) {
        // Profile doesn't exist, create it
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.users,
          user.$id,
          {
            name: user.name,
            email: user.email,
            phone: '',
            totalBudget: 0,
            hasCompletedOnboarding: false,
            userId: user.$id,
          }
        );

        return {
          success: true,
          user: {
            id: user.$id,
            name: user.name,
            email: user.email,
            phone: '',
            totalBudget: 0,
            hasCompletedOnboarding: false,
          },
          message: 'Login successful',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  },

  logout: async () => {
    try {
      await account.deleteSession('current');
      await AsyncStorage.removeItem('userId');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: error.message };
    }
  },

  isAuthenticated: async () => {
    try {
      await account.get();
      return true;
    } catch (error) {
      return false;
    }
  },
};

// ============ User APIs ============

export const userAPI = {
  getProfile: async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      const profile = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        userId
      );

      return {
        success: true,
        user: {
          id: profile.$id,
          $id: profile.$id,
          $createdAt: profile.$createdAt,
          $updatedAt: profile.$updatedAt,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          totalBudget: parseFloat(profile.totalBudget) || 0,
          hasCompletedOnboarding: profile.hasCompletedOnboarding,
          budgetPeriod: profile.budgetPeriod || 'monthly',
          periodStartDate: profile.periodStartDate || new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, message: error.message || 'Failed to get profile' };
    }
  },

  updateProfile: async (name, phone) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        userId,
        { name, phone }
      );

      return {
        success: true,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: error.message || 'Failed to update profile' };
    }
  },

  updateBudget: async (totalBudget) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        userId,
        { totalBudget: parseFloat(totalBudget) || 0 }
      );

      return {
        success: true,
        message: 'Budget updated successfully',
      };
    } catch (error) {
      console.error('Update budget error:', error);
      return { success: false, message: error.message || 'Failed to update budget' };
    }
  },

  completeOnboarding: async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        userId,
        { hasCompletedOnboarding: true }
      );

      return {
        success: true,
        message: 'Onboarding completed',
      };
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return { success: false, message: error.message || 'Failed to complete onboarding' };
    }
  },

  updateBudgetPeriod: async (budgetPeriod, periodStartDate) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        userId,
        { budgetPeriod, periodStartDate }
      );

      return {
        success: true,
        message: 'Budget period updated successfully',
      };
    } catch (error) {
      console.error('Update budget period error:', error);
      return { success: false, message: error.message || 'Failed to update budget period' };
    }
  },
};

// ============ Category APIs ============

export const categoryAPI = {
  getAll: async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.categories,
        [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
      );

      const categories = response.documents.map((doc) => ({
        id: doc.$id,
        _id: doc.$id,
        name: doc.name,
        icon: doc.icon,
        color: doc.color,
        budget: parseFloat(doc.budget) || 0,
        userId: doc.userId,
      }));

      return {
        success: true,
        categories,
      };
    } catch (error) {
      console.error('Get categories error:', error);
      return { success: false, message: error.message || 'Failed to get categories' };
    }
  },

  create: async (name, icon, color, budget = 0) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      // Check if category already exists
      const existing = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.categories,
        [Query.equal('userId', userId), Query.equal('name', name)]
      );

      if (existing.documents.length > 0) {
        return { success: false, message: 'Category with this name already exists' };
      }

      const category = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.categories,
        ID.unique(),
        {
          userId,
          name,
          icon,
          color,
          budget: parseFloat(budget) || 0,
        }
      );

      return {
        success: true,
        categoryId: category.$id,
        message: 'Category created successfully',
      };
    } catch (error) {
      console.error('Create category error:', error);
      return { success: false, message: error.message || 'Failed to create category' };
    }
  },

  createMultiple: async (categories) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      const promises = categories.map((cat) =>
        databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.categories,
          ID.unique(),
          {
            userId,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            budget: parseFloat(cat.budget) || 0,
          }
        )
      );

      await Promise.all(promises);

      return {
        success: true,
        message: 'Categories created successfully',
      };
    } catch (error) {
      console.error('Create multiple categories error:', error);
      return { success: false, message: error.message || 'Failed to create categories' };
    }
  },

  updateBudget: async (categoryName, budget) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      // Find category by name
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.categories,
        [Query.equal('userId', userId), Query.equal('name', categoryName)]
      );

      if (response.documents.length === 0) {
        return { success: false, message: 'Category not found' };
      }

      const category = response.documents[0];
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.categories,
        category.$id,
        { budget: parseFloat(budget) || 0 }
      );

      return {
        success: true,
        message: 'Budget updated successfully',
      };
    } catch (error) {
      console.error('Update category budget error:', error);
      return { success: false, message: error.message || 'Failed to update budget' };
    }
  },

  updateMultipleBudgets: async (budgets) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      const promises = budgets.map(async (item) => {
        const response = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.categories,
          [Query.equal('userId', userId), Query.equal('name', item.categoryName)]
        );

        if (response.documents.length > 0) {
          const category = response.documents[0];
          return databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.categories,
            category.$id,
            { budget: parseFloat(item.budget) || 0 }
          );
        }
      });

      await Promise.all(promises);

      return {
        success: true,
        message: 'Budgets updated successfully',
      };
    } catch (error) {
      console.error('Update multiple budgets error:', error);
      return { success: false, message: error.message || 'Failed to update budgets' };
    }
  },

  delete: async (categoryName) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      // Find category by name
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.categories,
        [Query.equal('userId', userId), Query.equal('name', categoryName)]
      );

      if (response.documents.length === 0) {
        return { success: false, message: 'Category not found' };
      }

      const category = response.documents[0];
      await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.categories,
        category.$id
      );

      return {
        success: true,
        message: 'Category deleted successfully',
      };
    } catch (error) {
      console.error('Delete category error:', error);
      return { success: false, message: error.message || 'Failed to delete category' };
    }
  },
};

// ============ Expense APIs ============

export const expenseAPI = {
  getAll: async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.expenses,
        [Query.equal('userId', userId), Query.orderDesc('date')]
      );

      const expenses = response.documents.map((doc) => ({
        id: doc.$id,
        _id: doc.$id,
        userId: doc.userId,
        title: doc.title,
        amount: parseFloat(doc.amount) || 0,
        category: doc.category,
        icon: doc.icon,
        color: doc.color,
        date: doc.date,
        type: doc.type || 'debit', // Default to debit if missing
      }));

      return {
        success: true,
        expenses,
      };
    } catch (error) {
      console.error('Get expenses error:', error);
      return { success: false, message: error.message || 'Failed to get expenses' };
    }
  },

  getByCategory: async (categoryName) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.expenses,
        [
          Query.equal('userId', userId),
          Query.equal('category', categoryName),
          Query.orderDesc('date'),
        ]
      );

      const expenses = response.documents.map((doc) => ({
        id: doc.$id,
        _id: doc.$id,
        userId: doc.userId,
        title: doc.title,
        amount: parseFloat(doc.amount) || 0,
        category: doc.category,
        icon: doc.icon,
        color: doc.color,
        date: doc.date,
        type: doc.type || 'debit',
      }));

      return {
        success: true,
        expenses,
      };
    } catch (error) {
      console.error('Get category expenses error:', error);
      return { success: false, message: error.message || 'Failed to get expenses' };
    }
  },

  // ... getCategoryTotal and getSummary can remain as is or be updated if needed. 
  // For now, only getAll/create/update are critical for the user request.
  // However, the Replace tool needs strict context. I will skip getCategoryTotal edits if they are large, 
  // but I must ensure valid JS. 

  getCategoryTotal: async (categoryName) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.expenses,
        [Query.equal('userId', userId), Query.equal('category', categoryName)]
      );

      const total = response.documents.reduce((sum, doc) => sum + (parseFloat(doc.amount) || 0), 0);

      return {
        success: true,
        total,
      };
    } catch (error) {
      console.error('Get category total error:', error);
      return { success: false, message: error.message || 'Failed to get total' };
    }
  },

  getSummary: async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.expenses,
        [Query.equal('userId', userId)]
      );

      // Calculate summary
      const summary = {};
      response.documents.forEach((doc) => {
        if (!summary[doc.category]) {
          summary[doc.category] = {
            category: doc.category,
            total: 0,
            count: 0,
            icon: doc.icon,
            color: doc.color,
          };
        }
        summary[doc.category].total += (parseFloat(doc.amount) || 0);
        summary[doc.category].count += 1;
      });

      return {
        success: true,
        summary: Object.values(summary),
      };
    } catch (error) {
      console.error('Get summary error:', error);
      return { success: false, message: error.message || 'Failed to get summary' };
    }
  },

  create: async (title, amount, category, icon, color, date, type = 'debit') => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      const expense = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.expenses,
        ID.unique(),
        {
          userId,
          title,
          amount: parseFloat(amount) || 0,
          category,
          icon,
          color,
          date: date || new Date().toISOString(),
          type,
        }
      );

      return {
        success: true,
        expenseId: expense.$id,
        message: 'Expense created successfully',
      };
    } catch (error) {
      console.error('Create expense error:', error);
      return { success: false, message: error.message || 'Failed to create expense' };
    }
  },

  update: async (expenseId, title, amount, category, icon, color, date, type) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, message: 'User not authenticated' };
      }

      const updateData = {
        title,
        amount: parseFloat(amount) || 0,
        category,
        icon,
        color,
      };

      if (date) {
        updateData.date = date;
      }
      
      if (type) {
        updateData.type = type;
      }

      const expense = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.expenses,
        expenseId,
        updateData
      );

      return {
        success: true,
        expenseId: expense.$id,
        message: 'Expense updated successfully',
      };
    } catch (error) {
      console.error('Update expense error:', error);
      return { success: false, message: error.message || 'Failed to update expense' };
    }
  },

  delete: async (expenseId) => {
    try {
      await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.expenses,
        expenseId
      );

      return {
        success: true,
        message: 'Expense deleted successfully',
      };
    } catch (error) {
      console.error('Delete expense error:', error);
      return { success: false, message: error.message || 'Failed to delete expense' };
    }
  },
};

export default { authAPI, userAPI, categoryAPI, expenseAPI };
