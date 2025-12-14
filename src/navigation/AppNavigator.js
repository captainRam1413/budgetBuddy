import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, Platform, ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import Home from '../screens/Home';
import Create from '../screens/Create';
import Insights from '../screens/Insights';
import Profile from '../screens/Profile';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Onboarding from '../screens/Onboarding';
import { useTheme } from '../context/ThemeContext';
import { useExpense } from '../context/ExpenseContext';
import { authAPI } from '../services/api';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MyTabs() {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    
    return (
        <Tab.Navigator 
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 8,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tab.Screen 
                name="Home" 
                component={Home}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <Text style={{ fontSize: 24 }}>{focused ? '🏠' : '🏡'}</Text>
                    ),
                }}
            />
            <Tab.Screen 
                name="Create" 
                component={Create}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <Text style={{ fontSize: 24 }}>{focused ? '➕' : '＋'}</Text>
                    ),
                }}
            />
            <Tab.Screen 
                name="Insights" 
                component={Insights}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <Text style={{ fontSize: 24 }}>{focused ? '📊' : '📈'}</Text>
                    ),
                }}
            />
            <Tab.Screen 
                name="Profile" 
                component={Profile}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <Text style={{ fontSize: 24 }}>{focused ? '👤' : '👥'}</Text>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator(params) {
    const { colors } = useTheme();
    const { loadUserData } = useExpense();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const authenticated = await authAPI.isAuthenticated();
            setIsAuthenticated(authenticated);
            
            // If authenticated, load user data from backend
            if (authenticated) {
                console.log('🔄 Loading user data from backend...');
                await loadUserData();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 16, color: colors.text }}>Loading...</Text>
            </View>
        );
    }
    
    return (
        <Stack.Navigator 
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                    fontWeight: 'bold',
                    fontSize: 20,
                },
            }}
        >
            {!isAuthenticated ? (
                // Auth Screens
                <>
                    <Stack.Screen 
                        name="Login" 
                        component={Login} 
                        options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                        name="Register" 
                        component={Register} 
                        options={{ headerShown: false }} 
                    />
                    <Stack.Screen 
                        name="Onboarding" 
                        component={Onboarding} 
                        options={{ headerShown: false }} 
                    />
                </>
            ) : null}
            
            {/* Main App Screens */}
            <Stack.Screen 
                name="BottomTabs" 
                component={MyTabs} 
                options={{ 
                    title: 'BudgetBuddy 💰',
                    headerShown: true 
                }} 
            />

            <Stack.Screen 
                name="Category" 
                component={require('../screens/Category').default} 
                options={{presentation: 'modal', headerShown: false}} 
            />
        </Stack.Navigator>
    );
}