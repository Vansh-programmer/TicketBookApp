import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firebaseConfigError } from '../config/firebase';
import { useToast } from '../components/ToastProvider';
import useFadeInUp from '../hooks/useFadeInUp';
import {
  playSoundEffect,
  SOUND_EFFECT_KEYS,
} from '../services/soundEffects';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthErrors';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const { showToast } = useToast();
  const headerAnimation = useFadeInUp({ delay: 0 });
  const formAnimation = useFadeInUp({ delay: 100 });
  const configError = firebaseConfigError
    ? 'This build is missing Firebase setup. Please install the latest APK.'
    : '';

  const isFormValid = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0,
    [email, password],
  );

  const handleLogin = async () => {
    if (!isFormValid || isLoading) {
      return;
    }

    if (!auth) {
      setAuthError(configError || 'Login is unavailable in this build.');
      showToast(configError || 'Login is unavailable in this build.', { type: 'error' });
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      playSoundEffect(SOUND_EFFECT_KEYS.SUCCESS);
      showToast('Welcome back!', { type: 'success' });
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
          <View style={styles.heroBadge}>
            <Ionicons name="ticket-outline" size={14} color="#FFD66B" />
            <Text style={styles.heroBadgeText}>TicketBook</Text>
          </View>

          <View style={styles.logoContainer}>
            <View style={styles.logoHalo}>
              <Ionicons name="film-outline" size={52} color="#F8FAFC" />
            </View>
            <Text style={styles.logoText}>TicketBook</Text>
          </View>

          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.welcomeSubtitle}>Book seats and manage tickets.</Text>
        </Animated.View>

        <Animated.View style={formAnimation}>
          <View style={styles.form}>
            <Text style={styles.formEyebrow}>Account</Text>
            <Text style={styles.formTitle}>Sign in</Text>
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
              onPress={handleLogin}
              disabled={!isFormValid || isLoading || !auth}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New here?</Text>
            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => {
                playSoundEffect(SOUND_EFFECT_KEYS.TAP);
                navigation.navigate('Signup');
              }}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>Create account</Text>
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
    paddingVertical: 32,
  },
  heroBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 32,
    marginBottom: 22,
  },
  heroBadgeText: {
    color: '#F5D98E',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoHalo: {
    width: 96,
    height: 96,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#B8C0CC',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  form: {
    backgroundColor: 'rgba(15, 18, 24, 0.88)',
    borderRadius: 8,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 0,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.24,
    shadowRadius: 26,
  },
  formEyebrow: {
    color: '#D6B15A',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: 8,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 18,
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
    borderColor: 'rgba(255, 255, 255, 0.07)',
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
    marginBottom: 20,
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
    backgroundColor: '#DE3341',
  },
  buttonDisabled: {
    backgroundColor: '#4D2430',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signupText: {
    fontSize: 14,
    color: '#B0B0B0',
    marginRight: 8,
  },
  signupButton: {
    padding: 0,
  },
  signupButtonText: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
