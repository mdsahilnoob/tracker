import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export function Surface({ children, style, elevated = false }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; elevated?: boolean }>) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.surface, elevated && styles.elevated, { backgroundColor: colors.backgroundElement, borderColor: elevated ? 'transparent' : colors.border }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, padding: 20 },
  elevated: {
    shadowColor: '#2C170D',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});
