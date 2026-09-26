import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Arrive } from '../../../components/Arrive';
import { Breathing } from '../../../components/Breathing';
import { Button } from '../../../components/Button';
import { CrossFade } from '../../../components/CrossFade';
import { DURATIONS } from '../../../lib/motion';
import { MINUTE_MS, WbtbSession, WILD_REASSURANCE_MINUTES } from '../../../lib/wbtb';
import { colors, radius, spacing, typography } from '../../../theme';

type WildStageProps = {
  session: WbtbSession;
  onComplete: () => void;
};

type Phase = 'prepare' | 'passive';

const PREPARE_STEPS = [
  'Settle into a position you can hold without moving again.',
  'Let your breathing slow. Relax through your body, head to toe.',
  "When you're still and calm, begin.",
];

// WILD resists structure — no countdown, no scheduled prompts. The ambient drift and a
// single static line of guidance carry the passive phase; the user ends it themselves.
export function WildStage({ onComplete }: WildStageProps) {
  const [phase, setPhase] = useState<Phase>('prepare');
  const [showReassurance, setShowReassurance] = useState(false);

  useEffect(() => {
    if (phase !== 'passive') return;
    const timeout = setTimeout(
      () => setShowReassurance(true),
      WILD_REASSURANCE_MINUTES * MINUTE_MS
    );
    return () => clearTimeout(timeout);
  }, [phase]);

  return (
    <View style={styles.container}>
      <CrossFade contentKey={phase} style={styles.body}>
        {phase === 'prepare' ? (
          <View style={styles.prepare}>
            <Text style={[typography.displayMd, styles.title]}>Get still</Text>
            <View style={styles.steps}>
              {PREPARE_STEPS.map((step, i) => (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={[typography.caption, styles.stepNumberText]}>{i + 1}</Text>
                  </View>
                  <Text style={[typography.body, styles.stepText]}>{step}</Text>
                </View>
              ))}
            </View>
            <Button label="I'm ready" onPress={() => setPhase('passive')} />
          </View>
        ) : (
          <View style={styles.passive}>
            <View style={styles.haloWrap}>
              <DriftHalo size={260} minOpacity={0.18} maxOpacity={0.4} />
              <DriftHalo size={190} minOpacity={0.22} maxOpacity={0.5} delayMs={2000} />
              <DriftHalo size={120} minOpacity={0.28} maxOpacity={0.62} delayMs={4000} />
            </View>

            <Text style={[typography.body, styles.guidance]}>
              Watch whatever appears without reaching for it. If a scene starts to form,
              let it become fully real before you move.
            </Text>

            {showReassurance ? (
              <Arrive from="down">
                <Text style={[typography.label, styles.reassurance]}>
                  Still here is fine — sleep can take over any time.
                </Text>
              </Arrive>
            ) : null}
          </View>
        )}
      </CrossFade>

      {phase === 'passive' ? (
        <View style={styles.actions}>
          <Button label="I'm asleep" variant="secondary" onPress={onComplete} />
        </View>
      ) : null}
    </View>
  );
}

// The Ambient token: a slow, staggered opacity loop across three sizes, standing in for
// unfocused hypnagogic imagery without literally rendering "dream" content.
function DriftHalo({
  size,
  minOpacity,
  maxOpacity,
  delayMs,
}: {
  size: number;
  minOpacity: number;
  maxOpacity: number;
  delayMs?: number;
}) {
  return (
    <Breathing
      minOpacity={minOpacity}
      maxOpacity={maxOpacity}
      durationMs={DURATIONS.ambient}
      delayMs={delayMs}
      style={[styles.driftHalo, { width: size, height: size, borderRadius: size / 2 }]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  body: {
    flex: 1,
  },
  prepare: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  title: {
    color: colors.text.primary,
  },
  steps: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: colors.text.secondary,
  },
  stepText: {
    flex: 1,
    color: colors.text.secondary,
  },
  passive: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  haloWrap: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driftHalo: {
    position: 'absolute',
    backgroundColor: colors.accent.primaryMuted,
    borderWidth: 1,
    borderColor: colors.accent.primaryBorder,
  },
  guidance: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  reassurance: {
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  actions: {
    paddingTop: spacing.lg,
  },
});
