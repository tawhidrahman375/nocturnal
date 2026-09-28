import { useNavigation } from '@react-navigation/native';
import { Check, Moon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { Card } from './Card';
import { CountBump } from './CountBump';
import { CrossFade } from './CrossFade';
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
  const navigation = useNavigation();
  const { steps, completedCount, isComplete } = useTonightRoutine(dreams, mildIntentionSetAt);

  const ring = (
    <View style={styles.ringWrap}>
      <ProgressRing
        size={72}
        strokeWidth={10}
        trackColor={colors.border.subtle}
        progress={completedCount / 4}
        color={isComplete ? colors.status.lucid : colors.accent.primary}
      >
        <CountBump valueKey={completedCount}>
          <Text style={[typography.bodyMedium, styles.ringLabel, isComplete && styles.ringLabelComplete]}>
            {completedCount}/4
          </Text>
        </CountBump>
      </ProgressRing>
    </View>
  );

  return (
    <Card style={styles.card}>
      <Text style={[typography.label, styles.headline]}>Tonight&apos;s routine</Text>
      <View style={styles.body}>
        {isComplete ? <PopIn key="complete">{ring}</PopIn> : ring}
        <View style={styles.steps}>
          <StepRow label={STEP_LABELS.realityCheck} done={steps?.realityCheck ?? false} complete={isComplete} />
          <StepRow label={STEP_LABELS.journal} done={steps?.journal ?? false} complete={isComplete} />
          <StepRow
            label={STEP_LABELS.intention}
            done={steps?.intention ?? false}
            complete={isComplete}
            onPress={steps?.intention ? undefined : () => navigation.navigate('MildPrompt')}
          />
          <StepRow label={STEP_LABELS.wbtb} done={steps?.wbtb ?? false} complete={isComplete} />
        </View>
      </View>
    </Card>
  );
}

// Mirrors BeginnerTrackScreen's day-complete row: CrossFade swaps the pending/done
// content (the Cross token — this is also what reduced motion falls back to, since
// CrossFade's opacity fade isn't gated on it), and Pop plays its one-time overshoot on
// just the checkmark, the moment it first mounts into the "done" branch. `complete` is
// the routine's overall 4/4 state, not this row's own — every tick turns the same
// lucid-green as the ring once all four are done, instead of each staying its own color.
function StepRow({
  label,
  done,
  complete,
  onPress,
}: {
  label: string;
  done: boolean;
  complete: boolean;
  onPress?: () => void;
}) {
  return (
    <CrossFade contentKey={done ? 'done' : 'pending'}>
      {done ? (
        <View style={styles.stepRow}>
          <PopIn>
            <Check color={complete ? colors.status.lucid : colors.text.primary} size={14} strokeWidth={2} />
          </PopIn>
          <Text style={[typography.label, styles.stepLabelDone]}>{label}</Text>
        </View>
      ) : onPress ? (
        <AnimatedPressable
          style={styles.stepRow}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Moon color={colors.text.tertiary} size={14} strokeWidth={2} />
          <Text style={[typography.label, styles.stepLabelPending]}>{label}</Text>
        </AnimatedPressable>
      ) : (
        <View style={styles.stepRow}>
          <Moon color={colors.text.tertiary} size={14} strokeWidth={2} />
          <Text style={[typography.label, styles.stepLabelPending]}>{label}</Text>
        </View>
      )}
    </CrossFade>
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
    color: colors.status.lucid,
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
  stepLabelDone: {
    color: colors.text.primary,
  },
  stepLabelPending: {
    color: colors.text.tertiary,
  },
});
