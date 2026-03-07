import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { ExpenseProvider } from "./src/context/ExpenseContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';

function AppContent() {
  const { isDarkMode, colors } = useTheme();

  useEffect(() => {
    const updateNavigationBar = async () => {
      try {
        // Update navigation bar color based on theme
        await NavigationBar.setBackgroundColorAsync(isDarkMode ? '#1F2937' : '#FFFFFF');
        
        // Update navigation bar button style based on theme
        await NavigationBar.setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
      } catch (error) {
        console.log('Error updating navigation bar:', error);
      }
    };
    
    updateNavigationBar();
  }, [isDarkMode]);

  return (
    <>
      <StatusBar 
        style={isDarkMode ? 'light' : 'dark'}
        backgroundColor={colors.surface}
        translucent={false}
      />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ExpenseProvider>
          <AppContent />
        </ExpenseProvider>
      </ThemeProvider>
    </SafeAreaProvider>

    // <AppNavigator />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
