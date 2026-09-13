import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export function ProgressBar({ progress, height = 8 }: { progress: number; height?: number }) {
  const { colors, accent } = useAppTheme();
  return (
    <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 1, now: Math.min(1, Math.max(0, progress)) }} style={[styles.track, { height, backgroundColor: colors.backgroundSelected, borderRadius: height / 2 }]}> 
      <View style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%`, height, backgroundColor: accent, borderRadius: height / 2 }} />
    </View>
  );
}

const styles = StyleSheet.create({ track: { width: '100%', overflow: 'hidden' } });
