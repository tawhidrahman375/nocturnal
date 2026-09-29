import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, EASE_AMBIENT } from '../lib/motion';
import { spacing } from '../theme';

// Widths of the placeholder lines, as a share of the container: full, near-full, then a
// short tail, so it reads as a paragraph that has not arrived yet.
const LINE_WIDTHS = ['100%', '92%', '58%'] as const;

type SkeletonLinesProps = {
  accessibilityLabel?: string;
};

// A loading placeholder for a short block of text. Pulses on the reveal duration with the
// ambient curve (the closest motion tokens to a slow breathe); under reduced motion the
// bars sit still at a fixed opacity instead.
export function SkeletonLines({ accessibilityLabel = 'Loading' }: SkeletonLinesProps) {
  const reducedMotion = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) {
      pulse.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: DURATIONS.reveal, easing: EASE_AMBIENT, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: DURATIONS.reveal, easing: EASE_AMBIENT, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, reducedMotion]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} style={styles.wrap}>
      {LINE_WIDTHS.map((width) => (
        <Animated.View key={width} style={[styles.line, { width, opacity }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
