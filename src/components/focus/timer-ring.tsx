import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export function TimerRing({ time, progress, status }: { time: string; progress: number; status?: string }) {
  const { colors, accent } = useAppTheme();
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${time} remaining${status ? `, ${status}` : ''}`}>
      <View style={[styles.ring, { borderColor: `${accent}32` }]}>
        <View style={[styles.progressRing, { borderColor: accent, borderRightColor: progress > 0.25 ? accent : 'transparent', borderBottomColor: progress > 0.5 ? accent : 'transparent', borderLeftColor: progress > 0.75 ? accent : 'transparent', transform: [{ rotate: '-45deg' }] }]} />
        <View style={styles.center}><Text style={[styles.time, { color: colors.text }]}>{time}</Text>{status ? <Text style={[styles.status, { color: colors.textSecondary }]}>{status}</Text> : null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center' }, ring: { width: 260, height: 260, borderRadius: 130, borderWidth: 12, alignItems: 'center', justifyContent: 'center' }, progressRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 130, borderWidth: 12 }, center: { alignItems: 'center' }, time: { fontSize: 54, fontWeight: '800', letterSpacing: -2 }, status: { fontSize: 14, fontWeight: '700', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1.5 } });
