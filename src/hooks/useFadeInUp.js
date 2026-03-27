import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const useFadeInUp = ({ delay = 0, distance = 16, duration = 350 } = {}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, distance, duration, opacity, translateY]);

  return {
    opacity,
    transform: [{ translateY }],
  };
};

export default useFadeInUp;
