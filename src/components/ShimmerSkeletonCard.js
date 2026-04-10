import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import GlassSurface from './GlassSurface';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SkeletonLine = ({ style }) => <View style={[styles.line, style]} />;

const ShimmerSkeletonCard = ({ style }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [progress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-SCREEN_WIDTH, SCREEN_WIDTH]),
      },
    ],
  }));

  return (
    <GlassSurface style={[styles.card, style]}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.authorWrap}>
            <SkeletonLine style={styles.authorLine} />
            <SkeletonLine style={styles.metaLine} />
          </View>
          <View style={styles.dot} />
        </View>
        <SkeletonLine style={styles.pillLine} />
        <SkeletonLine style={styles.bodyLine} />
        <SkeletonLine style={[styles.bodyLine, styles.bodyLineShort]} />
        <View style={styles.mediaBlock} />
        <View style={styles.actionsRow}>
          <SkeletonLine style={styles.actionPill} />
          <SkeletonLine style={styles.actionPill} />
        </View>
      </View>
      <Animated.View pointerEvents="none" style={[styles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </GlassSurface>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  content: {
    overflow: 'hidden',
    padding: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorWrap: {
    flex: 1,
    gap: 8,
  },
  line: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  authorLine: {
    width: '38%',
    height: 14,
  },
  metaLine: {
    width: '56%',
    height: 11,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillLine: {
    width: '32%',
    height: 30,
  },
  bodyLine: {
    width: '100%',
    height: 12,
  },
  bodyLineShort: {
    width: '78%',
  },
  mediaBlock: {
    height: 200,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionPill: {
    width: 84,
    height: 34,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.55,
  },
  shimmerGradient: {
    flex: 1,
    transform: [{ skewX: '-18deg' }],
  },
});

export default ShimmerSkeletonCard;
