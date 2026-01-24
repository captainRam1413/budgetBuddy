import { StyleSheet, Text, View, TextInput, Pressable, SafeAreaView, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import tailwind from 'twrnc';
import { useTheme } from '../context/ThemeContext';
import { useExpense } from '../context/ExpenseContext';
import { authAPI } from '../services/appwriteAPI';

const Login = ({ navigation }) => {
  const { colors } = useTheme();
  const { loadUserData } = useExpense();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.login(email.trim(), password);
      
      if (result.success) {
        // Load user data from backend after successful login
        await loadUserData();
        Alert.alert('Success', 'Login successful!');
        navigation.replace('BottomTabs');
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Add Google OAuth logic
    console.log('Login with Google');
    navigation.replace('BottomTabs');
  };

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tailwind`flex-1`}
      >
        <ScrollView 
          contentContainerStyle={tailwind`flex-grow px-6`}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo/Header with Gradient Background */}
          <View style={tailwind`items-center pt-16 pb-12 -mx-6 px-6 mb-8`}>
            <View style={[tailwind`w-24 h-24 rounded-full items-center justify-center mb-4 shadow-lg`, { backgroundColor: colors.primary }]}>
              <Text style={tailwind`text-5xl`}>💰</Text>
            </View>
            <Text style={[tailwind`text-4xl font-bold mb-2`, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[tailwind`text-base`, { color: colors.textSecondary }]}>Login to manage your budget</Text>
          </View>

          {/* Email Input */}
          <View style={tailwind`mb-5`}>
            <Text style={[tailwind`text-sm font-bold mb-3`, { color: colors.textSecondary }]}>📧 Email Address</Text>
            <TextInput
              placeholder="your@email.com"
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              style={[tailwind`p-4 rounded-2xl text-base shadow-sm`, {
                backgroundColor: colors.input,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text
              }]}
            />
          </View>

          {/* Password Input */}
          <View style={tailwind`mb-8`}>
            <Text style={[tailwind`text-sm font-bold mb-3`, { color: colors.textSecondary }]}>🔒 Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={[tailwind`p-4 rounded-2xl text-base shadow-sm`, {
                backgroundColor: colors.input,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text
              }]}
            />
          </View>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={[tailwind`py-5 rounded-2xl mb-4 shadow-lg`, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tailwind`text-white text-center font-bold text-lg`}>Login to Account</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={tailwind`flex-row items-center my-8`}>
            <View style={[tailwind`flex-1 h-px`, { backgroundColor: colors.border }]} />
            <Text style={[tailwind`mx-4 text-sm font-semibold`, { color: colors.textSecondary }]}>OR CONTINUE WITH</Text>
            <View style={[tailwind`flex-1 h-px`, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Login Button */}
          <Pressable
            onPress={handleGoogleLogin}
            style={[tailwind`py-4 rounded-2xl mb-8 border flex-row items-center justify-center shadow-sm`, {
              backgroundColor: colors.surface,
              borderColor: colors.border
            }]}
          >
            <Text style={tailwind`text-2xl mr-3`}>🔍</Text>
            <Text style={[tailwind`font-bold text-base`, { color: colors.text }]}>Google</Text>
          </Pressable>

          {/* Sign Up Link */}
          <View style={tailwind`flex-row justify-center items-center`}>
            <Text style={[tailwind`text-base`, { color: colors.textSecondary }]}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={[tailwind`text-base font-bold`, { color: colors.primary }]}>Sign Up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({});
