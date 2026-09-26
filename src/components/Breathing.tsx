import { PropsWithChildren, useEffect, useState } from 'react';
import { Animated, Platform, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { EASE_AMBIENT } from '../lib/motion';

type BreathingProps = PropsWithChildren<{
  minOpacity?: number;
  maxOpacity?: number;
  durationMs?: number;
  // Delays the first cycle's start, so multiple Breathing instances (e.g. WildStage's
  // drifting halos) don't pulse in visible unison.
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
}>;

// The Ambient token's primitive (DESIGN.md section 10): a slow opacity loop with no
// start/end, for atmospheric touches (AlarmStage's clock halo, WildStage's drift) and
// the mantra pulses in MildStage/ClosedStage.
export function Breathing({
  minOpacity = 0.45,
  maxOpacity = 1,
  durationMs = 4000,
  delayMs = 0,
  style,
  children,
}: BreathingProps) {
  const reducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(reducedMotion ? maxOpacity : minOpacity));

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(maxOpacity);
      return;
    }
    const useNativeDriver = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: maxOpacity, duration: durationMs, easing: EASE_AMBIENT, useNativeDriver }),
        Animated.timing(opacity, { toValue: minOpacity, duration: durationMs, easing: EASE_AMBIENT, useNativeDriver }),
      ])
    );
    const start = setTimeout(() => loop.start(), delayMs);
    return () => {
      clearTimeout(start);
      loop.stop();
    };
  }, [opacity, minOpacity, maxOpacity, durationMs, delayMs, reducedMotion]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}
