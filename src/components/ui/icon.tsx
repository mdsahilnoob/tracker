import { SymbolView } from 'expo-symbols';
import { StyleSheet } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export type AppIconName = {
  ios: string;
  android: string;
  web: string;
};

export function Icon({ name, size = 20, color, label }: { name: AppIconName; size?: number; color?: string; label?: string }) {
  const { colors } = useAppTheme();
  return (
    <SymbolView
      name={name as never}
      size={size}
      weight="medium"
      tintColor={color ?? colors.text}
      accessible={Boolean(label)}
      accessibilityLabel={label}
      style={styles.icon}
    />
  );
}

const styles = StyleSheet.create({ icon: { alignItems: 'center', justifyContent: 'center' } });
