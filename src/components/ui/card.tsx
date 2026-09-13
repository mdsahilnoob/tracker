import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useSettingsStore } from '@/stores/use-settings-store';
import { Surface } from './surface';

export function Card({ children, style, elevated = false }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; elevated?: boolean }>) {
  const reducedMotion = useReducedMotion();
  const animationsEnabled = useSettingsStore((state) => state.settings.animationsEnabled !== false);
  return <Animated.View entering={reducedMotion || !animationsEnabled ? undefined : FadeInDown.duration(360)}><Surface style={[styles.card, style]} elevated={elevated}>{children}</Surface></Animated.View>;
}

const styles = StyleSheet.create({ card: { padding: 20 } });
