import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

type StatPillProps = {
  icon: LucideIcon;
  value: string | number;
  label: string;
  tint?: string;
};

// A capsule stat — icon and value ring-fenced in a pill, label sitting below it.
// Reads as one grouped stat rather than another square card stacked in a row.
export function StatPill({ icon: Icon, value, label, tint = colors.accent.primary }: StatPillProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.pill, { borderColor: tint }]}>
        <Icon color={tint} size={16} strokeWidth={1.75} />
        <Text style={[typography.bodyMedium, styles.value]}>{value}</Text>
      </View>
      <Text style={[typography.caption, styles.label]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    backgroundColor: colors.surface.card,
  },
  value: {
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: colors.text.secondary,
  },
});
