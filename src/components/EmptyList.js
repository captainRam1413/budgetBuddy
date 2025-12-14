import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import tailwind from 'twrnc'
import { useTheme } from '../context/ThemeContext'

const EmptyList = ({ title, message }) => {
    const { colors } = useTheme();
    return (
        <View style={tailwind`flex-1 justify-center items-center p-8 mt-10`}>
            <Text style={tailwind` text-6xl  mb-4`}>📝</Text>
            <Text style={[tailwind`font-bold text-xl mb-2`, { color: colors.text }]}>{title || "No expenses yet"}</Text>
            <Text style={[tailwind`text-base text-center`, { color: colors.textSecondary }]}>{message || "Add new expenses to see on your list!"}</Text>
        </View>
    )
}

export default EmptyList

const styles = StyleSheet.create({})