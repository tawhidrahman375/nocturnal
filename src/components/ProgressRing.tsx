import { PropsWithChildren, useEffect, useState } from 'react';
import { Animated, EasingFunction, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, EASE_OUT } from '../lib/motion';
import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ProgressRingProps = PropsWithChildren<{
  size: number;
  strokeWidth: number;
  progress: number;
  color?: string;
  // Reveal (650ms ease-out) is the default — a caller with a continuously-updating
  // progress (a live countdown) passes a shorter linear duration instead so each tick
  // sweeps smoothly rather than re-easing every time. See WakeWindowStage.
  durationMs?: number;
  easing?: EasingFunction;
}>;

// The Reveal token: fills from 0 to `progress` instead of snapping to it. Skipped
// entirely under reduced motion (DESIGN.md section 10) — the ring just jumps straight
// to the target value.
export function ProgressRing({
  size,
  strokeWidth,
  progress,
  color = colors.accent.primary,
  durationMs = DURATIONS.reveal,
  easing = EASE_OUT,
  children,
}: ProgressRingProps) {
  const reducedMotion = useReducedMotion();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  const [animatedProgress] = useState(() => new Animated.Value(reducedMotion ? clamped : 0));

  useEffect(() => {
    if (reducedMotion) {
      animatedProgress.setValue(clamped);
      return;
    }
    const animation = Animated.timing(animatedProgress, {
      toValue: clamped,
      duration: durationMs,
      easing,
      // strokeDashoffset isn't supported by the native driver.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, animatedProgress, reducedMotion, durationMs, easing]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={[StyleSheet.absoluteFill, styles.rotated]}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.border.default}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
        />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  rotated: {
    transform: [{ rotate: '-90deg' }],
  },
  content: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
