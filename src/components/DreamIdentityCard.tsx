import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { DreamIdentity } from '../lib/dreamIdentity';
import { colors, spacing, typography } from '../theme';

// The name Nocturnal has given the way this person dreams. It is the first thing on Profile
// because it is the one thing there worth saying out loud to someone else.
export function DreamIdentityCard({ identity }: { identity: DreamIdentity }) {
  return (
    <Card style={styles.card} elevated>
      <Text style={[typography.overline, styles.eyebrow]}>Your dream type</Text>
      <Text style={[typography.displayMd, styles.label]}>{identity.label}</Text>
      <Text style={[typography.body, styles.tagline]}>{identity.tagline}</Text>
      <View style={styles.nextRow}>
        <Text style={[typography.footnote, styles.next]}>{identity.next}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
  },
  eyebrow: {
    color: colors.text.tertiary,
  },
  label: {
    color: colors.text.primary,
  },
  tagline: {
    color: colors.text.secondary,
  },
  nextRow: {
    marginTop: spacing.sm,
  },
  next: {
    color: colors.text.tertiary,
  },
});
