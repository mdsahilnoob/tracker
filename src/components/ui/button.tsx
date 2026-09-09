import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
}: PropsWithChildren<{
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: object;
}>) {
  const { colors, accent } = useAppTheme();
  const backgroundColor = variant === 'primary' ? accent : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.backgroundSelected : 'transparent';
  const foreground = variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor, borderColor: colors.border, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 }, style]}>
      {loading ? <ActivityIndicator color={foreground} /> : <Text style={[styles.label, { color: foreground }]}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
  label: { fontSize: 16, fontWeight: '700' },
});
