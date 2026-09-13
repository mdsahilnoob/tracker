import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

export function AnimatedReveal({ children, delay = 0, style }: PropsWithChildren<{ delay?: number; style?: StyleProp<ViewStyle> }>) {
  const reducedMotion = useReducedMotion();
  return <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(320).delay(delay)} style={style}>{children}</Animated.View>;
}
