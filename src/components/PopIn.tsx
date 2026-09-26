import { PropsWithChildren, useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { POP_SPRING } from '../lib/motion';

// The Pop token: a one-time overshoot on mount, used sparingly (DESIGN.md section 10) —
// the 30-Day Track day-complete moment and SSILD's round-complete beat.
export function PopIn({ children }: PropsWithChildren) {
  const reducedMotion = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      scale.setValue(1);
      return;
    }
    const animation = Animated.spring(scale, { toValue: 1, ...POP_SPRING, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [scale, reducedMotion]);

  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}
