import { Flame, LucideIcon, Moon, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Arrive } from './Arrive';
import { PopIn } from './PopIn';
import { MilestoneType } from '../hooks/useMilestoneCheck';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, EASE_OUT } from '../lib/motion';
import { colors, spacing, typography } from '../theme';

// Same warm gold TonightRoutineCard uses for "complete" — the app's one established
// celebration accent, reused here rather than inventing a second one.
const GOLD = '#E8B95C';
const AUTO_DISMISS_MS = 3000;
const PARTICLE_COUNT = 14;
const PARTICLE_COLORS = [GOLD, '#FFFFFF'];

const MILESTONE_CONTENT: Record<
  MilestoneType,
  { icon: LucideIcon; headline: string; subheadline: string; autoDismiss: boolean }
> = {
  firstLucidDream: {
    icon: Moon,
    headline: 'Your first lucid dream',
    subheadline: "You just proved it's possible. This is only the beginning.",
    autoDismiss: true,
  },
  streak7: {
    icon: Flame,
    headline: '7 nights in a row',
    subheadline: 'Your brain is already learning. Keep going.',
    autoDismiss: true,
  },
  firstInsight: {
    icon: Sparkles,
    headline: 'Your first insight',
    subheadline: 'Nocturnal just found something in your dreams. Tap to explore.',
    autoDismiss: false,
  },
};

type MilestoneOverlayProps = {
  milestone: MilestoneType | null;
  visible: boolean;
  onDismiss: () => void;
};

export function MilestoneOverlay({ milestone, visible, onDismiss }: MilestoneOverlayProps) {
  const reducedMotion = useReducedMotion();
  const [exitOpacity] = useState(() => new Animated.Value(1));
  const hasDismissedRef = useRef(false);

  const content = milestone ? MILESTONE_CONTENT[milestone] : null;

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

  useEffect(() => {
    if (!visible || !content) return;
    hasDismissedRef.current = false;
    exitOpacity.setValue(1);

    if (!content.autoDismiss) return;
    const timer = setTimeout(handleDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible, milestone, content, exitOpacity, handleDismiss]);

  if (!content) return null;
  const Icon = content.icon;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <Animated.View style={[styles.backdrop, { opacity: exitOpacity }]}>
        {/* Sibling dismiss layer, not a wrapper — see PrePermissionModal for why nesting
            a Pressable around the card can't reliably stop the backdrop from also firing. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        {/* Keyed on visible (not a counter) so it remounts — replaying Arrive's entrance
            and the confetti burst fresh — every time this flips false→true, including
            two consecutive milestones of the same type. */}
        <Arrive key={visible ? 'open' : 'closed'} style={styles.content}>
          <View style={styles.iconHalo}>
            <ConfettiBurst />
            <PopIn>
              <Icon color={GOLD} size={40} strokeWidth={1.75} />
            </PopIn>
          </View>
          <Text style={[typography.displayMd, styles.headline]}>{content.headline}</Text>
          <Text style={[typography.body, styles.subheadline]}>{content.subheadline}</Text>
        </Arrive>
      </Animated.View>
    </Modal>
  );
}

// A tasteful gold/white burst radiating from the icon, mounted fresh (via the parent's
// key) each time a milestone opens. Purely decorative, so it's the one thing skipped
// outright under reduced motion rather than degraded.
function ConfettiBurst() {
  const reducedMotion = useReducedMotion();
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      return {
        angle,
        distance: 60 + Math.random() * 40,
        size: 3 + Math.random() * 4,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      };
    })
  );
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
    // This component remounts (fresh Animated.Value) whenever a new milestone opens,
    // via the parent's key — reducedMotion is the only real dependency.
  }, [progress, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle, i) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(particle.angle) * particle.distance],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(particle.angle) * particle.distance],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.15, 0.7, 1],
          outputRange: [0, 1, 1, 0],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                marginLeft: -particle.size / 2,
                marginTop: -particle.size / 2,
                backgroundColor: particle.color,
                opacity,
                transform: [{ translateX }, { translateY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 12, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 320,
  },
  iconHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(232, 185, 92, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(232, 185, 92, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  particle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
  headline: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  subheadline: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
