import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

const GlassSurface = ({
  children,
  intensity = 32,
  style,
}) => (
  <View style={[styles.shell, style]}>
    <BlurView
      intensity={Platform.OS === 'android' ? Math.min(intensity, 45) : intensity}
      tint="dark"
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      style={styles.blur}
    />
    <View style={styles.inner}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ffffff33',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  inner: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
});

export default GlassSurface;
