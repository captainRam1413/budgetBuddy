import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (name, email, phone, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, phone, password });
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userId', response.data.userId);
      }
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  },
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userId', response.data.user.id);
      }
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  },
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
  },
  isAuthenticated: () => !!localStorage.getItem('authToken'),
};

export const userAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch profile' };
    }
  },
  updateProfile: async (name, phone) => {
    try {
      const response = await api.put('/user/profile', { name, phone });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update profile' };
    }
  },
  updateBudget: async (totalBudget) => {
    try {
      const response = await api.put('/user/budget', { totalBudget });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update budget' };
    }
  },
  completeOnboarding: async () => {
    try {
      const response = await api.post('/user/onboarding/complete');
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to complete onboarding' };
    }
  },
};

export const categoryAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/categories/');
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch categories' };
    }
  },
  create: async (name, icon, color, budget = 0) => {
    try {
      const response = await api.post('/categories/', { name, icon, color, budget });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to create category' };
    }
  },
  updateBudget: async (categoryName, budget) => {
    try {
      const response = await api.put(`/categories/${encodeURIComponent(categoryName)}/budget`, { budget });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update category budget' };
    }
  },
  delete: async (categoryName) => {
    try {
      const response = await api.delete(`/categories/${encodeURIComponent(categoryName)}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete category' };
    }
  },
};

export const expenseAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/expenses/');
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch expenses' };
    }
  },
  create: async (title, amount, category, icon, color, date, type = 'debit') => {
    try {
      const response = await api.post('/expenses/', { title, amount, category, icon, color, date, type });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to create expense' };
    }
  },
  update: async (id, title, amount, category, icon, color, date, type) => {
    try {
      const response = await api.put(`/expenses/${id}`, { title, amount, category, icon, color, date, type });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update expense' };
    }
  },
  delete: async (expenseId) => {
    try {
      const response = await api.delete(`/expenses/${expenseId}`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete expense' };
    }
  },
};

export default api;
