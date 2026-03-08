import { StyleSheet, Text, View, TextInput, Pressable, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import tailwind from 'twrnc';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/appwriteAPI';

const Register = ({ navigation }) => {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const emailRef = React.useRef();
  const phoneRef = React.useRef();
  const passwordRef = React.useRef();
  const confirmPasswordRef = React.useRef();

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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={tailwind`py-8 pb-24`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Modern Gradient Header */}
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tailwind`pt-12 pb-10 px-6 mb-6`}
          >
            <View style={tailwind`items-center`}>
              <View style={[tailwind`w-24 h-24 rounded-full items-center justify-center mb-5 border-4 border-white/30`, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={tailwind`text-5xl`}>💰</Text>
              </View>
              <Text style={tailwind`text-white text-4xl font-bold mb-2`}>Create Account</Text>
              <Text style={[tailwind`text-base`, { color: 'rgba(255,255,255,0.9)' }]}>Start managing your budget today</Text>
            </View>
          </LinearGradient>

          <View style={tailwind`px-6`}>

            {/* User Details Card */}
            <View style={[tailwind`mb-4 rounded-2xl p-5 shadow-lg`, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
              <View style={tailwind`flex-row items-center mb-4`}>
                <View style={[tailwind`w-10 h-10 rounded-xl items-center justify-center mr-3`, { backgroundColor: '#f093fb15' }]}>
                  <Text style={tailwind`text-xl`}>👤</Text>
                </View>
                <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>Personal Info</Text>
              </View>
              
              <Text style={[tailwind`text-xs font-bold mb-2`, { color: colors.textSecondary }]}>Full Name</Text>
              <TextInput
                placeholder="John Doe"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
                style={[tailwind`p-3 rounded-xl text-base mb-4`, {
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text
                }]}
              />

              <Text style={[tailwind`text-xs font-bold mb-2`, { color: colors.textSecondary }]}>Email Address</Text>
              <TextInput
                ref={emailRef}
                placeholder="your@email.com"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                blurOnSubmit={false}
                style={[tailwind`p-3 rounded-xl text-base mb-4`, {
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text
                }]}
              />

              <Text style={[tailwind`text-xs font-bold mb-2`, { color: colors.textSecondary }]}>Phone Number</Text>
              <TextInput
                ref={phoneRef}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                style={[tailwind`p-3 rounded-xl text-base`, {
                  backgroundColor: colors.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text
                }]}
              />
            </View>

            {/* Security Card */}
            <View style={[tailwind`mb-6 rounded-2xl p-5 shadow-lg`, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
              <View style={tailwind`flex-row items-center mb-4`}>
                <View style={[tailwind`w-10 h-10 rounded-xl items-center justify-center mr-3`, { backgroundColor: '#f5576c15' }]}>
                  <Text style={tailwind`text-xl`}>🔒</Text>
                </View>
                <Text style={[tailwind`text-base font-bold`, { color: colors.text }]}>Security</Text>
              </View>

              <Text style={[tailwind`text-xs font-bold mb-2`, { color: colors.textSecondary }]}>Password</Text>
              <View style={tailwind`relative mb-2`}>
                <TextInput
                  ref={passwordRef}
                  placeholder="Create a strong password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  blurOnSubmit={false}
                  style={[tailwind`p-3 pr-12 rounded-xl text-base`, {
                    backgroundColor: colors.input,
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                />
                <Pressable 
                  onPress={() => setShowPassword(!showPassword)}
                  style={tailwind`absolute right-3 top-3`}
                >
                  <Text style={tailwind`text-lg`}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </Pressable>
              </View>
              {password.length > 0 && password.length < 6 && (
                <Text style={[tailwind`text-xs mb-4`, { color: colors.error || '#ef4444' }]}>⚠️ Password must be at least 6 characters</Text>
              )}
              {password.length >= 6 && (
                <View style={tailwind`mb-4`} />
              )}

              <Text style={[tailwind`text-xs font-bold mb-2`, { color: colors.textSecondary }]}>Confirm Password</Text>
              <View style={tailwind`relative mb-2`}>
                <TextInput
                  ref={confirmPasswordRef}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  style={[tailwind`p-3 pr-12 rounded-xl text-base`, {
                    backgroundColor: colors.input,
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                />
                <Pressable 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={tailwind`absolute right-3 top-3`}
                >
                  <Text style={tailwind`text-lg`}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </Pressable>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={[tailwind`text-xs`, { color: colors.error || '#ef4444' }]}>⚠️ Passwords do not match</Text>
              )}
              {confirmPassword.length > 0 && password === confirmPassword && (
                <Text style={[tailwind`text-xs`, { color: colors.success || '#10b981' }]}>✓ Passwords match</Text>
              )}
            </View>

            {/* Register Button with Gradient */}
            <Pressable
              onPress={handleRegister}
              disabled={loading || !name || !email || !phone || !password || !confirmPassword || password !== confirmPassword}
              style={({ pressed }) => [
                tailwind`rounded-2xl mb-4 shadow-lg overflow-hidden`,
                { 
                  opacity: (loading || !name || !email || !phone || !password || !confirmPassword || password !== confirmPassword) ? 0.5 : (pressed ? 0.9 : 1),
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                }
              ]}
            >
              <LinearGradient
                colors={(loading || !name || !email || !phone || !password || !confirmPassword || password !== confirmPassword) ? [colors.border, colors.border] : ['#f093fb', '#f5576c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tailwind`py-5`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={tailwind`text-center font-bold text-lg text-white`}>
                    Create Account
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View style={tailwind`flex-row items-center my-6`}>
              <View style={[tailwind`flex-1 h-px`, { backgroundColor: colors.border }]} />
              <Text style={[tailwind`mx-4 text-xs font-semibold`, { color: colors.textSecondary }]}>OR SIGN UP WITH</Text>
              <View style={[tailwind`flex-1 h-px`, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Register Button */}
            <Pressable
              onPress={handleGoogleRegister}
              style={({ pressed }) => [
                tailwind`py-4 rounded-2xl mb-6 border flex-row items-center justify-center shadow-md`,
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

            {/* Login Link */}
            <View style={tailwind`flex-row justify-center items-center`}>
              <Text style={[tailwind`text-base`, { color: colors.textSecondary }]}>Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={[tailwind`text-base font-bold`, { color: '#f093fb' }]}>Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Register;

const styles = StyleSheet.create({});
