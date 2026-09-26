import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Arrive } from './Arrive';
import { Breathing } from './Breathing';
import { CrossFade } from './CrossFade';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, EASE_OUT } from '../lib/motion';
import { colors, radius, spacing, typography } from '../theme';

// Same warm gold MilestoneOverlay/TonightRoutineCard use for a "the app noticed
// something" moment — reused rather than inventing a second celebration accent.
const GOLD = '#E8B95C';

const ANTICIPATION_MS = 1500;
// How long the plain reveal (chip + first line) holds before the afterglow (glow +
// second line) settles in — an unhurried beat, not a stated spec duration.
const STAGE_STAGGER_MS = 400;
const AFTERGLOW_MS = 2000;

type Phase = 'anticipation' | 'revealed';

type DreamSignRevealOverlayProps = {
  sign: string | null;
  visible: boolean;
  onDismiss: () => void;
};

export function DreamSignRevealOverlay({ sign, visible, onDismiss }: DreamSignRevealOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      {/* Keyed on the sign itself, not just `visible` — when a queue of several new
          signs is draining, `visible` stays true the whole time while `sign` advances
          to the next one, so the key has to change there too or the second reveal
          would inherit the first one's already-finished phase/opacity state instead of
          restarting its own anticipation → reveal → afterglow sequence. */}
      {sign ? <RevealSequence key={sign} sign={sign} onDismiss={onDismiss} /> : null}
    </Modal>
  );
}

function RevealSequence({ sign, onDismiss }: { sign: string; onDismiss: () => void }) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('anticipation');
  const [showAfterglow, setShowAfterglow] = useState(false);
  const [exitOpacity] = useState(() => new Animated.Value(1));
  const hasDismissedRef = useRef(false);

  const handleDismiss = useCallback(() => {
    if (hasDismissedRef.current) return;
    hasDismissedRef.current = true;
    if (reducedMotion) {
      onDismiss();
      return;
    }
    Animated.timing(exitOpacity, {
      toValue: 0,
      duration: DURATIONS.cross,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }, [reducedMotion, onDismiss, exitOpacity]);

  // Stage 1 -> 2: anticipation holds for 1.5s, then the orb dissolves into the reveal.
  useEffect(() => {
    const timer = setTimeout(() => setPhase('revealed'), ANTICIPATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // Stage 2 -> 3: a short unhurried beat after the chip appears, the glow and the
  // second line settle in together, marking the start of the afterglow.
  useEffect(() => {
    if (phase !== 'revealed') return;
    const timer = setTimeout(() => setShowAfterglow(true), STAGE_STAGGER_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // Stage 3: auto-dismiss 2s after the afterglow settles in.
  useEffect(() => {
    if (!showAfterglow) return;
    const timer = setTimeout(handleDismiss, AFTERGLOW_MS);
    return () => clearTimeout(timer);
  }, [showAfterglow, handleDismiss]);

  return (
    <Animated.View style={[styles.backdrop, { opacity: exitOpacity }]}>
      {/* Sibling dismiss layer, not a wrapper — see PrePermissionModal for why nesting a
          Pressable around the content can't reliably stop the backdrop from also firing. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
      <View style={styles.content} pointerEvents="none">
        <CrossFade contentKey={phase} style={styles.stage}>
          {phase === 'anticipation' ? (
            <View style={styles.anticipation}>
              <View style={styles.orbWrap}>
                <Breathing minOpacity={0.25} maxOpacity={0.55} durationMs={900} style={[styles.orbRing, styles.orbRingOuter]}>
                  <View />
                </Breathing>
                <Breathing
                  minOpacity={0.45}
                  maxOpacity={0.95}
                  durationMs={900}
                  delayMs={150}
                  style={[styles.orbRing, styles.orbRingInner]}
                >
                  <View />
                </Breathing>
              </View>
              <Text style={[typography.body, styles.anticipationText]}>Nocturnal found something...</Text>
            </View>
          ) : (
            <View style={styles.revealed}>
              <Arrive style={[styles.chip, showAfterglow && styles.chipGlow]}>
                <Text style={[typography.displayMd, styles.chipText]} numberOfLines={2}>
                  {sign}
                </Text>
              </Arrive>
              <Text style={[typography.body, styles.subtext]}>This keeps appearing in your dreams</Text>
              {showAfterglow ? (
                <Arrive style={styles.afterglowTextWrap}>
                  <Text style={[typography.label, styles.afterglowText]}>
                    Your reality checks will now include {sign}
                  </Text>
                </Arrive>
              ) : null}
            </View>
          )}
        </CrossFade>
      </View>
    </Animated.View>
  );
}

const ORB_SIZE = 88;
const ORB_INNER_SIZE = 56;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 12, 0.9)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  stage: {
    alignItems: 'center',
  },
  anticipation: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  orbWrap: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  orbRingOuter: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: colors.accent.primaryMuted,
    borderColor: colors.accent.primaryBorder,
  },
  orbRingInner: {
    width: ORB_INNER_SIZE,
    height: ORB_INNER_SIZE,
    borderRadius: ORB_INNER_SIZE / 2,
    backgroundColor: 'rgba(232, 185, 92, 0.22)',
    borderColor: 'rgba(232, 185, 92, 0.45)',
  },
  anticipationText: {
    color: colors.text.secondary,
  },
  revealed: {
    alignItems: 'center',
    gap: spacing.md,
    maxWidth: 320,
  },
  chip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primaryMuted,
    borderWidth: 1,
    borderColor: colors.accent.primaryBorder,
  },
  chipGlow: {
    borderColor: 'rgba(232, 185, 92, 0.5)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 22,
    elevation: 10,
  },
  chipText: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtext: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  afterglowTextWrap: {
    marginTop: spacing.xs,
  },
  afterglowText: {
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
