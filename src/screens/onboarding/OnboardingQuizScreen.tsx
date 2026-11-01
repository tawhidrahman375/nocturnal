import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Arrive } from '../../components/Arrive';
import { Breathing } from '../../components/Breathing';
import { Button } from '../../components/Button';
import { CrossFade } from '../../components/CrossFade';
import { NightSky } from '../../components/NightSky';
import { OptionCard } from '../../components/OptionCard';
import { TimeStepper } from '../../components/TimeStepper';
import { useAuth } from '../../hooks/useAuth';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { track } from '../../lib/analytics';
import { DURATIONS, EASE_IN_OUT, STAGE_SLIDE_PX } from '../../lib/motion';
import {
  DREAMS_PER_WEEK_OPTIONS,
  DreamsPerWeek,
  EXPERIENCE_OPTIONS,
  ExperienceLevel,
  buildStarterPlan,
  GOAL_OPTIONS,
  MainGoal,
  OnboardingAnswers,
  OnboardingPrediction,
  predictOutcome,
  saveOnboardingAnswers,
  saveStarterPlan,
  StarterPlan,
  TECHNIQUE_TRIED_OPTIONS,
  TriedTechnique,
} from '../../lib/onboarding';
import { minutesSinceMidnight, timeOfDayFromMinutes } from '../../lib/realityChecks';
import { colors, radius, spacing, typography } from '../../theme';

const QUESTION_COUNT = 6;
// Minimum time the "calculating" phase holds, regardless of how fast the save resolves,
// so the reveal always feels considered rather than tied to network latency.
const CALCULATING_MIN_MS = 1400;

// What each technique abbreviation stands for, shown under it on the techniques step.
const TECHNIQUE_NAMES: Record<TriedTechnique, string> = {
  mild: 'Mnemonic Induction of Lucid Dreams',
  wild: 'Wake Initiated Lucid Dream',
  wbtb: 'Wake Back To Bed',
  ssild: 'Senses Initiated Lucid Dream',
};

type OnboardingQuizScreenProps = {
  onComplete: () => void;
};

function defaultWakeTime() {
  const date = new Date();
  date.setHours(7, 0, 0, 0);
  return date;
}

function defaultBedtime() {
  const date = new Date();
  date.setHours(23, 0, 0, 0);
  return date;
}

type Phase = 'quiz' | 'calculating' | 'revealed';

export function OnboardingQuizScreen({ onComplete }: OnboardingQuizScreenProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [mainGoal, setMainGoal] = useState<MainGoal | null>(null);
  const [dreamsPerWeek, setDreamsPerWeek] = useState<DreamsPerWeek | null>(null);
  const [wakeTime, setWakeTime] = useState(defaultWakeTime);
  const [bedtime, setBedtime] = useState(defaultBedtime);
  const [triedTechniques, setTriedTechniques] = useState<TriedTechnique[]>([]);
  // "None" has to be chosen, not just the absence of a choice, or the action button would
  // show before anything was picked. Saved as an empty techniques list.
  const [triedNone, setTriedNone] = useState(false);
  const [phase, setPhase] = useState<Phase>('quiz');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<OnboardingPrediction | null>(null);
  const [plan, setPlan] = useState<StarterPlan | null>(null);

  const advance = () => setStep((s) => Math.min(s + 1, QUESTION_COUNT - 1));

  const toggleTechnique = (value: TriedTechnique) => {
    setTriedNone(false);
    setTriedTechniques((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const toggleNone = () => {
    setTriedNone((prev) => !prev);
    setTriedTechniques([]);
  };

  const finishQuiz = async () => {
    if (!user || !experienceLevel || !mainGoal || !dreamsPerWeek) return;
    setSaveError(null);
    setPhase('calculating');

    const answers: OnboardingAnswers = {
      experienceLevel,
      mainGoal,
      dreamsPerWeek,
      naturalWakeMinutes: minutesSinceMidnight(wakeTime),
      bedtimeMinutes: minutesSinceMidnight(bedtime),
      triedTechniques,
    };

    try {
      await Promise.all([
        saveOnboardingAnswers(user.id, answers),
        new Promise((resolve) => setTimeout(resolve, CALCULATING_MIN_MS)),
      ]);
      const starterPlan = buildStarterPlan(answers);
      await saveStarterPlan(user.id, starterPlan);
      setPlan(starterPlan);
      setPrediction(predictOutcome(answers));
      setPhase('revealed');
      // No properties: the quiz answers (including wake time) stay out of analytics.
      track('onboarding_completed');
    } catch (e) {
      setSaveError((e as Error).message);
      setPhase('quiz');
    }
  };

  if (phase !== 'quiz') {
    return <OutcomeReveal phase={phase} prediction={prediction} plan={plan} onDone={onComplete} />;
  }

  return (
    <Shell activeSegments={step + 1}>
      <CrossFade contentKey={step} slidePx={STAGE_SLIDE_PX} style={styles.body}>
        {step === 0 ? (
          <QuestionStep
            title="How familiar are you with lucid dreaming?"
            options={EXPERIENCE_OPTIONS}
            value={experienceLevel}
            onSelect={setExperienceLevel}
            onContinue={advance}
          />
        ) : null}

        {step === 1 ? (
          <QuestionStep
            title="What's your main goal?"
            options={GOAL_OPTIONS}
            value={mainGoal}
            onSelect={setMainGoal}
            onContinue={advance}
          />
        ) : null}

        {step === 2 ? (
          <QuestionStep
            title="How many dreams do you remember per week?"
            options={DREAMS_PER_WEEK_OPTIONS}
            value={dreamsPerWeek}
            onSelect={setDreamsPerWeek}
            onContinue={advance}
          />
        ) : null}

        {step === 3 ? (
          <StepFrame
            title="What time do you usually wake up?"
            footer={<FooterAction label="Continue" visible onPress={advance} />}
          >
            <View style={styles.timeWrap}>
              <TimeStepper
                value={wakeTime}
                onChange={setWakeTime}
                min={timeOfDayFromMinutes(0)}
                max={timeOfDayFromMinutes(23 * 60 + 45)}
              />
            </View>
          </StepFrame>
        ) : null}

        {step === 4 ? (
          <StepFrame
            title="And what time do you usually go to bed?"
            subtitle="We'll nudge you to set your intention right then."
            footer={<FooterAction label="Continue" visible onPress={advance} />}
          >
            <View style={styles.timeWrap}>
              <TimeStepper
                value={bedtime}
                onChange={setBedtime}
                min={timeOfDayFromMinutes(0)}
                max={timeOfDayFromMinutes(23 * 60 + 45)}
              />
            </View>
          </StepFrame>
        ) : null}

        {step === 5 ? (
          <StepFrame
            title="Have you tried any techniques before?"
            subtitle="Pick as many as apply."
            footer={
              <FooterAction
                label="See my prediction"
                visible={triedTechniques.length > 0 || triedNone}
                onPress={finishQuiz}
              />
            }
          >
            <View style={styles.options}>
              {TECHNIQUE_TRIED_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  sublabel={TECHNIQUE_NAMES[option.value]}
                  selected={triedTechniques.includes(option.value)}
                  onPress={() => toggleTechnique(option.value)}
                />
              ))}
              <OptionCard
                label="None"
                sublabel="No techniques yet"
                selected={triedNone}
                onPress={toggleNone}
              />
            </View>
            {saveError ? (
              <Arrive from="down">
                <Text style={[typography.label, styles.errorText]}>{saveError}</Text>
              </Arrive>
            ) : null}
          </StepFrame>
        ) : null}
      </CrossFade>
    </Shell>
  );
}

// The frame every step and the reveal share: NightSky behind everything, the progress bar
// across the top below the status bar, and the step itself filling the rest. The sky sits
// outside the step transition, so it never flickers between steps.
function Shell({ activeSegments, children }: PropsWithChildren<{ activeSegments: number }>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <NightSky intensity="full" style={styles.sky}>
        <View style={[styles.progressWrap, { paddingTop: insets.top + spacing.md }]}>
          <QuizProgress activeSegments={activeSegments} />
        </View>
        {children}
      </NightSky>
    </View>
  );
}

// Shared with OutcomeReveal so the progress bar never just vanishes on the
// calculating/reveal screens — it stays visible there, shown as fully complete.
function QuizProgress({ activeSegments }: { activeSegments: number }) {
  return (
    <View style={styles.progress}>
      {Array.from({ length: QUESTION_COUNT }).map((_, i) => (
        <View key={i} style={[styles.segment, i < activeSegments && styles.segmentActive]} />
      ))}
    </View>
  );
}

type StepFrameProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}>;

// The layout every step uses: the top 30% left to the sky, then the question, its subtitle
// 8px under it, a 32px gap, the options, and the action button pinned above the safe area.
// The empty sky gives way first on a short screen; if it still doesn't fit, the question and
// options scroll while the button stays put.
function StepFrame({ eyebrow, title, subtitle, footer, children }: StepFrameProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.step}>
      <View style={styles.skySpace} />
      <ScrollView
        style={styles.stepScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {eyebrow ? <Text style={[typography.overline, styles.eyebrow]}>{eyebrow}</Text> : null}
        <Text style={[typography.displayLg, styles.title]}>{title}</Text>
        {subtitle ? <Text style={[typography.body, styles.subtitle]}>{subtitle}</Text> : null}
        <View style={styles.stepBody}>{children}</View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md }]}>
        {footer}
      </View>
    </View>
  );
}

// The primary action pinned to the bottom of a step. Its space is always reserved so nothing
// shifts when it appears; hidden, it is invisible and cannot be tapped. Fades on the Cross token.
function FooterAction({ label, visible, onPress }: { label: string; visible: boolean; onPress: () => void }) {
  const reducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(visible ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(visible ? 1 : 0);
      return;
    }
    const animation = Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: DURATIONS.cross,
      easing: EASE_IN_OUT,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, reducedMotion, opacity]);

  return (
    <Animated.View
      style={[{ opacity }, !visible && styles.footerHidden]}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
    >
      <Button label={label} labelColor={colors.text.primary} onPress={onPress} style={styles.actionButton} />
    </Animated.View>
  );
}

function QuestionStep<T extends string>({
  title,
  options,
  value,
  onSelect,
  onContinue,
}: {
  title: string;
  options: { value: T; label: string }[];
  value: T | null;
  onSelect: (value: T) => void;
  onContinue: () => void;
}) {
  return (
    <StepFrame
      title={title}
      footer={<FooterAction label="Continue" visible={value !== null} onPress={onContinue} />}
    >
      <View style={styles.options}>
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
    </StepFrame>
  );
}

function OutcomeReveal({
  phase,
  prediction,
  plan,
  onDone,
}: {
  phase: Exclude<Phase, 'quiz'>;
  prediction: OnboardingPrediction | null;
  plan: StarterPlan | null;
  onDone: () => void;
}) {
  return (
    <Shell activeSegments={QUESTION_COUNT}>
      <CrossFade contentKey={phase} style={styles.body}>
        {phase === 'calculating' ? (
          <View style={styles.calculating}>
            <View style={styles.calculatingHalo}>
              <Breathing
                minOpacity={0.18}
                maxOpacity={0.4}
                durationMs={DURATIONS.ambient}
                style={[styles.haloRing, styles.haloOuter]}
              />
              <Breathing
                minOpacity={0.28}
                maxOpacity={0.6}
                durationMs={DURATIONS.ambient}
                delayMs={1200}
                style={[styles.haloRing, styles.haloInner]}
              />
            </View>
            <Text style={[typography.label, styles.calculatingText]}>Building your plan...</Text>
          </View>
        ) : (
          <StepFrame
            eyebrow="Your path"
            title={prediction?.headline ?? ''}
            subtitle={prediction?.detail}
            footer={<FooterAction label="Keep my plan" visible onPress={onDone} />}
          >
            {plan ? (
              <Arrive delay={120} style={styles.planStack}>
                <PlanRow label="Your dream type" value={plan.dreamType} />
                <PlanRow label="Start with" value={plan.technique} note={plan.techniqueWhy} />
                <PlanRow label="Your first step" value={plan.firstStep} />
              </Arrive>
            ) : null}
          </StepFrame>
        )}
      </CrossFade>
    </Shell>
  );
}

function PlanRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View style={styles.planRow}>
      <Text style={[typography.overline, styles.planLabel]}>{label}</Text>
      <Text style={[typography.subheading, styles.planValue]}>{value}</Text>
      {note ? <Text style={[typography.footnote, styles.planNote]}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  planStack: {
    gap: spacing.sm,
  },
  planRow: {
    gap: spacing.xs / 2,
    padding: spacing.cardPadding,
    borderRadius: radius.card,
    backgroundColor: colors.surface.glassSoft,
  },
  planLabel: {
    color: colors.text.tertiary,
  },
  planValue: {
    color: colors.text.primary,
  },
  planNote: {
    color: colors.text.secondary,
  },
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  sky: {
    flex: 1,
  },
  progressWrap: {
    paddingHorizontal: spacing.screenPadding,
  },
  progress: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 8,
    backgroundColor: colors.surface.track,
  },
  segmentActive: {
    backgroundColor: colors.accent.primary,
  },
  body: {
    flex: 1,
  },
  step: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  // The top 30% stays empty sky. It is the first thing to give way when a step is tall.
  skySpace: {
    height: '30%',
    minHeight: spacing.md,
    flexShrink: 1000,
  },
  stepScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  eyebrow: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  stepBody: {
    marginTop: spacing.xl,
  },
  options: {
    gap: spacing.sm + spacing.xs / 2,
  },
  timeWrap: {
    alignItems: 'center',
  },
  footer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: spacing.md,
  },
  footerHidden: {
    pointerEvents: 'none',
  },
  actionButton: {
    alignSelf: 'stretch',
  },
  errorText: {
    color: colors.status.danger,
    marginTop: spacing.md,
  },
  calculating: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  calculatingHalo: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A soft filled ring with no stroke: depth from the fill alone, per design.md.
  haloRing: {
    position: 'absolute',
    backgroundColor: colors.accent.primaryMuted,
  },
  haloOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  haloInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  calculatingText: {
    color: colors.text.secondary,
  },
});
