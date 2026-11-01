import { useEffect, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, EASE_OUT } from '../lib/motion';

type ProgressBarProps = {
  progress: number;
  color: string;
  trackColor: string;
  height?: number;
};

// The Reveal token for a linear fill: slides in from 0 to `progress` instead of snapping
// to it. The fill is always the track's full width and slides in from the left, clipped by
// the track, so only a transform animates (native-driven) and the rounded end never
// squashes. The track measures its own pixel width via onLayout to know the slide
// distance. Skipped under reduced motion (DESIGN.md section 10).
export function ProgressBar({ progress, color, trackColor, height = 8 }: ProgressBarProps) {
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const clamped = Math.min(1, Math.max(0, progress));
  const [animatedProgress] = useState(() => new Animated.Value(reducedMotion ? clamped : 0));

  useEffect(() => {
    if (reducedMotion) {
      animatedProgress.setValue(clamped);
      return;
    }
    const animation = Animated.timing(animatedProgress, {
      toValue: clamped,
      duration: DURATIONS.reveal,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, animatedProgress, reducedMotion]);

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}
      onLayout={handleTrackLayout}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: color,
            width: trackWidth,
            transform: [
              { translateX: animatedProgress.interpolate({ inputRange: [0, 1], outputRange: [-trackWidth, 0] }) },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
