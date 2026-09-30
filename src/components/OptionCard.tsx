import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, fontFamily, radius, spacing, typography } from '../theme';

type OptionCardProps = {
  label: string;
  // A second, quieter line under the label (e.g. what an abbreviation stands for).
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
};

// A full-width glass row for quiz-style single or multi-select questions: the label on the
// left, a round indicator on the right. No border; a selected card takes a faint accent wash.
// The glass is the translucent fill alone: a backdrop blur behind a clipped, rounded card
// leaves a faint lighter rim at its edge on web, which reads as an outline.
export function OptionCard({ label, sublabel, selected, onPress }: OptionCardProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={styles.card}
    >
      {selected ? <View style={[StyleSheet.absoluteFill, styles.tint]} /> : null}
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={[typography.bodyMedium, styles.label]}>{label}</Text>
          {sublabel ? <Text style={[typography.caption, styles.sublabel]}>{sublabel}</Text> : null}
        </View>
        <View style={[styles.indicator, selected && styles.indicatorSelected]}>
          {selected ? (
            <View>
              <Check color={colors.text.primary} size={14} strokeWidth={1.75} />
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  // Overflow clips the tint to the rounded corners.
  card: {
    overflow: 'hidden',
    borderRadius: radius.glass,
    backgroundColor: colors.surface.glass,
    padding: spacing.md,
  },
  tint: {
    backgroundColor: colors.surface.selectedTint,
    pointerEvents: 'none',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  label: {
    color: colors.text.primary,
  },
  // Figtree 400 at the caption size: the caption token itself is the medium weight.
  sublabel: {
    fontFamily: fontFamily.regular,
    color: colors.text.secondary,
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.indicator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSelected: {
    backgroundColor: colors.accent.primary,
  },
});
