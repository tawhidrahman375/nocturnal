import { PropsWithChildren, useEffect, useState } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ARRIVE_SLIDE_PX, DURATIONS, EASE_OUT, NOTICE_SLIDE_PX } from '../lib/motion';

type ArriveProps = PropsWithChildren<{
  // Stagger offset in ms for a row/list of Arrive-wrapped siblings. Ignored (treated as
  // 0) under reduced motion — see DESIGN.md section 10.
  delay?: number;
  // 'up' (default): the standard Arrive token — slides up ARRIVE_SLIDE_PX over
  // DURATIONS.arrive. 'down': the smaller notice variant for errors/inline banners —
  // slides down NOTICE_SLIDE_PX over DURATIONS.notice. Same token, sized for context.
  from?: 'up' | 'down';
  style?: StyleProp<ViewStyle>;
}>;

// The Arrive token: fade + slide on mount. Under reduced motion, degrades to Cross
// (opacity only, no slide, no stagger) rather than skipping the transition entirely —
// a component should never just pop in with zero transition.
export function Arrive({ delay = 0, from = 'up', style, children }: ArriveProps) {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const duration = from === 'down' ? DURATIONS.notice : DURATIONS.arrive;
  const distance = from === 'down' ? -NOTICE_SLIDE_PX : ARRIVE_SLIDE_PX;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reducedMotion ? DURATIONS.cross : duration,
      delay: reducedMotion ? 0 : delay,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, reducedMotion, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: reducedMotion
            ? []
            : [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [distance, 0],
                  }),
                },
              ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
