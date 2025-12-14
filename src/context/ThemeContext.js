import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  // Automatically sync with system theme changes
  useEffect(() => {
    setIsDarkMode(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const colors = {
    // Background colors
    background: isDarkMode ? '#000000' : '#F9FAFB',
    surface: isDarkMode ? '#1C1C1E' : '#FFFFFF',
    card: isDarkMode ? '#2C2C2E' : '#FFFFFF',
    
    // Text colors
    text: isDarkMode ? '#FFFFFF' : '#111827',
    textSecondary: isDarkMode ? '#98989D' : '#6B7280',
    textTertiary: isDarkMode ? '#636366' : '#9CA3AF',
    
    // Primary colors
    primary: '#8B5CF6',
    primaryDark: '#7C3AED',
    primaryLight: '#A78BFA',
    
    // Status colors
    success: isDarkMode ? '#34C759' : '#10B981',
    warning: isDarkMode ? '#FF9F0A' : '#F59E0B',
    error: isDarkMode ? '#FF3B30' : '#EF4444',
    info: isDarkMode ? '#0A84FF' : '#3B82F6',
    
    // Border colors
    border: isDarkMode ? '#38383A' : '#E5E7EB',
    borderLight: isDarkMode ? '#2C2C2E' : '#F3F4F6',
    
    // Overlay colors
    overlay: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    
    // Input colors
    input: isDarkMode ? '#2C2C2E' : '#FFFFFF',
    inputBorder: isDarkMode ? '#38383A' : '#D1D5DB',
    placeholder: isDarkMode ? '#636366' : '#9CA3AF',
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
