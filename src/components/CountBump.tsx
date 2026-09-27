import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, EASE_IN_OUT, EASE_OUT } from '../lib/motion';

type CountBumpProps = PropsWithChildren<{
  // Whatever value `children` is currently displaying — the bump plays whenever this
  // changes, never on initial mount (so a card that loads already at 2/4 doesn't punch).
  valueKey: string | number;
}>;

// Micro repurposed as a value-change reaction rather than a press-in: the same
// duration/easing (DESIGN.md section 10), just settling in from a punched-out state
// instead of settling out from rest, so an incrementing count registers as an event.
// Reduced motion drops the scale entirely and falls back to a plain Cross-style opacity
// blip (its own token/duration) — the change still registers, nothing punches.
export function CountBump({ valueKey, children }: CountBumpProps) {
  const reducedMotion = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const [opacity] = useState(() => new Animated.Value(1));
  const previousKey = useRef(valueKey);

  useEffect(() => {
    if (previousKey.current === valueKey) return;
    previousKey.current = valueKey;

    if (reducedMotion) {
      opacity.setValue(0.3);
      Animated.timing(opacity, {
        toValue: 1,
        duration: DURATIONS.cross,
        easing: EASE_IN_OUT,
        useNativeDriver: true,
      }).start();
      return;
    }

    scale.setValue(1.22);
    opacity.setValue(0.5);
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: DURATIONS.micro, easing: EASE_OUT, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: DURATIONS.micro, easing: EASE_OUT, useNativeDriver: true }),
    ]).start();
  }, [valueKey, reducedMotion, scale, opacity]);

  return <Animated.View style={{ opacity, transform: [{ scale }] }}>{children}</Animated.View>;
}
