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
import { authAPI } from '../services/appwriteAPI';

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
    const { loadUserData, hasCompletedOnboarding } = useExpense();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasLoadedData, setHasLoadedData] = useState(false);
    const isAuthenticatedRef = React.useRef(false);
    const hasLoadedDataRef = React.useRef(false);

    useEffect(() => {
        checkAuth();

        // Set up interval to check authentication status periodically
        const authCheckInterval = setInterval(() => {
            checkAuth();
        }, 2000); // Check every 2 seconds

        return () => clearInterval(authCheckInterval);
    }, []);

    const checkAuth = async () => {
        try {
            const authenticated = await authAPI.isAuthenticated();

            if (authenticated !== isAuthenticatedRef.current) {
                isAuthenticatedRef.current = authenticated;
                setIsAuthenticated(authenticated);

                // Load user data only when authentication state changes to true
                if (authenticated && !hasLoadedDataRef.current) {
                    console.log('🔄 Loading user data from backend...');
                    await loadUserData();
                    hasLoadedDataRef.current = true;
                    setHasLoadedData(true);
                }

                // Reset loaded flag when user logs out
                if (!authenticated && hasLoadedDataRef.current) {
                    hasLoadedDataRef.current = false;
                    setHasLoadedData(false);
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
            if (isAuthenticatedRef.current !== false) {
                isAuthenticatedRef.current = false;
                setIsAuthenticated(false);
            }
            hasLoadedDataRef.current = false;
            setHasLoadedData(false);
        } finally {
            if (loading) {
                setLoading(false);
            }
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

    // Determine which screen should be the initial route
    const getInitialRouteName = () => {
        if (!isAuthenticated) return 'Login';
        if (!hasCompletedOnboarding) return 'Onboarding';
        return 'BottomTabs';
    };

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
            {(!isAuthenticated || !hasCompletedOnboarding) && (
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
            )}

            {(isAuthenticated && hasCompletedOnboarding) && (
                <>
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
                        options={{ presentation: 'modal', headerShown: true }}
                    />

                    <Stack.Screen
                        name="ExpenseDetails"
                        component={require('../screens/ExpenseDetails').default}
                        options={{
                            title: 'Expense Details',
                            headerShown: true
                        }}
                    />
                    <Stack.Screen
                        name="PDFExport"
                        component={require('../screens/PDFExportScreen').default}
                        options={{
                            title: 'PDF Export',
                            headerShown: true
                        }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}