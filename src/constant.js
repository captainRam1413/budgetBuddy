export const CURRENCY_SYMBOL = '₹';

export const SCREENS = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  ONBOARDING: 'Onboarding',
  BOTTOM_TABS: 'BottomTabs',
  HOME: 'Home',
  CREATE: 'Create',
  INSIGHTS: 'Insights',
  PROFILE: 'Profile',
  CATEGORY: 'Category',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_ID: 'userId',
};

// Common predefined categories
export const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#FFB347' },
  { name: 'Shopping', icon: '🛍️', color: '#6BCB77' },
  { name: 'Transportation', icon: '🚌', color: '#4ECDC4' },
  { name: 'Bills/Utilities', icon: '💡', color: '#4D96FF' }
];

// Available emojis for custom categories
export const AVAILABLE_ICONS = [
  '🍔', '💡', '🛍️', '🚌', '🏠', '💊', '🎓', '🎬', '✈️', '💳',
  '📱', '⛽', '🍻', '👨‍👩‍👧‍👦', '💸', '🎮', '🏋️', '📚', '🎵', '🎨',
  '⚽', '🎯', '🌟', '💼', '🔧', '🎁', '☕', '🍕', '🚗', '✨'
];

// Available colors for custom categories
export const AVAILABLE_COLORS = [
  '#FFB347', '#4D96FF', '#6BCB77', '#4ECDC4', '#FF6B6B', '#9B59B6',
  '#FFD93D', '#00BFFF', '#FF69B4', '#20B2AA', '#708090', '#F59E0B',
  '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
];