import { Circle, Svg } from 'react-native-svg';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useSettingsStore } from '@/stores/use-settings-store';

const VIEWBOX_SIZE = 300;
const RADIUS = 122;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerRing({ time, progress, status, size = 286 }: { time: string; progress: number; status?: string; size?: number }) {
  const { colors, accent } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const animationsEnabled = useSettingsStore((state) => state.settings.animationsEnabled !== false);
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = reducedMotion || !animationsEnabled ? 0 : withRepeat(withTiming(1, { duration: 1500 }), -1, true);
    return () => cancelAnimation(pulse);
  }, [animationsEnabled, pulse, reducedMotion]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: 0.18 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 0.08 }] }));
  const safeProgress = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const angle = -Math.PI / 2 + safeProgress * Math.PI * 2;
  const markerX = VIEWBOX_SIZE / 2 + Math.cos(angle) * RADIUS;
  const markerY = VIEWBOX_SIZE / 2 + Math.sin(angle) * RADIUS;

  return (
    <View
      accessible
      accessibilityLabel={`${time} remaining${status ? `, ${status}` : ''}`}
      style={[styles.wrap, { width: size, height: size }]}
    >
      <Animated.View pointerEvents="none" style={[styles.pulse, { width: size - 18, height: size - 18, borderRadius: size, borderColor: accent }, pulseStyle]} />
      <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
        <Circle cx={VIEWBOX_SIZE / 2} cy={VIEWBOX_SIZE / 2} r={RADIUS} fill="none" stroke={colors.backgroundSelected} strokeWidth={14} />
        <Circle
          cx={VIEWBOX_SIZE / 2}
          cy={VIEWBOX_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={accent}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - safeProgress)}
          rotation={-90}
          origin={`${VIEWBOX_SIZE / 2}, ${VIEWBOX_SIZE / 2}`}
        />
        <Circle cx={markerX} cy={markerY} r={11} fill={accent} stroke={colors.backgroundElement} strokeWidth={6} />
      </Svg>
      <View pointerEvents="none" style={styles.center}>
        <Text style={[styles.time, { color: colors.text }]}>{time}</Text>
        {status ? <Text style={[styles.status, { color: colors.textSecondary }]}>{status}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', borderWidth: 1 },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 52, fontWeight: '800', letterSpacing: -2.2 },
  status: { fontSize: 13, fontWeight: '700', marginTop: 7, letterSpacing: 0.4 },
});
