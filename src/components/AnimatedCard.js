import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import tailwind from 'twrnc';

const AnimatedCard = ({ 
  children, 
  onPress, 
  delay = 0, 
  style,
  colors,
  enableHover = true,
  index = 0 
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const hoverScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay + index * 80),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
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
        }),
      ]),
    ]).start();
  }, [delay, index]);

  const handlePressIn = () => {
    if (enableHover && onPress) {
      Animated.spring(hoverScale, {
        toValue: 0.97,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (enableHover && onPress) {
      Animated.spring(hoverScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  };

  const content = (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [
            { translateY },
            { scale: Animated.multiply(scale, hoverScale) }
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

export default AnimatedCard;
