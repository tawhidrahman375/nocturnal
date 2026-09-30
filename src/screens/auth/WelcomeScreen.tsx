import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren, useEffect, useId, useState } from 'react';
import { Animated, AppState, StyleProp, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { Button } from '../../components/Button';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { EASE_OUT } from '../../lib/motion';
import { colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

// The sky is drawn in a 375x812 box pinned to the top of the screen, so the moon keeps its
// place in the upper 40% however tall the phone is.
const SKY_W = 375;
const SKY_H = 812;
const MOON = { cx: 187.5, cy: 190, r: 72 };
// A soft feathered rim just outside the moon's edge, so it reads as a glowing disc and not a
// hard cutout; the wide glow behind it is the faint moonlight spreading over the sky.
const RIM_R = 104;
const GLOW_R = 260;
// The stars below are placed around the moon, so they move with it.
const STARS_OFFSET_Y = 25;

// Faint craters, as offsets from the moon's centre: [dx, dy, radius]. Uneven and off-centre on
// purpose, just enough to break up the flat disc.
const CRATERS: readonly (readonly [number, number, number])[] = [
  [-22, -24, 13],
  [26, 14, 9],
  [-8, 35, 6],
];

// Hand-placed, not generated: [x, y, radius, opacity]. Static once in place — no twinkle, no drift.
const STARS: readonly (readonly [number, number, number, number])[] = [
  [48, 100, 1.8, 0.85],
  [118, 58, 1.2, 0.55],
  [236, 40, 1, 0.45],
  [296, 82, 1.4, 0.7],
  [338, 168, 2, 0.9],
  [30, 214, 1.2, 0.5],
  [86, 176, 1.5, 0.7],
  [284, 250, 1.2, 0.6],
];

// The hills are drawn in their own box pinned to the bottom, stretched to the screen's
// width. The same navy three times, each layer more opaque than the one behind it.
const HILLS_W = 375;
const HILLS_H = 290;
const HILLS: readonly { d: string; opacity: number }[] = [
  { d: 'M0,110 C60,60 130,70 200,100 C260,125 320,80 375,60 L375,290 L0,290 Z', opacity: 0.5 },
  { d: 'M0,170 C70,130 150,150 210,170 C280,195 330,150 375,140 L375,290 L0,290 Z', opacity: 0.78 },
  { d: 'M0,225 C80,195 160,215 240,232 C300,244 345,220 375,210 L375,290 L0,290 Z', opacity: 1 },
];

// The entrance: each layer rises into place from below, the far ones slowly and the near ones
// faster, as if the camera is pulling back. Plain ease-out throughout — no spring, no bounce.
// The sky gradient itself doesn't move. Distances are px, durations and delays ms.
const RISE = {
  hills: { distance: 40, duration: 900, delay: 0 },
  // Stars all start from here, then each waits STAR_STAGGER longer than the one before it.
  star: { distance: 20, duration: 700, delay: 0 },
  moon: { distance: 30, duration: 800, delay: 0 },
  text: { distance: 24, duration: 500, delay: 300 },
  actions: { distance: 16, duration: 400, delay: 500 },
} as const;
const STAR_STAGGER = 100;
const MOON_SCALE_FROM = 0.92;
// The timeline is clock-based, so it must not begin until someone can actually see the start
// state. Two things get in the way: mounting 12 SVG layers takes long enough that, started at
// mount, the early part of the rise could play before the first paint; and a screen mounted
// while the app is backgrounded or the page hidden (a background browser tab, the launch
// splash still covering the window) runs its whole timeline unseen. So the entrance waits
// for the app to be active, then holds a short lead-in (a timer, not requestAnimationFrame,
// which never fires in a hidden page).
const ENTRANCE_LEAD_IN_MS = 150;

// True once the app is active and the lead-in has elapsed; flips once and stays true.
function useEntranceStarted() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const begin = () => {
      if (timer === undefined) timer = setTimeout(() => setStarted(true), ENTRANCE_LEAD_IN_MS);
    };
    if (AppState.currentState === 'active') begin();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') begin();
    });
    return () => {
      subscription.remove();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);

  return started;
}

type RiseProps = PropsWithChildren<{
  // Holds the layer at its start state (hidden, offset) until true.
  started: boolean;
  distance: number;
  duration: number;
  delay?: number;
  // Start this much smaller and grow to full size about `transformOrigin`.
  scaleFrom?: number;
  transformOrigin?: (string | number)[];
  style?: StyleProp<ViewStyle>;
}>;

// Fade + rise on mount. Under reduced motion there is no movement and no fade: the layer is
// simply there at full opacity.
function Rise({ started, distance, duration, delay = 0, scaleFrom, transformOrigin, style, children }: RiseProps) {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    if (!started) return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, duration, delay, reducedMotion, distance, started]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  const transform =
    scaleFrom === undefined
      ? [{ translateY }]
      : [{ translateY }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [scaleFrom, 1] }) }];

  return (
    <Animated.View style={[style, { opacity: progress, transform, transformOrigin }]}>{children}</Animated.View>
  );
}

// Every sky layer is its own full-screen SVG in the same 375x812 box, so they still line up
// exactly while moving independently.
function SkyLayer({ children }: PropsWithChildren) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${SKY_W} ${SKY_H}`}
      preserveAspectRatio="xMidYMin slice"
      style={StyleSheet.absoluteFill}
    >
      {children}
    </Svg>
  );
}

// Built inline on purpose: this screen has its own background rather than NightSky. A
// vertical navy gradient, a soft full moon with a faint halo, a few stars, and layered hill
// silhouettes. SVG (not a shadowed View) so the glow renders the same on web, iOS, Android.
function MoonlitBackground({ started }: { started: boolean }) {
  const { width, height } = useWindowDimensions();
  // "slice" scales the 375x812 sky to cover the screen; the moon's y follows that scale.
  const skyScale = Math.max(width / SKY_W, height / SKY_H);
  // Gradient ids must be unique per mounted screen, or web resolves every url() to the first.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const glowId = `moonGlow${uid}`;
  const rimId = `moonRim${uid}`;
  const discId = `moonDisc${uid}`;

  return (
    <>
      <LinearGradient
        colors={[colors.moonlit.skyTop, colors.moonlit.skyBottom]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {STARS.map(([x, y, r, opacity], index) => (
        <Rise
          key={`${x}-${y}`}
          started={started}
          {...RISE.star}
          delay={RISE.star.delay + index * STAR_STAGGER}
          style={styles.layer}
        >
          <SkyLayer>
            <Circle cx={x} cy={y + STARS_OFFSET_Y} r={r} fill={colors.moonlit.moon} opacity={opacity} />
          </SkyLayer>
        </Rise>
      ))}
      <Rise
        started={started}
        {...RISE.moon}
        scaleFrom={MOON_SCALE_FROM}
        // Grows about the moon's own centre, not the screen's.
        transformOrigin={['50%', MOON.cy * skyScale]}
        style={styles.layer}
      >
        <SkyLayer>
          <Defs>
            <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.moonlit.moon} stopOpacity={0.08} />
              <Stop offset="0.3" stopColor={colors.moonlit.moon} stopOpacity={0.06} />
              <Stop offset="1" stopColor={colors.moonlit.moon} stopOpacity={0} />
            </RadialGradient>
            {/* Fully opaque out to the moon's edge (72 of 104), then fading to nothing. */}
            <RadialGradient id={rimId} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.moonlit.moonEdge} stopOpacity={0.2} />
              <Stop offset="0.69" stopColor={colors.moonlit.moonEdge} stopOpacity={0.2} />
              <Stop offset="1" stopColor={colors.moonlit.moonEdge} stopOpacity={0} />
            </RadialGradient>
            {/* Lit from the upper left: a near-white core, barely warm, falling to a cool grey-blue edge. */}
            <RadialGradient id={discId} cx="50%" cy="50%" r="50%" fx="40%" fy="36%">
              <Stop offset="0" stopColor={colors.moonlit.moonCore} />
              <Stop offset="1" stopColor={colors.moonlit.moonEdge} />
            </RadialGradient>
          </Defs>
          <Circle cx={MOON.cx} cy={MOON.cy} r={GLOW_R} fill={`url(#${glowId})`} />
          <Circle cx={MOON.cx} cy={MOON.cy} r={RIM_R} fill={`url(#${rimId})`} />
          <Circle cx={MOON.cx} cy={MOON.cy} r={MOON.r} fill={`url(#${discId})`} opacity={0.94} />
          {CRATERS.map(([dx, dy, r]) => (
            <Circle key={`${dx}-${dy}`} cx={MOON.cx + dx} cy={MOON.cy + dy} r={r} fill={colors.moonlit.moonCrater} />
          ))}
        </SkyLayer>
      </Rise>
      <Rise started={started} {...RISE.hills} style={styles.hills}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${HILLS_W} ${HILLS_H}`} preserveAspectRatio="none">
          {HILLS.map(({ d, opacity }) => (
            <Path key={d} d={d} fill={colors.moonlit.hill} opacity={opacity} />
          ))}
        </Svg>
      </Rise>
    </>
  );
}

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const started = useEntranceStarted();

  return (
    <View style={styles.root}>
      <MoonlitBackground started={started} />
      <View
        style={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xl },
        ]}
      >
        {/* Reserves the top of the screen for the moon drawn behind it. */}
        <View style={styles.moonSpace} />

        <Rise started={started} {...RISE.text} style={styles.hero}>
          <Text style={[typography.heroTitle, styles.title]}>Nocturnal</Text>
          <Text style={[typography.body, styles.tagline]}>Control Your Dreams.</Text>
        </Rise>

        <Rise started={started} {...RISE.actions} style={styles.actions}>
          <Button
            label="Sign in"
            labelColor={colors.text.primary}
            onPress={() => navigation.navigate('SignIn')}
            style={styles.button}
          />
          <Button
            label="Create account"
            variant="secondary"
            onPress={() => navigation.navigate('Preview')}
            style={styles.button}
          />
        </Rise>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.moonlit.skyBottom,
  },
  // A full-screen layer that never catches touches, so the buttons above stay tappable.
  layer: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
  hills: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HILLS_H,
    pointerEvents: 'none',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  moonSpace: {
    height: '34%',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    // Centred in the space between the moon and the buttons.
    justifyContent: 'center',
    // Gap between the title and the tagline.
    gap: spacing.sm,
    // Sits the block a little below centre, closer to the buttons than to the moon.
    paddingTop: spacing.xxl,
  },
  title: {
    color: colors.moonlit.moon,
    textAlign: 'center',
  },
  tagline: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm + spacing.xs,
  },
  button: {
    alignSelf: 'stretch',
  },
});
