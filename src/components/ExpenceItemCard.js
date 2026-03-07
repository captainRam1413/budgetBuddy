import { StyleSheet, Text, View, Pressable, Animated } from 'react-native'
import React, { useEffect, useRef } from 'react'
import tailwind from 'twrnc'
import { useTheme } from '../context/ThemeContext'
import { useNavigation } from '@react-navigation/native'

const ExpenceItemCard = ({ item, index = 0 }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  // Animation values
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  // Added isIncome to color the amount text properly
  const isIncome =
    item.type === 'credit' ||
    ['income', 'salary', 'deposit', 'credit'].includes(item.category?.toLowerCase() || '') ||
    item.category === 'Income';

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 50),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, [index, opacity, translateY, scale]);

  const handlePress = () => {
    navigation.navigate('ExpenseDetails', { expense: item });
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          tailwind`rounded-3xl p-5 mb-4 border border-gray-100 dark:border-gray-800`,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 3,
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }]
          }
        ]}
      >
        <View style={tailwind`flex-row justify-between items-center`}>
          <View style={tailwind`flex-row items-center flex-1`}>
            {/* Icon view */}
            <View style={[
              tailwind`w-14 h-14 rounded-2xl justify-center items-center mr-4`,
              { backgroundColor: (item.color || '#FF6B6B') + '15' }
            ]}>
              <Text style={tailwind`text-3xl`}>{item.icon || "🍔"}</Text>
            </View>

            {/* Title view */}
            <View style={tailwind`flex-1`}>
              <Text style={[tailwind`text-lg font-bold mb-1`, { color: colors.text }]} numberOfLines={1}>
                {item.title || "Transaction"}
              </Text>

              {/* Category badge */}
              <View style={[tailwind`px-2.5 py-1 rounded-lg self-start flex-row items-center`, { backgroundColor: (item.color || "#FF6B6B") + '15' }]}>
                <View style={[tailwind`w-1.5 h-1.5 rounded-full mr-1.5`, { backgroundColor: item.color || '#FF6B6B' }]} />
                <Text style={[tailwind`text-xs font-bold uppercase tracking-wider`, { color: item.color || '#FF6B6B' }]}>
                  {item.category || "General"}
                </Text>
              </View>
            </View>
          </View>

          {/* Date and amount view */}
          <View style={tailwind`items-end ml-3`}>
            <Text style={[
              tailwind`text-xl font-bold tracking-tight`,
              { color: isIncome ? colors.success || '#10B981' : colors.text }
            ]}>
              {isIncome ? '+' : ''}₹{item.amount ? item.amount.toFixed(0) : "0"}
            </Text>
            <Text style={[tailwind`text-xs mt-1.5 font-medium`, { color: colors.textTertiary }]}>
              {item.date || "Just now"}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

export default ExpenceItemCard

const styles = StyleSheet.create({})