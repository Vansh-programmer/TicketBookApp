import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedView = Animated.View;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const GlobalFlowBackground = () => {
  const driftA = useRef(new Animated.Value(0)).current;
  const driftB = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loopA = Animated.loop(
      Animated.sequence([
        Animated.timing(driftA, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(driftA, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );

    const loopB = Animated.loop(
      Animated.sequence([
        Animated.timing(driftB, {
          toValue: 1,
          duration: 12000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(driftB, {
          toValue: 0,
          duration: 12000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );

    loopA.start();
    loopB.start();
    shimmerLoop.start();

    return () => {
      loopA.stop();
      loopB.stop();
      shimmerLoop.stop();
    };
  }, [driftA, driftB, shimmer]);

  const orbAStyle = {
    transform: [
      {
        translateX: driftA.interpolate({
          inputRange: [0, 1],
          outputRange: [-24, 28],
        }),
      },
      {
        translateY: driftA.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 42],
        }),
      },
      {
        scale: driftA.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.15],
        }),
      },
    ],
  };

  const orbBStyle = {
    transform: [
      {
        translateX: driftB.interpolate({
          inputRange: [0, 1],
          outputRange: [18, -34],
        }),
      },
      {
        translateY: driftB.interpolate({
          inputRange: [0, 1],
          outputRange: [20, -26],
        }),
      },
      {
        scale: driftB.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.12],
        }),
      },
    ],
  };

  const shimmerStyle = {
    transform: [
      {
        translateX: shimmer.interpolate({
          inputRange: [-1, 1],
          outputRange: [-420, 420],
        }),
      },
      {
        rotate: shimmer.interpolate({
          inputRange: [-1, 1],
          outputRange: ['-15deg', '15deg'],
        }),
      },
    ],
  };

  return (
    <View
      style={[styles.overlay, styles.pointerNone]}
    >
      <AnimatedView style={[styles.orb, styles.orbTopLeft, orbAStyle]}>
        <LinearGradient
          colors={['rgba(229, 9, 20, 0.18)', 'rgba(120, 12, 18, 0.1)', 'rgba(255, 120, 159, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </AnimatedView>

      <AnimatedView style={[styles.orb, styles.orbBottomRight, orbBStyle]}>
        <LinearGradient
          colors={['rgba(229, 9, 20, 0.16)', 'rgba(80, 8, 12, 0.08)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </AnimatedView>

      <AnimatedView style={[styles.shimmerBand, shimmerStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(229, 9, 20, 0.08)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </AnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  pointerNone: {
    pointerEvents: 'none',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
  },
  orbTopLeft: {
    width: 340,
    height: 340,
    top: -120,
    left: -120,
  },
  orbBottomRight: {
    width: 400,
    height: 400,
    right: -150,
    bottom: -170,
  },
  shimmerBand: {
    position: 'absolute',
    width: 300,
    height: '140%',
    top: '-20%',
    opacity: 0.55,
  },
});

export default GlobalFlowBackground;
