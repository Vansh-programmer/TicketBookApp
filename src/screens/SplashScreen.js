import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image, Platform } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfigError } from '../config/firebase';

const APP_ICON = require('../../assets/branding/app-icon.png');
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.ease),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.ease),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();

    let isMounted = true;
    let unsubscribeAuth = () => {};

    const timer = setTimeout(() => {
      if (!auth) {
        navigation.replace('Login', { firebaseConfigError });
        return;
      }

      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (!isMounted) {
          return;
        }

        navigation.replace(user ? 'Home' : 'Login');
        unsubscribeAuth();
      });
    }, 900);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubscribeAuth();
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.brandMark,
          {
            opacity: fadeAnim,
            transform: [{ translateY: logoTranslateY }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image source={APP_ICON} style={styles.logoImage} resizeMode="contain" />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brandMark: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 132,
    height: 132,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  logoImage: {
    width: 118,
    height: 118,
  },
});

export default SplashScreen;
