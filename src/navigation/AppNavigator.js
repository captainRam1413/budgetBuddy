import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, Platform, ActivityIndicator, View, TouchableOpacity, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
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

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View style={{
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 10),
            paddingTop: 10,
            height: 65 + Math.max(insets.bottom, 0),
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
        }}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel !== undefined
                    ? options.tabBarLabel
                    : options.title !== undefined
                        ? options.title
                        : route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate({ name: route.name, merge: true });
                    }
                };

                const Icon = options.tabBarIcon;

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        onPress={onPress}
                        activeOpacity={0.7}
                        style={{ flex: 1, alignItems: 'center' }}
                    >
                        {Icon && <Icon focused={isFocused} color={isFocused ? colors.primary : colors.textSecondary} />}
                        <Text style={{
                            color: isFocused ? colors.primary : colors.textSecondary,
                            fontSize: 11,
                            fontWeight: '600',
                            marginTop: 4
                        }}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function MyTabs() {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            tabBarPosition="bottom"
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                swipeEnabled: true,
                animationEnabled: true,
            }}
        >
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    tabBarLabel: "Home",
                    tabBarIcon: ({ focused, color }) => (
                        <Text style={{ fontSize: 22, color }}>{focused ? '🏠' : '🏡'}</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Create"
                component={Create}
                options={{
                    tabBarLabel: "Create",
                    tabBarIcon: ({ focused, color }) => (
                        <Text style={{ fontSize: 24, color }}>{focused ? '➕' : '＋'}</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Insights"
                component={Insights}
                options={{
                    tabBarLabel: "Insights",
                    tabBarIcon: ({ focused, color }) => (
                        <Text style={{ fontSize: 22, color }}>{focused ? '📊' : '📈'}</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={Profile}
                options={{
                    tabBarLabel: "Profile",
                    tabBarIcon: ({ focused, color }) => (
                        <Text style={{ fontSize: 22, color }}>{focused ? '👤' : '👥'}</Text>
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
    const isAuthenticatedRef = useRef(false);
    const hasLoadedDataRef = useRef(false);

    const checkAuth = useRef(async () => {
        try {
            const authenticated = await authAPI.isAuthenticated();
            console.log('🔍 Auth check:', authenticated ? 'Authenticated' : 'Not authenticated');

            if (authenticated !== isAuthenticatedRef.current) {
                isAuthenticatedRef.current = authenticated;
                setIsAuthenticated(authenticated);
                console.log('✅ Auth state changed to:', authenticated);

                // Load user data only when authentication state changes to true
                if (authenticated && !hasLoadedDataRef.current) {
                    console.log('🔄 Loading user data from backend...');
                    await loadUserData(true); // Force recalculation on initial load
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