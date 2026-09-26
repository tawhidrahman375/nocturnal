import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
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

type Star = { x: number; y: number; size: number; opacity: number };

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
  return Array.from({ length: count }, () => ({
    x: random() * 100,
    y: random() * 100,
    size: 2 + random(),
    opacity: 0.3 + random() * 0.5,
  }));
}

function starCountForHeight(intensity: Intensity, height: number) {
  if (height <= 0) return MIN_STARS[intensity];
  const scaled = Math.round(height / PX_PER_STAR[intensity]);
  return Math.min(MAX_STARS[intensity], Math.max(MIN_STARS[intensity], scaled));
}

export function NightSky({ children, intensity = 'full', style, edgeFade = false }: NightSkyProps) {
  const [height, setHeight] = useState(0);
  const { start, end } = GRADIENT_SPAN[intensity];

  // Skips redundant state updates on sub-pixel layout noise so the star set (derived
  // from `height` below) doesn't regenerate every frame during animated entrances.
  const handleLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setHeight((prev) => (Math.abs(prev - nextHeight) > 1 ? nextHeight : prev));
  };

  const stars = useMemo(
    () => generateStars(starCountForHeight(intensity, height)),
    [intensity, height],
  );

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <LinearGradient
        colors={[colors.nightSky.deep, colors.nightSky.mid]}
        start={start}
        end={end}
        style={StyleSheet.absoluteFill}
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {stars.map((star, index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </View>
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
