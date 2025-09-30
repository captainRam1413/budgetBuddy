import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import tailwind from 'twrnc'

const EmptyList = ({ title, message }) => {
    return (
        <View style={tailwind`flex-1 justify-center items-center p-8 mt-10`}>
            <Text style={tailwind` text-6xl  mb-4`}>📝</Text>
            <Text style={tailwind`font-bold text-xl text-gray-800 mb-2`}>{title || "No expenses yet"}</Text>
            <Text style={tailwind`text-base text-gray-500 text-center`}>{message || "Add new expenses to see on your list!"}</Text>
        </View>
    )
}

export default EmptyList

const styles = StyleSheet.create({})