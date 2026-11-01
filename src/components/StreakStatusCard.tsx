import { Flame, Snowflake, Sprout, Pause } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { StreakStatus, StreakStatusKind } from '../lib/streakStatus';
import { colors, spacing, typography } from '../theme';

const ICONS = {
  new: Sprout,
  active: Flame,
  atRisk: Flame,
  frozen: Snowflake,
  broken: Sprout,
  paused: Pause,
} as const;

const TINTS: Record<StreakStatusKind, string> = {
  new: colors.accent.primary,
  active: colors.status.lucid,
  atRisk: colors.accent.primary,
  frozen: colors.accent.primary,
  broken: colors.accent.secondary,
  paused: colors.text.secondary,
};

type StreakStatusCardProps = {
  status: StreakStatus;
  onResume?: () => void;
};

// What the streak means today, in words. A broken streak is shown as a fresh start, a
// freeze as a kindness, a pause as rest, and only a live streak as a count.
export function StreakStatusCard({ status, onResume }: StreakStatusCardProps) {
  const Icon = ICONS[status.kind];
  const tint = TINTS[status.kind];

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Icon color={tint} size={20} strokeWidth={1.5} />
        <View style={styles.copy}>
          <Text style={[typography.bodyMedium, styles.title]}>{status.title}</Text>
          <Text style={[typography.footnote, styles.body]}>{status.body}</Text>
        </View>
      </View>
      {status.kind === 'paused' && onResume ? (
        <Button label="Resume now" variant="secondary" size="sm" onPress={onResume} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + spacing.xs,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text.primary,
  },
  body: {
    color: colors.text.secondary,
  },
});
