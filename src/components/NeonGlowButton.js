import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import AnimatedPressable from './AnimatedPressable';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const NeonGlowButton = ({
  colors = ['#2AFADF', '#4C83FF', '#F72585'],
  contentStyle,
  disabled = false,
  iconName,
  label,
  style,
  textStyle,
  ...pressableProps
}) => {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, {
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: disabled ? 0.2 : interpolate(glow.value, [0, 1], [0.28, 0.7]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.985, 1.03]) }],
  }));

  return (
    <AnimatedPressable
      {...pressableProps}
      disabled={disabled}
      pressedScale={0.965}
      style={style}
    >
      <Animated.View pointerEvents="none" style={[styles.glowLayer, glowStyle]}>
        <AnimatedGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        />
      </Animated.View>
      <LinearGradient
        colors={disabled ? ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)'] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={[styles.innerButton, disabled && styles.innerButtonDisabled, contentStyle]}>
          {iconName ? <Ionicons name={iconName} size={18} color="#FFFFFF" /> : null}
          <Text style={[styles.label, textStyle]}>{label}</Text>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  gradientFill: {
    flex: 1,
    borderRadius: 18,
  },
  gradientBorder: {
    borderRadius: 18,
    padding: 1,
  },
  innerButton: {
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  innerButtonDisabled: {
    backgroundColor: 'rgba(20, 20, 20, 0.96)',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default NeonGlowButton;
