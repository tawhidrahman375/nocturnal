import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { RecallStrength } from '../lib/recallStrength';
import { colors, spacing, typography } from '../theme';

// Dream recall as something that is warm or cooling, never as a number that dropped.
// The tint stays in the app's calm blues and violets all the way down; there is no red.
export function RecallStrengthCard({ strength }: { strength: RecallStrength }) {
  const tint = strength.level === 'sharp' ? colors.status.lucid : strength.level === 'warm' ? colors.accent.primary : colors.accent.secondary;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Text style={[typography.label, styles.eyebrow]}>Dream recall</Text>
        <Text style={[typography.bodyMedium, { color: tint }]}>{strength.label}</Text>
      </View>
      <ProgressBar progress={strength.value} color={tint} trackColor={colors.surface.track} />
      <Text style={[typography.footnote, styles.hint]}>{strength.hint}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    color: colors.text.secondary,
  },
});
