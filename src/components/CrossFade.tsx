import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, EASE_IN_OUT } from '../lib/motion';

type CrossFadeProps = PropsWithChildren<{
  // Identifies which "branch" is currently shown. Swapping this triggers the
  // transition; re-rendering with the same key just updates the content in place.
  contentKey: string | number;
  // >0 switches to the stage-slide variant (DESIGN.md section 10): outgoing content
  // exits toward -slidePx while fading out, incoming enters from +slidePx while fading
  // in — reads as moving forward through steps. 0 (default) is a plain Cross crossfade
  // in place, for swapping one fact for another rather than advancing a sequence.
  slidePx?: number;
  style?: StyleProp<ViewStyle>;
}>;

// The Cross token (plus its stage-slide variant): crossfades between two states of the
// same slot instead of one instantly replacing the other.
export function CrossFade({ contentKey, slidePx = 0, style, children }: CrossFadeProps) {
  const reducedMotion = useReducedMotion();
  const [displayedKey, setDisplayedKey] = useState(contentKey);
  // The content shown *during* a transition (the outgoing branch, frozen mid-fade).
  // Once displayedKey catches up to contentKey, render uses `children` directly instead.
  const [displayedNode, setDisplayedNode] = useState<ReactNode>(children);
  const [opacity] = useState(() => new Animated.Value(1));
  const [translateX] = useState(() => new Animated.Value(0));
  const latestChildren = useRef(children);

  useEffect(() => {
    latestChildren.current = children;
  });

  useEffect(() => {
    if (contentKey === displayedKey) return;
    const slide = reducedMotion ? 0 : slidePx;
    const half = (slide > 0 ? DURATIONS.stage : DURATIONS.cross) / 2;

    const fadeOut = Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: half, easing: EASE_IN_OUT, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -slide, duration: half, easing: EASE_IN_OUT, useNativeDriver: true }),
    ]);

    fadeOut.start(() => {
      setDisplayedKey(contentKey);
      setDisplayedNode(latestChildren.current);
      translateX.setValue(slide);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: half, easing: EASE_IN_OUT, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: half, easing: EASE_IN_OUT, useNativeDriver: true }),
      ]).start();
    });
  }, [contentKey, displayedKey, reducedMotion, slidePx, opacity, translateX]);

  const content = contentKey === displayedKey ? children : displayedNode;

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateX }] }]}>
      {content}
    </Animated.View>
  );
}
