import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

type ChipGroupProps<T extends number> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format: (value: T) => string;
};

export function ChipGroup<T extends number>({ options, value, onChange, format }: ChipGroupProps<T>) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[typography.bodyMedium, selected ? styles.labelSelected : styles.label]}>
              {format(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: 'rgba(108, 142, 255, 0.14)',
  },
  label: {
    color: colors.text.secondary,
  },
  labelSelected: {
    color: colors.text.primary,
  },
});
