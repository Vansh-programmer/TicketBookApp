import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfigError } from '../config/firebase';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(1)).current;
  const titleTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });
  const buttonTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 2000,
        easing: Easing.ease,
        useNativeDriver: true,
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
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubscribeAuth();
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Content overlay */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        {/* App Title */}
        <Text style={styles.title}>
          Cinema
          <Text style={styles.redText}>Ticket</Text>
          <Text style={styles.title}>Booking</Text>
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Discover and book the latest movies at your favorite cinemas
        </Text>

        {/* Get Started Button */}
        <View style={styles.buttonContainer}>
          <Animated.View
            style={[
              styles.button,
              { opacity: fadeAnim, transform: [{ translateY: buttonTranslateY }] },
            ]}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Animated.View>
        </View>

        {/* Splash Screen Footer with Logo */}
        <View style={styles.footer}>
          <View style={styles.logoContainer}>
            <Ionicons name="film-outline" size={32} color="#E50914" />
          </View>
          <Text style={styles.footerText}>© 2024 Cinema Ticket Booking</Text>
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
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  redText: {
    color: '#E50914',
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 10,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 60,
  },
  button: {
    width: width - 40,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#E50914',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    width: '100%',
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#808080',
  },
});

export default SplashScreen;
