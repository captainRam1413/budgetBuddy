import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import Home from '../screens/Home';
import Create from '../screens/Create';
import Insights from '../screens/Insights';
import Profile from '../screens/Profile';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Onboarding from '../screens/Onboarding';
import Category from '../screens/Category';
import { useTheme } from '../context/ThemeContext';
import { useExpense } from '../context/ExpenseContext';
import { authAPI } from '../services/api';
import { SCREENS } from '../constant';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

function MyTabs() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                swipeEnabled: true,
                animationEnabled: true,
            }}
        >
            <Tab.Screen
                name={SCREENS.HOME}
                component={Home}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Text style={{ fontSize: 24 }}>{focused ? '🏠' : '🏡'}</Text>
                    ),
                }}
            />
            <Tab.Screen
                name={SCREENS.CREATE}
                component={Create}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Text style={{ fontSize: 24 }}>{focused ? '➕' : '＋'}</Text>
                    ),
                }}
            />
            <Tab.Screen
                name={SCREENS.INSIGHTS}
                component={Insights}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Text style={{ fontSize: 24 }}>{focused ? '📊' : '📈'}</Text>
                    ),
                }}
            />
            <Tab.Screen
                name={SCREENS.PROFILE}
                component={Profile}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <Text style={{ fontSize: 24 }}>{focused ? '👤' : '👥'}</Text>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { colors } = useTheme();
    const { loadUserData, hasCompletedOnboarding } = useExpense();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasLoadedData, setHasLoadedData] = useState(false);
    const isAuthenticatedRef = useRef(false);
    const hasLoadedDataRef = useRef(false);

    const checkAuth = useRef(async () => {
        try {
            const authenticated = await authAPI.isAuthenticated();
            setIsAuthenticated(authenticated);

            if (authenticated) {
                await loadUserData();
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
    }).current;

    useEffect(() => {
        checkAuth();

        // Set up interval to check authentication status periodically
        const authCheckInterval = setInterval(() => {
            checkAuth();
        }, 5000); // Check every 5 seconds for faster response

        // Check auth when app comes to foreground
        const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkAuth();
            }
        });

        return () => {
            clearInterval(authCheckInterval);
            appStateSubscription.remove();
        };
    }, []);

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
                <>
                    <Stack.Screen
                        name={SCREENS.LOGIN}
                        component={Login}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name={SCREENS.REGISTER}
                        component={Register}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name={SCREENS.ONBOARDING}
                        component={Onboarding}
                        options={{ headerShown: false }}
                    />
                </>
            ) : null}

            <Stack.Screen
                name={SCREENS.BOTTOM_TABS}
                component={MyTabs}
                options={{
                    title: 'BudgetBuddy 💰',
                    headerShown: true
                }}
            />

            <Stack.Screen
                name={SCREENS.CATEGORY}
                component={Category}
                options={{ presentation: 'modal', headerShown: false }}
            />
        </Stack.Navigator>
    );
}