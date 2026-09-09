import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export function ProgressBar({ progress, height = 10 }: { progress: number; height?: number }) {
  const { colors, accent } = useAppTheme();
  return (
    <View style={[styles.track, { height, backgroundColor: colors.backgroundSelected, borderRadius: height / 2 }]}>
      <View style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%`, height, backgroundColor: accent, borderRadius: height / 2 }} />
    </View>
  );
}

const styles = StyleSheet.create({ track: { width: '100%', overflow: 'hidden' } });
