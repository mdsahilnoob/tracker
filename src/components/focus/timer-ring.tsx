import { Circle, Svg } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

const VIEWBOX_SIZE = 300;
const RADIUS = 122;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerRing({ time, progress, status, size = 286 }: { time: string; progress: number; status?: string; size?: number }) {
  const { colors, accent } = useAppTheme();
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
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 52, fontWeight: '800', letterSpacing: -2.2 },
  status: { fontSize: 13, fontWeight: '700', marginTop: 7, letterSpacing: 0.4 },
});
