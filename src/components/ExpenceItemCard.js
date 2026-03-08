import { StyleSheet, Text, View, Pressable, Animated, Easing } from 'react-native'
import React, { useEffect, useRef } from 'react'
import tailwind from 'twrnc'
import { useTheme } from '../context/ThemeContext'
import { useNavigation } from '@react-navigation/native'
import { formatDateTime } from '../helper'

const ExpenceItemCard = ({ item, index = 0 }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  // Ensure amount is always a number - CRITICAL for Android bridge
  const safeAmount = Number(item?.amount) || 0;
  const safeItem = { ...item, amount: safeAmount };

  // Animation values - initialized with hardcoded numbers only
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const highlightOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  // Added isIncome to color the amount text properly
  const isIncome =
    safeItem.type === 'credit' ||
    ['income', 'salary', 'deposit', 'credit'].includes(safeItem.category?.toLowerCase() || '') ||
    safeItem.category === 'Income';

  useEffect(() => {
    // Entrance animation with smooth spring physics
    Animated.sequence([
      Animated.delay(index * 60),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 9,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 9,
          tension: 45,
          useNativeDriver: true,
        })
      ])
    ]).start();

    // Shimmer effect for recent items (within 5 seconds)
    const createdAt = new Date(safeItem.date || safeItem.createdAt).getTime();
    const isNew = Date.now() - createdAt < 5000;
    
    if (isNew) {
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }
  }, [index]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(pressScale, {
        toValue: 0.97,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(highlightOpacity, {
        toValue: 0.1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(pressScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(highlightOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    navigation.navigate('ExpenseDetails', { expense: safeItem });
  };

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <Animated.View style={{ 
      opacity, 
      transform: [{ translateY }, { scale: Animated.multiply(scale, pressScale) }] 
    }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          tailwind`rounded-2xl p-4 mb-3 overflow-hidden`,
          {
            backgroundColor: colors.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 2,
          }
        ]}
      >
        {/* Highlight overlay on press */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isIncome ? colors.success : colors.primary,
              opacity: highlightOpacity,
              borderRadius: 16,
            }
          ]}
        />

        {/* Shimmer effect for new items */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: shimmer,
              transform: [{ translateX: shimmerTranslate }],
            }
          ]}
          pointerEvents="none"
        >
          <View
            style={{
              width: '50%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              transform: [{ skewX: '-20deg' }],
            }}
          />
        </Animated.View>

        <View style={tailwind`flex-row justify-between items-center`}>
          <View style={tailwind`flex-row items-center flex-1`}>
            {/* Icon Badge */}
            <View style={[
              tailwind`w-11 h-11 rounded-xl justify-center items-center mr-3`,
              { 
                backgroundColor: (safeItem.color || '#6366F1') + '15',
              }
            ]}>
              <Text style={tailwind`text-xl`}>{safeItem.icon || "💰"}</Text>
            </View>

            {/* Transaction Info */}
            <View style={tailwind`flex-1`}>
              <Text style={[tailwind`text-base font-bold mb-1`, { color: colors.text }]} numberOfLines={1}>
                {safeItem.title || "Transaction"}
              </Text>
              <View style={tailwind`flex-row items-center`}>
                <View style={[tailwind`w-1 h-1 rounded-full mr-1.5`, { backgroundColor: safeItem.color || '#6366F1' }]} />
                <Text style={[tailwind`text-xs font-semibold`, { color: colors.textSecondary }]}>
                  {safeItem.category || "General"}
                </Text>
                <Text style={[tailwind`text-xs mx-1.5`, { color: colors.textTertiary }]}>•</Text>
                <Text style={[tailwind`text-xs font-medium`, { color: colors.textTertiary }]}>
                  {formatDateTime(safeItem.date)}
                </Text>
              </View>
            </View>
          </View>

          {/* Amount with subtle animation */}
          <View style={tailwind`items-end ml-3`}>
            <Text style={[
              tailwind`text-lg font-bold tracking-tight`,
              { color: isIncome ? '#10B981' : colors.text }
            ]}>
              {isIncome ? '+' : '-'}₹{safeAmount.toFixed(0)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

export default ExpenceItemCard

const styles = StyleSheet.create({})