import React, { useRef } from 'react';
import { Pressable, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tailwind from 'twrnc';

const AnimatedButton = ({ 
  onPress, 
  title, 
  colors = ['#667eea', '#764ba2'], 
  icon,
  disabled = false,
  style,
  textStyle,
  loading = false
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 5,
        tension: 40,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 40,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={style}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.5 : opacityAnim,
        }}
      >
        <LinearGradient
          colors={disabled ? ['#ccc', '#ccc'] : colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[tailwind`rounded-2xl py-4 px-6 shadow-lg`, { overflow: 'hidden' }]}
        >
          <Animated.View style={tailwind`flex-row items-center justify-center`}>
            {icon && <Text style={[tailwind`text-xl mr-2`, textStyle]}>{icon}</Text>}
            <Text style={[tailwind`text-white font-bold text-base`, textStyle]}>
              {loading ? 'Loading...' : title}
            </Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

export default AnimatedButton;
