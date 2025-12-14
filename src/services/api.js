import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the backend API
const API_BASE_URL = 'http://192.168.1.40:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userId');
      // Could trigger logout/navigation here
    }
    return Promise.reject(error);
  }
);

// ============ Authentication APIs ============

export const authAPI = {
  register: async (name, email, phone, password) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
      });
      if (response.data.success) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userId', response.data.userId);
      }
      return response.data;
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      if (response.data.success) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userId', response.data.user.id);
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userId');
  },

  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },
};

// ============ User APIs ============

export const userAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to get profile' };
    }
  },

  updateProfile: async (name, phone) => {
    try {
      const response = await api.put('/user/profile', { name, phone });
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to update profile' };
    }
  },

  updateBudget: async (totalBudget) => {
    try {
      const response = await api.put('/user/budget', { totalBudget });
      return response.data;
    } catch (error) {
      console.error('Update budget error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to update budget' };
    }
  },

  completeOnboarding: async () => {
    try {
      const response = await api.post('/user/onboarding/complete');
      return response.data;
    } catch (error) {
      console.error('Complete onboarding error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to complete onboarding' };
    }
  },
};

// ============ Category APIs ============

export const categoryAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/categories/');
      return response.data;
    } catch (error) {
      console.error('Get categories error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to get categories' };
    }
  },

  create: async (name, icon, color, budget = 0) => {
    try {
      const response = await api.post('/categories/', {
        name,
        icon,
        color,
        budget,
      });
      return response.data;
    } catch (error) {
      console.error('Create category error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to create category' };
    }
  },

  createMultiple: async (categories) => {
    try {
      const response = await api.post('/categories/bulk', { categories });
      return response.data;
    } catch (error) {
      console.error('Create multiple categories error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to create categories' };
    }
  },

  updateBudget: async (categoryName, budget) => {
    try {
      const response = await api.put(`/categories/${encodeURIComponent(categoryName)}/budget`, {
        budget,
      });
      return response.data;
    } catch (error) {
      console.error('Update category budget error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to update budget' };
    }
  },

  updateMultipleBudgets: async (budgets) => {
    try {
      const response = await api.put('/categories/budgets/bulk', { budgets });
      return response.data;
    } catch (error) {
      console.error('Update multiple budgets error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to update budgets' };
    }
  },

  delete: async (categoryName) => {
    try {
      const response = await api.delete(`/categories/${encodeURIComponent(categoryName)}`);
      return response.data;
    } catch (error) {
      console.error('Delete category error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to delete category' };
    }
  },
};

// ============ Expense APIs ============

export const expenseAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/expenses/');
      return response.data;
    } catch (error) {
      console.error('Get expenses error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to get expenses' };
    }
  },

  getByCategory: async (categoryName) => {
    try {
      const response = await api.get(`/expenses/category/${encodeURIComponent(categoryName)}`);
      return response.data;
    } catch (error) {
      console.error('Get category expenses error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to get expenses' };
    }
  },

  getCategoryTotal: async (categoryName) => {
    try {
      const response = await api.get(`/expenses/category/${encodeURIComponent(categoryName)}/total`);
      return response.data;
    } catch (error) {
      console.error('Get category total error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to get total' };
    }
  },

  getSummary: async () => {
    try {
      const response = await api.get('/expenses/summary');
      return response.data;
    } catch (error) {
      console.error('Get summary error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to get summary' };
    }
  },

  create: async (title, amount, category, icon, color) => {
    try {
      const response = await api.post('/expenses/', {
        title,
        amount,
        category,
        icon,
        color,
      });
      return response.data;
    } catch (error) {
      console.error('Create expense error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to create expense' };
    }
  },

  delete: async (expenseId) => {
    try {
      const response = await api.delete(`/expenses/${expenseId}`);
      return response.data;
    } catch (error) {
      console.error('Delete expense error:', error.response?.data || error.message);
      return { success: false, message: error.response?.data?.message || 'Failed to delete expense' };
    }
  },
};

export default api;
