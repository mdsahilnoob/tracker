import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  const { colors } = useAppTheme();
  return <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: Spacing.three },
});
