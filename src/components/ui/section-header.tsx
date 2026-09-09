import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  const { colors } = useAppTheme();
  return <View style={styles.row}><Text style={[styles.title, { color: colors.text }]}>{title}</Text>{action}</View>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.two }, title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 } });
