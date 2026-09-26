import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, radius, spacing, typography } from '../theme';

type OptionCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

// A full-width tappable row, not a chip or a dropdown, for quiz-style single or
// multi-select questions with longer option text.
export function OptionCard({ label, selected, onPress }: OptionCardProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <Text style={[typography.bodyMedium, styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
      <View style={[styles.indicator, selected && styles.indicatorSelected]}>
        {selected ? <Check color={colors.text.onAccent} size={14} strokeWidth={2.5} /> : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
  },
  cardSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryMuted,
  },
  label: {
    flex: 1,
    color: colors.text.secondary,
    marginRight: spacing.md,
  },
  labelSelected: {
    color: colors.text.primary,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
});
