import { StyleSheet, Text, View, TextInput, Pressable, SafeAreaView, Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        // Don't manually navigate - let AppNavigator detect auth state change
        // The AppNavigator will automatically switch to the correct screen
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
    // Don't manually navigate - let AppNavigator detect auth state change
  };

  return (
    <SafeAreaView style={[tailwind`flex-1`, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tailwind`flex-1`}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={tailwind`flex-grow pb-24`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Modern Gradient Header */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tailwind`pt-16 pb-12 px-6 mb-8`}
          >
            <View style={tailwind`items-center`}>
              <View style={[tailwind`w-28 h-28 rounded-full items-center justify-center mb-6 border-4 border-white/30`, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={tailwind`text-6xl`}>💰</Text>
              </View>
              <Text style={tailwind`text-white text-4xl font-bold mb-2`}>Welcome Back</Text>
              <Text style={[tailwind`text-base`, { color: 'rgba(255,255,255,0.9)' }]}>Login to manage your budget</Text>
            </View>
          </LinearGradient>

          <View style={tailwind`px-6`}>

            {/* Email Input Card */}
            <View style={[tailwind`mb-5 rounded-2xl p-5 shadow-lg`, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
              <View style={tailwind`flex-row items-center mb-3`}>
                <View style={[tailwind`w-10 h-10 rounded-xl items-center justify-center mr-3`, { backgroundColor: '#667eea15' }]}>
                  <Text style={tailwind`text-xl`}>📧</Text>
                </View>
                <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>Email Address</Text>
              </View>
              <TextInput
                placeholder="your@email.com"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                blurOnSubmit={false}
                style={[tailwind`p-4 rounded-xl text-base`, {
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text
                }]}
              />
            </View>

            {/* Password Input Card */}
            <View style={[tailwind`mb-6 rounded-2xl p-5 shadow-lg`, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
              <View style={tailwind`flex-row items-center mb-3`}>
                <View style={[tailwind`w-10 h-10 rounded-xl items-center justify-center mr-3`, { backgroundColor: '#764ba215' }]}>
                  <Text style={tailwind`text-xl`}>🔒</Text>
                </View>
                <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>Password</Text>
              </View>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                style={[tailwind`p-4 rounded-xl text-base`, {
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text
                }]}
              />
            </View>

            {/* Login Button with Gradient */}
            <Pressable
              onPress={handleLogin}
              disabled={loading || !email || !password}
              style={({ pressed }) => [
                tailwind`rounded-2xl mb-4 shadow-lg overflow-hidden`,
                { 
                  opacity: (loading || !email || !password) ? 0.5 : (pressed ? 0.9 : 1),
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                }
              ]}
            >
              <LinearGradient
                colors={(loading || !email || !password) ? [colors.border, colors.border] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tailwind`py-5`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={tailwind`text-center font-bold text-lg text-white`}>
                    Login to Account
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View style={tailwind`flex-row items-center my-6`}>
              <View style={[tailwind`flex-1 h-px`, { backgroundColor: colors.border }]} />
              <Text style={[tailwind`mx-4 text-xs font-semibold`, { color: colors.textSecondary }]}>OR CONTINUE WITH</Text>
              <View style={[tailwind`flex-1 h-px`, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Login Button */}
            <Pressable
              onPress={handleGoogleLogin}
              style={({ pressed }) => [
                tailwind`py-4 rounded-2xl mb-8 border flex-row items-center justify-center shadow-md`,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1
                }
              ]}
            >
              <Text style={tailwind`text-2xl mr-3`}>🔍</Text>
              <Text style={[tailwind`font-bold text-base`, { color: colors.text }]}>Continue with Google</Text>
            </Pressable>

            {/* Sign Up Link */}
            <View style={tailwind`flex-row justify-center items-center`}>
              <Text style={[tailwind`text-base`, { color: colors.textSecondary }]}>Don't have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text style={[tailwind`text-base font-bold`, { color: '#667eea' }]}>Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({});
