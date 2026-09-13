import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/use-app-theme';
import { getMotionDuration } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function ProgressBar({ progress, height = 8 }: { progress: number; height?: number }) {
  const { colors, accent } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const value = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const animatedValue = useSharedValue(value);
  useEffect(() => {
    animatedValue.value = withTiming(value, { duration: getMotionDuration(420, reducedMotion) });
  }, [animatedValue, reducedMotion, value]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${animatedValue.value * 100}%` }));
  return (
    <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 1, now: value }} style={[styles.track, { height, backgroundColor: colors.backgroundSelected, borderRadius: height / 2 }]}> 
      <Animated.View style={[{ height, backgroundColor: accent, borderRadius: height / 2 }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({ track: { width: '100%', overflow: 'hidden' } });
