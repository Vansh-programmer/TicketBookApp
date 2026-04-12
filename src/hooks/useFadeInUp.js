import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const useFadeInUp = ({ delay = 0, distance = 16, duration = 350 } = {}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [delay, distance, duration, opacity, translateY]);

  return {
    opacity,
    transform: [{ translateY }],
  };
};

export default useFadeInUp;
