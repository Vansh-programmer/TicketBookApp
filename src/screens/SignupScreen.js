import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firebaseConfigError } from '../config/firebase';
import { useToast } from '../components/ToastProvider';
import useFadeInUp from '../hooks/useFadeInUp';
import {
  playSoundEffect,
  SOUND_EFFECT_KEYS,
} from '../services/soundEffects';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthErrors';

const APP_ICON = require('../../assets/branding/app-icon.png');
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const logoPulse = useRef(new Animated.Value(1)).current;
  const titleFlow = useRef(new Animated.Value(0)).current;
  const titleGradientShift = useRef(new Animated.Value(-18)).current;
  const subtitleFloat = useRef(new Animated.Value(0)).current;
  const { showToast } = useToast();
  const headerAnimation = useFadeInUp({ delay: 0 });
  const formAnimation = useFadeInUp({ delay: 100 });
  const configError = firebaseConfigError
    ? 'This build is missing Firebase setup. Please install the latest APK.'
    : '';

  const passwordsMatch = password === confirmPassword;
  const isFormValid = useMemo(
    () =>
      email.trim().length > 0 &&
      password.trim().length >= 6 &&
      confirmPassword.trim().length >= 6 &&
      passwordsMatch,
    [confirmPassword, email, password, passwordsMatch],
  );

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.045,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );

    const titleFlowLoop = Animated.loop(
      Animated.timing(titleFlow, {
        toValue: 1,
        duration: 3600,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );

    const gradientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(titleGradientShift, {
          toValue: 18,
          duration: 2300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(titleGradientShift, {
          toValue: -18,
          duration: 2300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );

    const subtitleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(subtitleFloat, {
          toValue: -2,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(subtitleFloat, {
          toValue: 2,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );

    pulseLoop.start();
    titleFlowLoop.start();
    gradientLoop.start();
    subtitleLoop.start();

    return () => {
      pulseLoop.stop();
      titleFlowLoop.stop();
      gradientLoop.stop();
      subtitleLoop.stop();
    };
  }, [logoPulse, subtitleFloat, titleFlow, titleGradientShift]);

  const flowTitleColor = titleFlow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FFE791', '#FF9F64', '#68D6FF'],
  });
  const flowTitleShadow = titleFlow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(255, 206, 102, 0.35)', 'rgba(255, 146, 114, 0.35)', 'rgba(108, 208, 255, 0.35)'],
  });

  const handleSignup = async () => {
    if (!isFormValid || isLoading) {
      return;
    }

    if (!auth) {
      setAuthError(configError || 'Signup is unavailable in this build.');
      showToast(configError || 'Signup is unavailable in this build.', { type: 'error' });
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      playSoundEffect(SOUND_EFFECT_KEYS.SUCCESS);
      showToast('Account created successfully!', { type: 'success' });
      navigation.replace('Home');
    } catch (error) {
      const message = getFirebaseAuthErrorMessage(error);
      setAuthError(message);
      playSoundEffect(SOUND_EFFECT_KEYS.ERROR);
      showToast(message, { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={headerAnimation}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              playSoundEffect(SOUND_EFFECT_KEYS.TAP);
              navigation.goBack();
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Animated.View
              style={[
                styles.logoFrame,
                {
                  transform: [{ scale: logoPulse }],
                },
              ]}
            >
              <Image source={APP_ICON} style={styles.logoImage} resizeMode="cover" />
            </Animated.View>

            <View style={styles.titleWrap}>
              <Animated.View
                style={[
                  styles.titleUnderline,
                  {
                    transform: [{ translateX: titleGradientShift }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FFE791', '#FF9F64', '#68D6FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.2 }}
                  style={styles.titleUnderlineFill}
                />
              </Animated.View>
              <Animated.Text
                style={[
                  styles.logoText,
                  {
                    color: flowTitleColor,
                    ...(Platform.OS === 'web' ? {} : { textShadowColor: flowTitleShadow }),
                  },
                ]}
              >
                Create account
              </Animated.Text>
            </View>

            <Animated.Text
              style={[
                styles.welcomeSubtitle,
                {
                  transform: [{ translateY: subtitleFloat }],
                },
              ]}
            >
              Save tickets and seats.
            </Animated.Text>
          </View>
        </Animated.View>

        <Animated.View style={formAnimation}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#808080"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#606080"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#808080"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#606080"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => {
                  playSoundEffect(SOUND_EFFECT_KEYS.TAP);
                  setShowPassword((current) => !current);
                }}
                style={styles.passwordToggleIcon}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#808080"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#808080"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="#606080"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => {
                  playSoundEffect(SOUND_EFFECT_KEYS.TAP);
                  setShowConfirmPassword((current) => !current);
                }}
                style={styles.passwordToggleIcon}
                disabled={isLoading}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#808080"
                />
              </TouchableOpacity>
            </View>

            {!passwordsMatch && confirmPassword.length > 0 ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color="#FF6B6B" />
                <Text style={styles.errorText}>Passwords do not match.</Text>
              </View>
            ) : null}

            {configError || authError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color="#FF6B6B" />
                <Text style={styles.errorText}>{configError || authError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.button,
                (!isFormValid || isLoading || !auth) && styles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={!isFormValid || isLoading || !auth}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already registered?</Text>
            <TouchableOpacity
              onPress={() => {
                playSoundEffect(SOUND_EFFECT_KEYS.TAP);
                navigation.navigate('Login');
              }}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoFrame: {
    width: 112,
    height: 112,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleWrap: {
    alignSelf: 'center',
    marginTop: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    ...(Platform.OS === 'web'
      ? {
          textShadow: '0px 0px 10px rgba(255, 206, 102, 0.28)',
        }
      : {
          textShadowOffset: {
            width: 0,
            height: 0,
          },
          textShadowRadius: 10,
        }),
  },
  titleUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 2,
    width: 140,
    alignSelf: 'center',
    zIndex: -1,
  },
  titleUnderlineFill: {
    height: 6,
    borderRadius: 999,
    width: '100%',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 10,
  },
  form: {
    backgroundColor: 'rgba(15, 18, 24, 0.92)',
    borderRadius: 8,
    padding: 24,
    elevation: 0,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px 8px 18px rgba(0, 0, 0, 0.24)',
        }
      : {
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  passwordToggleIcon: {
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFD7D7',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  button: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#E50914',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#4A1B1E',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  loginText: {
    fontSize: 14,
    color: '#B0B0B0',
    marginRight: 8,
  },
  loginButtonText: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SignupScreen;
