import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';

import { Surface } from './surface';

export function Card({ children, style, elevated = false }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; elevated?: boolean }>) {
  return <Surface style={[styles.card, style]} elevated={elevated}>{children}</Surface>;
}

const styles = StyleSheet.create({ card: { padding: 20 } });
