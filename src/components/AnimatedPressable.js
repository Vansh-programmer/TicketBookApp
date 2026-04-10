import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = ({
  children,
  contentStyle,
  disabled = false,
  onPressIn,
  onPressOut,
  pressedScale = 0.97,
  style,
  ...pressableProps
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (event) => {
    scale.value = withSpring(pressedScale, {
      damping: 18,
      stiffness: 260,
      mass: 0.6,
    });
    onPressIn?.(event);
  };

  const handlePressOut = (event) => {
    scale.value = withSpring(1, {
      damping: 16,
      stiffness: 240,
      mass: 0.6,
    });
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        {...pressableProps}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.pressable, contentStyle]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
});

export default AnimatedPressable;
