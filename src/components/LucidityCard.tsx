import { Compass } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { LucidityProgress } from '../lib/lucidity';
import { colors, spacing, typography } from '../theme';

// The deeper loop: how close the user's practice has taken them to a lucid dream. It is
// built from rolling windows, so it can rise or settle back, and it always ends in the one
// thing that would move it most.
export function LucidityCard({ progress }: { progress: LucidityProgress }) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.eyebrowRow}>
          <Compass color={colors.accent.primary} size={14} strokeWidth={1.75} />
          <Text style={[typography.label, styles.eyebrow]}>Path to lucidity</Text>
        </View>
        <Text style={[typography.bodyMedium, styles.stage]}>{progress.stage}</Text>
      </View>
      <ProgressBar progress={progress.value} color={colors.accent.primary} trackColor={colors.surface.track} />
      <Text style={[typography.footnote, styles.next]}>{progress.nextStep}</Text>
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
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stage: {
    color: colors.text.primary,
  },
  next: {
    color: colors.text.secondary,
  },
});
