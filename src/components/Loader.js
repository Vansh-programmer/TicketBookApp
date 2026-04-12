import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const Loader = ({
  label = 'Loading...',
  fullscreen = true,
  style,
}) => (
  <View style={[fullscreen ? styles.fullscreen : styles.inline, style]}>
    <View style={styles.spinnerWrap}>
      <ActivityIndicator size="large" color="#E50914" />
    </View>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  spinnerWrap: {
    width: 72,
    height: 72,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    marginBottom: 16,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Loader;
