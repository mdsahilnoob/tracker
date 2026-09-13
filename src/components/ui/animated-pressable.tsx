import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { runOnUI, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
};

export function AnimatedPressable({ animated = true, disabled, onPressIn, onPressOut, style, ...props }: AnimatedPressableProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const shouldAnimate = animated && !reducedMotion && !disabled;
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[style, shouldAnimate ? animatedStyle : undefined]}>
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={(event) => {
          if (shouldAnimate) runOnUI(animateScale)(scale, 0.97);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          if (shouldAnimate) runOnUI(animateScale)(scale, 1);
          onPressOut?.(event);
        }}
        style={styles.fill}
      />
    </Animated.View>
  );
}

function animateScale(scale: SharedValue<number>, target: number) {
  'worklet';
  scale.value = withSpring(target, { damping: 18, stiffness: 320 });
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
