import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tailwind from 'twrnc';
import { useTheme } from '../context/ThemeContext';

export const SkeletonLoader = ({ width = '100%', height = 20, borderRadius = 8, style }) => {
  const { colors } = useTheme();
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            'transparent',
            colors.surface,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </View>
  );
};

export const CardSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[tailwind`rounded-2xl p-4 mb-3`, { backgroundColor: colors.surface }]}>
      <View style={tailwind`flex-row items-center`}>
        <SkeletonLoader width={48} height={48} borderRadius={12} style={tailwind`mr-3`} />
        <View style={tailwind`flex-1`}>
          <SkeletonLoader width="60%" height={16} borderRadius={8} style={tailwind`mb-2`} />
          <SkeletonLoader width="40%" height={12} borderRadius={6} />
        </View>
        <SkeletonLoader width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
};

export const StatCardSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[tailwind`flex-1 rounded-2xl p-4`, { backgroundColor: colors.surface }]}>
      <SkeletonLoader width={40} height={40} borderRadius={20} style={tailwind`mb-3`} />
      <SkeletonLoader width="80%" height={20} borderRadius={10} style={tailwind`mb-2`} />
      <SkeletonLoader width="50%" height={14} borderRadius={7} />
    </View>
  );
};

const styles = StyleSheet.create({});

export default SkeletonLoader;
