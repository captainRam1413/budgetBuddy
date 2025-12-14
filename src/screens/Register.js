import { StyleSheet, Text, View, TextInput, Pressable, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import tailwind from 'twrnc';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';

const Register = ({ navigation }) => {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.register(name.trim(), email.trim(), phone.trim(), password);
      
      if (result.success) {
        Alert.alert('Success', 'Registration successful!', [
          {
            text: 'OK',
            onPress: () => navigation.replace('Onboarding', {
              userName: name.trim(),
              userEmail: email.trim(),
              userPhone: phone.trim()
            })
          }
        ]);
      } else {
        Alert.alert('Registration Failed', result.message || 'Could not create account');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // TODO: Add Google OAuth logic
    console.log('Register with Google');
    navigation.replace('Onboarding');
  };

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tailwind`flex-1`}
      >
        <ScrollView 
          contentContainerStyle={tailwind`px-6 py-8`}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo/Header */}
          <View style={tailwind`items-center pt-8 pb-10`}>
            <View style={[tailwind`w-20 h-20 rounded-full items-center justify-center mb-4 shadow-lg`, { backgroundColor: colors.primary }]}>
              <Text style={tailwind`text-4xl`}>💰</Text>
            </View>
            <Text style={[tailwind`text-4xl font-bold mb-2`, { color: colors.text }]}>Create Account</Text>
            <Text style={[tailwind`text-base`, { color: colors.textSecondary }]}>Start managing your budget today</Text>
          </View>

          {/* Name Input */}
          <View style={tailwind`mb-4`}>
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>👤 Full Name</Text>
            <TextInput
              placeholder="John Doe"
              placeholderTextColor={colors.placeholder}
              value={name}
              onChangeText={setName}
              style={[tailwind`p-4 rounded-2xl text-base shadow-sm`, {
                backgroundColor: colors.input,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text
              }]}
            />
          </View>

          {/* Email Input */}
          <View style={tailwind`mb-4`}>
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>📧 Email Address</Text>
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

          {/* Phone Input */}
          <View style={tailwind`mb-4`}>
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>📱 Phone Number</Text>
            <TextInput
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              style={[tailwind`p-4 rounded-2xl text-base shadow-sm`, {
                backgroundColor: colors.input,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text
              }]}
            />
          </View>

          {/* Password Input */}
          <View style={tailwind`mb-4`}>
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>🔒 Password</Text>
            <TextInput
              placeholder="Create a strong password"
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

          {/* Confirm Password Input */}
          <View style={tailwind`mb-6`}>
            <Text style={[tailwind`text-sm font-bold mb-2`, { color: colors.textSecondary }]}>🔐 Confirm Password</Text>
            <TextInput
              placeholder="Re-enter your password"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={[tailwind`p-4 rounded-2xl text-base shadow-sm`, {
                backgroundColor: colors.input,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text
              }]}
            />
          </View>

          {/* Register Button */}
          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={[tailwind`py-5 rounded-2xl mb-4 shadow-lg`, { backgroundColor: colors.success, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={tailwind`text-white text-center font-bold text-lg`}>Create Account</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={tailwind`flex-row items-center my-6`}>
            <View style={[tailwind`flex-1 h-px`, { backgroundColor: colors.border }]} />
            <Text style={[tailwind`mx-4 text-sm font-semibold`, { color: colors.textSecondary }]}>OR SIGN UP WITH</Text>
            <View style={[tailwind`flex-1 h-px`, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Register Button */}
          <Pressable
            onPress={handleGoogleRegister}
            style={[tailwind`py-4 rounded-2xl mb-6 border flex-row items-center justify-center shadow-sm`, {
              backgroundColor: colors.surface,
              borderColor: colors.border
            }]}
          >
            <Text style={tailwind`text-2xl mr-3`}>🔍</Text>
            <Text style={[tailwind`font-bold text-base`, { color: colors.text }]}>Google</Text>
          </Pressable>

          {/* Login Link */}
          <View style={tailwind`flex-row justify-center items-center`}>
            <Text style={[tailwind`text-base`, { color: colors.textSecondary }]}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={[tailwind`text-base font-bold`, { color: colors.primary }]}>Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Register;

const styles = StyleSheet.create({});
