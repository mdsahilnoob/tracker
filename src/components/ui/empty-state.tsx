import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Icon } from './icon';
import { Button } from './button';

export function EmptyState({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  const { colors, accent } = useAppTheme();
  return <View style={styles.container}><View style={[styles.icon, { backgroundColor: colors.accentSoft }]}><Icon name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={26} color={accent} /></View><Text style={[styles.title, { color: colors.text }]}>{title}</Text><Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>{actionLabel && onAction ? <Button onPress={onAction} style={styles.action}>{actionLabel}</Button> : null}</View>;
}

const styles = StyleSheet.create({ container: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 }, icon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.three }, title: { fontSize: 20, fontWeight: '800', marginBottom: 8 }, message: { fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 300 }, action: { marginTop: Spacing.three, minWidth: 150 } });
