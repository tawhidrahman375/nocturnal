import { Check, Moon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { PopIn } from './PopIn';
import { ProgressRing } from './ProgressRing';
import { useTonightRoutine } from '../hooks/useTonightRoutine';
import { Dream } from '../hooks/useDreams';
import { colors, radius, spacing, typography } from '../theme';

type TonightRoutineCardProps = {
  dreams: Pick<Dream, 'created_at'>[];
  mildIntentionSetAt: string | null;
};

const STEP_LABELS = {
  realityCheck: 'Reality checks',
  journal: 'Journal entry',
  intention: 'Set intention',
  wbtb: 'WBTB alarm',
} as const;

export function TonightRoutineCard({ dreams, mildIntentionSetAt }: TonightRoutineCardProps) {
  const { steps, completedCount, isComplete } = useTonightRoutine(dreams, mildIntentionSetAt);

  const ring = (
    <View style={styles.ringWrap}>
      <ProgressRing size={72} strokeWidth={7} progress={completedCount / 4} color={colors.accent.primary}>
        <Text style={[typography.bodyMedium, styles.ringLabel, isComplete && styles.ringLabelComplete]}>
          {completedCount}/4
        </Text>
      </ProgressRing>
    </View>
  );

  return (
    <Card style={styles.card}>
      <Text style={[typography.label, styles.headline]}>Tonight&apos;s routine</Text>
      <View style={styles.body}>
        {isComplete ? <PopIn key="complete">{ring}</PopIn> : ring}
        <View style={styles.steps}>
          <StepRow label={STEP_LABELS.realityCheck} done={steps?.realityCheck ?? false} />
          <StepRow label={STEP_LABELS.journal} done={steps?.journal ?? false} />
          <StepRow label={STEP_LABELS.intention} done={steps?.intention ?? false} />
          <StepRow label={STEP_LABELS.wbtb} done={steps?.wbtb ?? false} />
        </View>
      </View>
    </Card>
  );
}

function StepRow({ label, done }: { label: string; done: boolean }) {
  const tint = done ? colors.text.primary : colors.text.tertiary;
  const Icon = done ? Check : Moon;
  return (
    <View style={styles.stepRow}>
      <Icon color={tint} size={14} strokeWidth={2} />
      <Text style={[typography.label, { color: tint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  headline: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  ringWrap: {
    borderRadius: radius.pill,
  },
  ringLabel: {
    color: colors.text.primary,
  },
  ringLabelComplete: {
    color: colors.accent.primary,
  },
  steps: {
    flex: 1,
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
