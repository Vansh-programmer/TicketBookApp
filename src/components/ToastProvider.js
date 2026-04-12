import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ToastContext = createContext({
  showToast: () => {},
});

const TOAST_ICONS = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const TOAST_COLORS = {
  success: '#22C55E',
  error: '#FF6B6B',
  info: '#60A5FA',
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 120,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message, { type = 'info', duration = 2200 } = {}) => {
      if (!message) {
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToast({
        message,
        type,
      });

      translateY.setValue(120);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 55,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(hideToast, duration);
    },
    [hideToast, opacity, translateY],
  );

  const contextValue = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  const accentColor = toast ? TOAST_COLORS[toast.type] || TOAST_COLORS.info : TOAST_COLORS.info;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={styles.overlay}>
          <Animated.View
            style={[
              styles.toast,
              {
                borderColor: `${accentColor}55`,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
              <Ionicons
                name={TOAST_ICONS[toast.type] || TOAST_ICONS.info}
                size={18}
                color={accentColor}
              />
            </View>
            <Text style={styles.message}>{toast.message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  toast: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101010',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  message: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
