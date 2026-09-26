import { ComponentProps, useState } from 'react';
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, EASE_OUT, RELEASE_SPRING } from '../lib/motion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type AnimatedPressableProps = Omit<ComponentProps<typeof Pressable>, 'style'> & {
  style?: StyleProp<ViewStyle>;
  // How far the scale-down on press-in goes. 1 disables the scale (opacity-only feedback).
  scaleTo?: number;
};

// The Micro/Release token pair: scales/dims on press-in, springs back on release. Under
// reduced motion the scale is dropped and only the opacity dip (a Cross-safe fade)
// remains, so press feedback never disappears entirely.
export function AnimatedPressable({
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: AnimatedPressableProps) {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  return (
    <AnimatedPressableBase
      onPressIn={(event) => {
        Animated.timing(progress, {
          toValue: 1,
          duration: DURATIONS.micro,
          easing: EASE_OUT,
          useNativeDriver: true,
        }).start();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        Animated.spring(progress, { toValue: 0, ...RELEASE_SPRING, useNativeDriver: true }).start();
        onPressOut?.(event);
      }}
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] }),
          transform: [
            {
              scale: reducedMotion
                ? 1
                : progress.interpolate({ inputRange: [0, 1], outputRange: [1, scaleTo] }),
            },
          ],
        },
      ]}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
}
