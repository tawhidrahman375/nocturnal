import { CircleCheck, Ear, Eye, Hand, LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Breathing } from '../../../components/Breathing';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { CrossFade } from '../../../components/CrossFade';
import { PopIn } from '../../../components/PopIn';
import { ProgressRing } from '../../../components/ProgressRing';
import { STAGE_SLIDE_PX } from '../../../lib/motion';
import {
  SECOND_MS,
  SSILD_CYCLES_PER_ROUND,
  SSILD_REST_SECONDS,
  SSILD_ROUNDS,
  SSILD_SENSE_SECONDS,
  WbtbSession,
} from '../../../lib/wbtb';
import { colors, spacing, typography } from '../../../theme';

type SsildStageProps = {
  session: WbtbSession;
  onComplete: () => void;
};

type Sense = 'sight' | 'sound' | 'touch';
type Phase = Sense | 'rest' | 'done';

const SENSE_ORDER: Sense[] = ['sight', 'sound', 'touch'];

const SENSE_COPY: Record<Sense, { icon: LucideIcon; label: string; prompt: string }> = {
  sight: {
    icon: Eye,
    label: 'Sight',
    prompt: 'Eyes closed. Softly look into the darkness ahead of you.',
  },
  sound: {
    icon: Ear,
    label: 'Sound',
    prompt: 'Shift your attention to whatever you can hear.',
  },
  touch: {
    icon: Hand,
    label: 'Touch',
    prompt: 'Notice where your body meets the bed — weight, warmth, texture.',
  },
};

// SSILD is cyclical and timed by design — the ring and the sight/sound/touch slide are
// the point, unlike WILD's deliberately open-ended passive phase.
export function SsildStage({ onComplete }: SsildStageProps) {
  const [round, setRound] = useState(1);
  const [cycle, setCycle] = useState(1);
  const [phase, setPhase] = useState<Phase>('sight');

  const advance = () => {
    if (phase === 'rest') {
      if (round >= SSILD_ROUNDS) {
        setPhase('done');
      } else {
        setRound((r) => r + 1);
        setCycle(1);
        setPhase('sight');
      }
      return;
    }

    const senseIndex = SENSE_ORDER.indexOf(phase as Sense);
    if (senseIndex < SENSE_ORDER.length - 1) {
      setPhase(SENSE_ORDER[senseIndex + 1]);
      return;
    }
    // Touch just finished this cycle.
    if (cycle < SSILD_CYCLES_PER_ROUND) {
      setCycle((c) => c + 1);
      setPhase('sight');
    } else {
      setPhase('rest');
    }
  };

  useEffect(() => {
    if (phase === 'done') return;
    const durationMs =
      phase === 'rest' ? SSILD_REST_SECONDS * SECOND_MS : SSILD_SENSE_SECONDS * SECOND_MS;
    const timeout = setTimeout(advance, durationMs);
    return () => clearTimeout(timeout);
    // advance() closes over round/cycle/phase directly above; re-run whenever any changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cycle, round]);

  if (phase === 'done') {
    return (
      <View style={styles.doneContainer}>
        <Text style={[typography.heading, styles.doneTitle]}>All cycles complete</Text>
        <Breathing minOpacity={0.2} maxOpacity={0.6} durationMs={6000}>
          <Text style={[typography.subheading, styles.doneText]}>
            Let go, and let sleep take over.
          </Text>
        </Breathing>
        <Button
          label="I'm asleep"
          variant="secondary"
          onPress={onComplete}
          style={styles.doneButton}
        />
      </View>
    );
  }

  if (phase === 'rest') {
    return (
      <View style={styles.container}>
        <Card style={styles.restCard}>
          <View style={styles.roundCompleteRow}>
            <PopIn>
              <CircleCheck color={colors.status.lucid} size={20} strokeWidth={1.5} />
            </PopIn>
            <Text style={[typography.bodyMedium, styles.roundCompleteText]}>
              Round {round} complete
            </Text>
          </View>
          <Breathing minOpacity={0.4} maxOpacity={0.9} durationMs={4000}>
            <Text style={[typography.heading, styles.restText]}>Let go for a moment</Text>
          </Breathing>
        </Card>
      </View>
    );
  }

  const sense = SENSE_COPY[phase];

  return (
    <View style={styles.container}>
      <Text style={[typography.label, styles.progressLabel]}>
        Round {round} of {SSILD_ROUNDS} · Cycle {cycle} of {SSILD_CYCLES_PER_ROUND}
      </Text>

      <View style={styles.ringWrap}>
        <ProgressRing
          key={`${round}-${cycle}-${phase}`}
          size={200}
          strokeWidth={5}
          progress={1}
          durationMs={SSILD_SENSE_SECONDS * SECOND_MS}
        />
        <CrossFade contentKey={phase} slidePx={STAGE_SLIDE_PX} style={styles.senseOverlay}>
          <sense.icon color={colors.accent.primary} size={32} strokeWidth={1.5} />
          <Text style={[typography.heading, styles.senseLabel]}>{sense.label}</Text>
        </CrossFade>
      </View>

      <CrossFade contentKey={phase} slidePx={STAGE_SLIDE_PX}>
        <Text style={[typography.body, styles.prompt]}>{sense.prompt}</Text>
      </CrossFade>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  progressLabel: {
    color: colors.text.tertiary,
  },
  ringWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senseOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  senseLabel: {
    color: colors.text.primary,
  },
  prompt: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  restCard: {
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  roundCompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roundCompleteText: {
    color: colors.status.lucid,
  },
  restText: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  doneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  doneTitle: {
    color: colors.text.tertiary,
  },
  doneText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  doneButton: {
    marginTop: spacing.md,
  },
});
