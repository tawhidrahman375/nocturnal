import { PropsWithChildren, useId } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { spacing } from '../theme';

type ScreenContainerProps = PropsWithChildren<{
  style?: ViewStyle;
  edges?: Edge[];
  glow?: boolean;
}>;

// Near-black floor the radial bloom fades into — DESIGN.md section 1's "awake at 3am"
// atmosphere, not a flat fill, so it's only used as the SVG's outer gradient stop and
// the root's fallback color, never as a standalone background.
const FLOOR_COLOR = '#0A0B1A';

// DESIGN.md section 1: "content floats directly on a gradient/particle background."
// Section 6: depth comes from the background gradient alone, so a faint grain layer
// breaks up banding instead of any shadow/elevation. A pooled radial bloom behind the
// screen's heading, muted charcoal-navy at its core (not vivid purple), falling to
// FLOOR_COLOR by the lower third — not a uniform linear wash.
function Atmosphere() {
  // Ids must be unique per mounted screen, or web resolves every url() to the first one.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const glowId = `glow${uid}`;
  const grainId = `grain${uid}`;

  return (
    <Svg width="100%" height="100%" style={styles.atmosphere} pointerEvents="none">
      <Defs>
        <RadialGradient id={glowId} cx="50%" cy="22%" rx="90%" ry="46%">
          <Stop offset="0" stopColor="#2A3152" stopOpacity={1} />
          <Stop offset="0.5" stopColor="#161B30" stopOpacity={1} />
          <Stop offset="1" stopColor={FLOOR_COLOR} stopOpacity={1} />
        </RadialGradient>
        {/* A true per-pixel noise filter (feTurbulence) isn't reliably supported across
            RN's iOS/Android/web SVG renderers, so grain is faked with a tiled speckle
            pattern at very low opacity instead — enough to break gradient banding. */}
        <Pattern id={grainId} width={5} height={5} patternUnits="userSpaceOnUse">
          <Circle cx={1} cy={1.5} r={0.6} fill="#FFFFFF" />
          <Circle cx={3.5} cy={3.5} r={0.5} fill="#FFFFFF" />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${glowId})`} />
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${grainId})`} opacity={0.04} />
    </Svg>
  );
}

export function ScreenContainer({
  children,
  style,
  edges = ['top', 'bottom'],
  glow = true,
}: ScreenContainerProps) {
  return (
    <View style={styles.root}>
      {glow ? <Atmosphere /> : null}
      <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: FLOOR_COLOR,
  },
  atmosphere: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
});
