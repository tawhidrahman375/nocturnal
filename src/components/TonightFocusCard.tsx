import { Target } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { useNow } from '../hooks/useNow';
import { focusFor, formatCountdown, msUntilFocusChanges } from '../lib/dailyFocus';
import { colors, spacing, typography } from '../theme';

type TonightFocusCardProps = {
  dreamSigns: string[];
};

// A single thing to practise today. It turns over by itself at 6am, with the app open or
// not, and the countdown says so: a reason to look back tomorrow that is not a notification.
export function TonightFocusCard({ dreamSigns }: TonightFocusCardProps) {
  const now = useNow(60_000);
  const focus = focusFor(now, dreamSigns);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.eyebrowRow}>
          <Target color={colors.accent.secondary} size={14} strokeWidth={1.75} />
          <Text style={[typography.overline, styles.eyebrow]}>Today&apos;s focus · {focus.kind}</Text>
        </View>
      </View>
      <Text style={[typography.heading, styles.title]}>{focus.title}</Text>
      <Text style={[typography.body, styles.body]}>{focus.body}</Text>
      <Text style={[typography.caption, styles.countdown]}>
        New focus in {formatCountdown(msUntilFocusChanges(now))}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  headerRow: {
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
  },
  title: {
    color: colors.text.primary,
  },
  body: {
    color: colors.text.secondary,
  },
  countdown: {
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});
