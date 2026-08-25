import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import tailwind from 'twrnc'
import { useTheme } from '../context/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'

const EmptyList = ({ title, message }) => {
    const { colors } = useTheme();
    return (
        <View style={tailwind`flex-1 justify-center items-center py-12 px-6`}>
            {/* Animated Icon Container */}
            <View style={[tailwind`w-24 h-24 rounded-3xl items-center justify-center mb-6`, { backgroundColor: colors.primary + '15' }]}>
                <Text style={tailwind`text-5xl`}>📝</Text>
            </View>
            
            {/* Title */}
            <Text style={[tailwind`font-bold text-2xl mb-2 text-center`, { color: colors.text }]}>
                {title || "No transactions yet"}
            </Text>
            
            {/* Message */}
            <Text style={[tailwind`text-base text-center leading-6 mb-6`, { color: colors.textSecondary }]}>
                {message || "Start tracking your expenses to see insights and manage your budget better"}
            </Text>

            {/* Feature Highlights */}
            <View style={[tailwind`w-full max-w-xs rounded-2xl p-4 mt-2`, { backgroundColor: colors.surface }]}>
                <View style={tailwind`flex-row items-center mb-3`}>
                    <Text style={tailwind`text-xl mr-3`}>💳</Text>
                    <Text style={[tailwind`text-sm font-medium`, { color: colors.textSecondary }]}>Add expenses via UPI payment</Text>
                </View>
                <View style={tailwind`flex-row items-center mb-3`}>
                    <Text style={tailwind`text-xl mr-3`}>➕</Text>
                    <Text style={[tailwind`text-sm font-medium`, { color: colors.textSecondary }]}>Manual entry with categories</Text>
                </View>
                <View style={tailwind`flex-row items-center`}>
                    <Text style={tailwind`text-xl mr-3`}>📊</Text>
                    <Text style={[tailwind`text-sm font-medium`, { color: colors.textSecondary }]}>Track spending with insights</Text>
                </View>
            </View>
        </View>
    )
}

export default EmptyList

const styles = StyleSheet.create({})