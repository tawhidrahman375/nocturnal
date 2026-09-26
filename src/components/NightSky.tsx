import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, EASE_AMBIENT } from '../lib/motion';
import { colors } from '../theme';

type Intensity = 'subtle' | 'full';

type NightSkyProps = PropsWithChildren<{
  intensity?: Intensity;
  style?: ViewStyle;
  // For a content-sized usage (no `style` height override) that ends abruptly above a
  // differently-colored sibling — e.g. Profile's hero block sitting directly on Panel —
  // this feathers the bottom edge toward background.primary instead of a hard cut.
  edgeFade?: boolean;
}>;

type Star = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  phaseOffset: number;
  twinkleAnim: Animated.Value | null;
};

const EDGE_FADE_HEIGHT = 48;

// Star count scales with the container's own measured height (DESIGN.md §8: density
// should scale with screen area, not be fixed-count) so a short header panel and a
// full scrollable screen both read as intentionally scattered rather than the taller
// one thinning out toward the bottom. MIN keeps a very short usage from looking bare
// before the first layout measurement lands; MAX caps density on very long screens.
const MIN_STARS: Record<Intensity, number> = {
  full: 15,
  subtle: 8,
};
const MAX_STARS: Record<Intensity, number> = {
  full: 90,
  subtle: 40,
};
const PX_PER_STAR: Record<Intensity, number> = {
  full: 45,
  subtle: 90,
};

// Ambient background motion. Drift and twinkle reuse DESIGN.md §10's Ambient token
// (EASE_AMBIENT, DURATIONS.ambient) since a twinkle is that same slow opacity loop
// applied per-star; drift and gradient breathing are new (documented in DESIGN.md
// alongside Ambient, since neither existed before this component).
const DRIFT_SPEED_PX_PER_SEC = 14;
// Fraction of stars that twinkle, capped in absolute count so a dense `full` screen
// doesn't end up running dozens of independent JS-thread animations at once.
const TWINKLE_RATIO = 0.25;
const TWINKLE_MAX = 15;
// A twinkling star dims to this fraction of its own base opacity, not a shared
// absolute floor — keeps a dim star dim and a bright star bright between pulses.
const TWINKLE_FLOOR_RATIO = 0.35;
// Gradient breathing is much slower than a twinkle (barely-perceptible color drift,
// not a pulse) and only runs for `full` — subtle's tighter, smaller-panel gradient
// doesn't have the room for the shift to read as anything but noise. Runs on the JS
// thread (color interpolation isn't native-driver eligible) but is throttled to ~7fps
// since a 24s cycle doesn't need 60fps to look smooth — see perf note in the PR.
const BREATH_HALF_MS = 12000;
const BREATH_UPDATE_INTERVAL_MS = 150;
const BREATH_DEEP_ALT = '#12103E';
const BREATH_MID_ALT = '#241C63';

// LinearGradient takes start/end points (0-1) rather than a CSS-style angle. A
// corner-to-corner span reads as a ~135deg diagonal; pulling both points toward the
// center (subtle) shortens that span so the transition band is tighter and the ends
// sit closer to flat color, appropriate for a smaller panel rather than a hero.
const GRADIENT_SPAN: Record<Intensity, { start: { x: number; y: number }; end: { x: number; y: number } }> = {
  full: { start: { x: 0.1, y: 0 }, end: { x: 0.9, y: 1 } },
  subtle: { start: { x: 0.3, y: 0.2 }, end: { x: 0.7, y: 0.8 } },
};

// Deterministic PRNG (mulberry32) so the star scatter is fixed across re-renders and
// remounts instead of reshuffling every time from Math.random().
function seededRandom(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function generateStars(count: number): Star[] {
  const random = seededRandom(1337);
  let twinkleCount = 0;
  return Array.from({ length: count }, () => {
    const x = random() * 100;
    const y = random() * 100;
    const size = 2 + random();
    const opacity = 0.3 + random() * 0.5;
    const twinkleRoll = random();
    const phaseRoll = random();
    const isTwinkle = twinkleRoll < TWINKLE_RATIO && twinkleCount < TWINKLE_MAX;
    if (isTwinkle) twinkleCount += 1;
    return {
      x,
      y,
      size,
      opacity,
      // Spread across a full twinkle cycle so stars pulse out of phase with each
      // other — synchronized pulsing would read as strobing, not twinkling.
      phaseOffset: phaseRoll * DURATIONS.ambient * 2,
      twinkleAnim: isTwinkle ? new Animated.Value(opacity) : null,
    };
  });
}

function starCountForHeight(intensity: Intensity, height: number) {
  if (height <= 0) return MIN_STARS[intensity];
  const scaled = Math.round(height / PX_PER_STAR[intensity]);
  return Math.min(MAX_STARS[intensity], Math.max(MIN_STARS[intensity], scaled));
}

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function mixColor(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bChannel = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bChannel})`;
}

function StarDots({ stars }: { stars: Star[] }) {
  return (
    <>
      {stars.map((star, index) => (
        <Animated.View
          key={index}
          style={[
            styles.star,
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.twinkleAnim ?? star.opacity,
            },
          ]}
        />
      ))}
    </>
  );
}

export function NightSky({ children, intensity = 'full', style, edgeFade = false }: NightSkyProps) {
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { start, end } = GRADIENT_SPAN[intensity];

  // Skips redundant state updates on sub-pixel layout noise so the star set (derived
  // from `size.height` below) doesn't regenerate every frame during animated entrances.
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
    setSize((prev) =>
      Math.abs(prev.width - nextWidth) > 1 || Math.abs(prev.height - nextHeight) > 1
        ? { width: nextWidth, height: nextHeight }
        : prev,
    );
  };

  const stars = useMemo(
    () => generateStars(starCountForHeight(intensity, size.height)),
    [intensity, size.height],
  );

  const [driftX] = useState(() => new Animated.Value(0));
  const showDrift = size.width > 0 && !reducedMotion;

  // Star drift (requirement 1): the star field is rendered twice, side by side, and
  // this animates both copies together from x=0 to x=-width on an exact loop — when it
  // wraps, the second copy is sitting exactly where the first one started, so the reset
  // is invisible. useNativeDriver mirrors Breathing.tsx's own web/native split.
  useEffect(() => {
    if (!showDrift) {
      driftX.setValue(0);
      return;
    }
    const useNativeDriver = Platform.OS !== 'web';
    driftX.setValue(0);
    const loop = Animated.loop(
      Animated.timing(driftX, {
        toValue: -size.width,
        duration: (size.width / DRIFT_SPEED_PX_PER_SEC) * 1000,
        easing: Easing.linear,
        useNativeDriver,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [driftX, showDrift, size.width]);

  // Twinkle (requirement 2): each twinkling star gets its own delayed, looping
  // opacity animation between its own base opacity and a dimmer floor, using the same
  // token as every other Ambient effect in the app (EASE_AMBIENT, DURATIONS.ambient).
  useEffect(() => {
    if (reducedMotion) {
      stars.forEach((star) => star.twinkleAnim?.setValue(star.opacity));
      return;
    }
    const useNativeDriver = Platform.OS !== 'web';
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const loops: Animated.CompositeAnimation[] = [];
    stars.forEach((star) => {
      if (!star.twinkleAnim) return;
      const floor = star.opacity * TWINKLE_FLOOR_RATIO;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(star.twinkleAnim, {
            toValue: floor,
            duration: DURATIONS.ambient,
            easing: EASE_AMBIENT,
            useNativeDriver,
          }),
          Animated.timing(star.twinkleAnim, {
            toValue: star.opacity,
            duration: DURATIONS.ambient,
            easing: EASE_AMBIENT,
            useNativeDriver,
          }),
        ]),
      );
      // A one-time delay before the loop starts, not inside it — Animated.loop would
      // otherwise replay the delay every cycle instead of just staggering the start.
      timeouts.push(setTimeout(() => loop.start(), star.phaseOffset));
      loops.push(loop);
    });
    return () => {
      timeouts.forEach(clearTimeout);
      loops.forEach((loop) => loop.stop());
    };
  }, [stars, reducedMotion]);

  // Gradient breathing (requirement 3): color interpolation isn't native-driver
  // eligible, so this runs on the JS thread — throttled to ~7fps via a manual listener
  // instead of driving a React re-render on every animation tick, since a 24s cycle is
  // slow enough that the eye can't tell the difference from 60fps.
  const [breathe] = useState(() => new Animated.Value(0));
  const [breatheT, setBreatheT] = useState(0);
  useEffect(() => {
    if (reducedMotion || intensity !== 'full') return;
    let lastUpdate = 0;
    const id = breathe.addListener(({ value }) => {
      const now = Date.now();
      if (now - lastUpdate > BREATH_UPDATE_INTERVAL_MS) {
        lastUpdate = now;
        setBreatheT(value);
      }
    });
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: BREATH_HALF_MS, easing: EASE_AMBIENT, useNativeDriver: false }),
        Animated.timing(breathe, { toValue: 0, duration: BREATH_HALF_MS, easing: EASE_AMBIENT, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => {
      breathe.removeListener(id);
      loop.stop();
    };
  }, [breathe, intensity, reducedMotion]);

  // Derived rather than reset via setState in the effect above — 'subtle' and reduced
  // motion should always compute from the base colors, not whatever breatheT was last
  // set to before intensity/reducedMotion changed.
  const breathing = intensity === 'full' && !reducedMotion;
  const gradientDeep = breathing ? mixColor(colors.nightSky.deep, BREATH_DEEP_ALT, breatheT) : colors.nightSky.deep;
  const gradientMid = breathing ? mixColor(colors.nightSky.mid, BREATH_MID_ALT, breatheT) : colors.nightSky.mid;

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <LinearGradient colors={[gradientDeep, gradientMid]} start={start} end={end} style={StyleSheet.absoluteFill} />
      {showDrift ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.driftLayer,
            { width: size.width * 2, height: size.height, transform: [{ translateX: driftX }] },
          ]}
        >
          <View style={{ width: size.width, height: size.height }}>
            <StarDots stars={stars} />
          </View>
          <View style={{ width: size.width, height: size.height }}>
            <StarDots stars={stars} />
          </View>
        </Animated.View>
      ) : (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <StarDots stars={stars} />
        </View>
      )}
      <View style={styles.content}>{children}</View>
      {edgeFade ? (
        <LinearGradient
          pointerEvents="none"
          colors={['transparent', colors.background.primary]}
          style={styles.edgeFade}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  driftLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
  },
  star: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  // flex: 1 so a caller-provided `style={{ flex: 1 }}` on the container (a full-screen
  // usage) reaches children that themselves need to stretch/center in the available
  // height (e.g. Journal's empty state). The gradient/star layers don't depend on this
  // — they're absolute siblings sized to `container` directly — so a header-only usage
  // with no `style` override is unaffected; content just hugs its natural size as before.
  content: {
    flex: 1,
  },
  edgeFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: EDGE_FADE_HEIGHT,
  },
});
