import { PropsWithChildren, useEffect, useState } from 'react';
import { Animated, Easing, Platform, ViewStyle } from 'react-native';

type BreathingProps = PropsWithChildren<{
  minOpacity?: number;
  maxOpacity?: number;
  durationMs?: number;
  style?: ViewStyle;
}>;

export function Breathing({
  minOpacity = 0.45,
  maxOpacity = 1,
  durationMs = 4000,
  style,
  children,
}: BreathingProps) {
  const [opacity] = useState(() => new Animated.Value(minOpacity));

  useEffect(() => {
    const ease = Easing.inOut(Easing.sin);
    const useNativeDriver = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: maxOpacity, duration: durationMs, easing: ease, useNativeDriver }),
        Animated.timing(opacity, { toValue: minOpacity, duration: durationMs, easing: ease, useNativeDriver }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, minOpacity, maxOpacity, durationMs]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}
