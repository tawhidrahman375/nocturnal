import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Arrive } from '../../components/Arrive';
import { Breathing } from '../../components/Breathing';
import { Button } from '../../components/Button';
import { CrossFade } from '../../components/CrossFade';
import { OptionCard } from '../../components/OptionCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TimeStepper } from '../../components/TimeStepper';
import { useAuth } from '../../hooks/useAuth';
import { DURATIONS, STAGE_SLIDE_PX } from '../../lib/motion';
import {
  DREAMS_PER_WEEK_OPTIONS,
  DreamsPerWeek,
  EXPERIENCE_OPTIONS,
  ExperienceLevel,
  GOAL_OPTIONS,
  MainGoal,
  OnboardingAnswers,
  OnboardingPrediction,
  predictOutcome,
  saveOnboardingAnswers,
  TECHNIQUE_TRIED_OPTIONS,
  TriedTechnique,
} from '../../lib/onboarding';
import { minutesSinceMidnight, timeOfDayFromMinutes } from '../../lib/realityChecks';
import { colors, radius, spacing, typography } from '../../theme';

const QUESTION_COUNT = 5;
// A brief pause after a single-select tap, so the choice visibly registers before the
// screen slides on. Long enough to read as deliberate, short enough to stay brisk.
const AUTO_ADVANCE_DELAY_MS = 350;
// Minimum time the "calculating" phase holds, regardless of how fast the save resolves,
// so the reveal always feels considered rather than tied to network latency.
const CALCULATING_MIN_MS = 1400;

type OnboardingQuizScreenProps = {
  onComplete: () => void;
};

function defaultWakeTime() {
  const date = new Date();
  date.setHours(7, 0, 0, 0);
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
  const [triedTechniques, setTriedTechniques] = useState<TriedTechnique[]>([]);
  const [phase, setPhase] = useState<Phase>('quiz');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<OnboardingPrediction | null>(null);

  const advance = () => setStep((s) => Math.min(s + 1, QUESTION_COUNT - 1));

  const selectSingle = <T,>(setValue: (value: T) => void, value: T) => {
    setValue(value);
    setTimeout(advance, AUTO_ADVANCE_DELAY_MS);
  };

  const toggleTechnique = (value: TriedTechnique) => {
    setTriedTechniques((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
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
      triedTechniques,
    };

    try {
      await Promise.all([
        saveOnboardingAnswers(user.id, answers),
        new Promise((resolve) => setTimeout(resolve, CALCULATING_MIN_MS)),
      ]);
      setPrediction(predictOutcome(answers));
      setPhase('revealed');
    } catch (e) {
      setSaveError((e as Error).message);
      setPhase('quiz');
    }
  };

  if (phase !== 'quiz') {
    return <OutcomeReveal phase={phase} prediction={prediction} onDone={onComplete} />;
  }

  return (
    <ScreenContainer glow>
      <QuizProgress activeSegments={step + 1} />

      <CrossFade contentKey={step} slidePx={STAGE_SLIDE_PX} style={styles.body}>
        {step === 0 ? (
          <QuestionStep
            title="How familiar are you with lucid dreaming?"
            options={EXPERIENCE_OPTIONS}
            value={experienceLevel}
            onSelect={(value) => selectSingle(setExperienceLevel, value)}
          />
        ) : null}

        {step === 1 ? (
          <QuestionStep
            title="What's your main goal?"
            options={GOAL_OPTIONS}
            value={mainGoal}
            onSelect={(value) => selectSingle(setMainGoal, value)}
          />
        ) : null}

        {step === 2 ? (
          <QuestionStep
            title="How many dreams do you remember per week, on average?"
            options={DREAMS_PER_WEEK_OPTIONS}
            value={dreamsPerWeek}
            onSelect={(value) => selectSingle(setDreamsPerWeek, value)}
          />
        ) : null}

        {step === 3 ? (
          <View style={styles.stepContent}>
            <Text style={[typography.displayMd, styles.title]}>
              What time do you usually wake up naturally?
            </Text>
            <View style={styles.timeWrap}>
              <TimeStepper
                value={wakeTime}
                onChange={setWakeTime}
                min={timeOfDayFromMinutes(0)}
                max={timeOfDayFromMinutes(23 * 60 + 45)}
              />
            </View>
            <Button label="Continue" onPress={advance} style={styles.continueButton} />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.stepContent}>
            <Text style={[typography.displayMd, styles.title]}>
              Have you tried any techniques before?
            </Text>
            <Text style={[typography.body, styles.subtitle]}>Pick as many as apply.</Text>
            <View style={styles.options}>
              {TECHNIQUE_TRIED_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  label={option.label}
                  selected={triedTechniques.includes(option.value)}
                  onPress={() => toggleTechnique(option.value)}
                />
              ))}
              <OptionCard
                label="None"
                selected={triedTechniques.length === 0}
                onPress={() => setTriedTechniques([])}
              />
            </View>
            {saveError ? (
              <Arrive from="down">
                <Text style={[typography.label, styles.errorText]}>{saveError}</Text>
              </Arrive>
            ) : null}
            <Button label="See my prediction" onPress={finishQuiz} style={styles.continueButton} />
          </View>
        ) : null}
      </CrossFade>
    </ScreenContainer>
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

function QuestionStep<T extends string>({
  title,
  options,
  value,
  onSelect,
}: {
  title: string;
  options: { value: T; label: string }[];
  value: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={[typography.displayMd, styles.title]}>{title}</Text>
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
    </View>
  );
}

function OutcomeReveal({
  phase,
  prediction,
  onDone,
}: {
  phase: Exclude<Phase, 'quiz'>;
  prediction: OnboardingPrediction | null;
  onDone: () => void;
}) {
  return (
    <ScreenContainer glow>
      <QuizProgress activeSegments={QUESTION_COUNT} />

      <CrossFade contentKey={phase} style={styles.outcomeBody}>
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
            <Text style={[typography.label, styles.calculatingText]}>Finding your path...</Text>
          </View>
        ) : (
          <Arrive style={styles.reveal}>
            <Text style={[typography.label, styles.eyebrow]}>Your path</Text>
            <Text style={[typography.displayLg, styles.headline]}>{prediction?.headline}</Text>
            <Text style={[typography.body, styles.detail]}>{prediction?.detail}</Text>
            <Button label="Let's go" onPress={onDone} style={styles.letsGoButton} />
          </Arrive>
        )}
      </CrossFade>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.border.default,
  },
  segmentActive: {
    backgroundColor: colors.accent.primary,
  },
  body: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.secondary,
    marginTop: -spacing.md,
  },
  timeWrap: {
    paddingVertical: spacing.lg,
  },
  options: {
    gap: spacing.sm,
  },
  continueButton: {
    alignSelf: 'stretch',
  },
  errorText: {
    color: '#F87171',
  },
  outcomeBody: {
    flex: 1,
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
  haloRing: {
    position: 'absolute',
    borderWidth: 1,
    backgroundColor: colors.accent.primaryMuted,
    borderColor: colors.accent.primaryBorder,
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
    color: colors.text.tertiary,
  },
  reveal: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headline: {
    color: colors.text.primary,
  },
  detail: {
    color: colors.text.secondary,
  },
  letsGoButton: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
});
