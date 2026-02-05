import { StyleSheet, Text, View, Pressable } from 'react-native'
import React from 'react'
import tailwind from 'twrnc'
import { useTheme } from '../context/ThemeContext'
import { useNavigation } from '@react-navigation/native'

const ExpenceItemCard = ({ item }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('ExpenseDetails', { expense: item });
  };

  return (
    <Pressable 
      onPress={handlePress}
      style={({ pressed }) => [
        tailwind`rounded-2xl p-4 shadow-sm mb-3`, 
        { 
          backgroundColor: colors.surface,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }]
        }
      ]}
    >
      <View style={tailwind`flex-row justify-between items-center`}>
        <View style={tailwind`flex-row items-center flex-1`}>
          {/* Icon view */}
          <View style={[tailwind`w-12 h-12 rounded-xl justify-center items-center mr-4`, { backgroundColor: (item.color || '#FF6B6B') + '20' }]}>
            <Text style={tailwind`text-2xl`}>{item.icon || "🍔"}</Text>
          </View>

          {/* Title view */}
          <View style={tailwind`flex-1`}>
            <Text style={[tailwind`text-base font-semibold`, { color: colors.text }]}>
              {item.title || "Food"}
            </Text>

            {/* Category badge */}
            <View style={[tailwind`mt-1 px-2 py-1 rounded-lg self-start`, {backgroundColor: (item.color || "#FF6B6B") + '20'}]}>
              <Text style={[tailwind`text-xs font-bold`, { color: item.color || '#FF6B6B' }]}>
                {item.category || "Food and Drinks"}
              </Text>
            </View>
          </View>
        </View>

        {/* Date and amount view */}
        <View style={tailwind`items-end`}>
          <Text style={[tailwind`text-lg font-bold`, { color: colors.text }]}>
            ₹{item.amount ? item.amount.toFixed(0) : "20"}
          </Text>
          <Text style={[tailwind`text-xs mt-1`, { color: colors.textTertiary }]}>
            {item.date || "12 Aug, 2023"}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

export default ExpenceItemCard

const styles = StyleSheet.create({})