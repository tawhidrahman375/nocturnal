import { BlurView } from 'expo-blur';
import { ChevronDown, LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { SkeletonLines } from './SkeletonLines';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, EASE_OUT } from '../lib/motion';
import { colors, radius, spacing, typography } from '../theme';

type AccordionItemProps = {
  icon: LucideIcon;
  label: string;
  text: string;
  // Placeholder or fallback copy, shown in the secondary tone instead of primary.
  muted?: boolean;
  loading?: boolean;
};

// Splits at the first sentence end. The first sentence is the always-visible preview; the
// remainder is what a tap reveals, so the preview never repeats inside the expanded text.
function splitFirstSentence(text: string) {
  const match = text.match(/^[\s\S]*?[.!?](?=\s|$)/);
  if (!match) return { preview: text, rest: '' };
  return { preview: match[0], rest: text.slice(match[0].length).trim() };
}

// A collapsed-by-default glass row: header, one preview line, and the rest on tap.
// Chevron turns on the Micro token; the revealed text fades in on Reveal (opacity only).
// Under reduced motion both skip their animation and just switch state.
export function AccordionItem({ icon: Icon, label, text, muted, loading }: AccordionItemProps) {
  const reducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [chevron] = useState(() => new Animated.Value(0));
  const [reveal] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) {
      chevron.setValue(expanded ? 1 : 0);
      reveal.setValue(expanded ? 1 : 0);
      return;
    }
    const chevronAnimation = Animated.timing(chevron, {
      toValue: expanded ? 1 : 0,
      duration: DURATIONS.micro,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    chevronAnimation.start();
    // The revealed text unmounts on collapse, so it only ever needs to fade in.
    reveal.setValue(0);
    const revealAnimation = expanded
      ? Animated.timing(reveal, {
          toValue: 1,
          duration: DURATIONS.reveal,
          easing: EASE_OUT,
          useNativeDriver: true,
        })
      : null;
    revealAnimation?.start();
    return () => {
      chevronAnimation.stop();
      revealAnimation?.stop();
    };
  }, [expanded, reducedMotion, chevron, reveal]);

  const { preview, rest } = splitFirstSentence(text);
  const textStyle = [typography.body, muted ? styles.textMuted : styles.text];
  const rotate = chevron.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <AnimatedPressable
      onPress={() => setExpanded((value) => !value)}
      disabled={loading}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded, disabled: !!loading }}
      style={styles.container}
    >
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Icon color={colors.text.secondary} size={16} strokeWidth={1.5} />
        <Text style={[typography.overline, styles.label]}>{label}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown color={colors.text.secondary} size={18} strokeWidth={1.5} />
        </Animated.View>
      </View>
      {loading ? (
        <SkeletonLines lines={2} accessibilityLabel={`Loading ${label.toLowerCase()}`} />
      ) : (
        <>
          <Text style={textStyle} numberOfLines={expanded ? undefined : 1} ellipsizeMode="tail">
            {preview}
          </Text>
          {expanded && rest ? (
            <Animated.View style={{ opacity: reveal }}>
              <Text style={textStyle}>{rest}</Text>
            </Animated.View>
          ) : null}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  // Overflow clips the BlurView to the rounded corners. No border, per design.md.
  container: {
    overflow: 'hidden',
    borderRadius: radius.glass,
    backgroundColor: colors.surface.glass,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
  },
  text: {
    color: colors.text.primary,
  },
  textMuted: {
    color: colors.text.secondary,
  },
});
