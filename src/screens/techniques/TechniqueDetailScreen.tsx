import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Clock, Lightbulb, PlayCircle } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { GlassBackButton } from '../../components/GlassBackButton';
import { NightSky } from '../../components/NightSky';
import { ProUpsell } from '../../components/ProUpsell';
import { ProgressBar } from '../../components/ProgressBar';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useSubscription } from '../../hooks/useSubscription';
import { Technique, TECHNIQUES } from '../../lib/techniqueLibrary';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TechniqueDetail'>;

// Explanation is free for everyone; the guided practice below it is Pro. A free user sees the
// practice section as a locked card that opens the paywall. While the subscription is still
// loading nothing is shown in its place, so a subscriber never sees the lock flash.
export function TechniqueDetailScreen({ navigation, route }: Props) {
  const technique = TECHNIQUES[route.params.technique];
  const { isPro, isResolved } = useSubscription();

  return (
    <ScreenContainer edges={['top', 'bottom']} edgeToEdge>
      <NightSky intensity="subtle" style={styles.sky}>
        <View style={styles.header}>
          <GlassBackButton onPress={() => navigation.goBack()} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Arrive>
            <Text style={[typography.overline, styles.eyebrow]}>{technique.fullName}</Text>
            <Text style={[typography.heroTitle, styles.title]}>{technique.name}</Text>
            <Text style={[typography.body, styles.tagline]}>{technique.tagline}</Text>
          </Arrive>

          <Arrive delay={50} style={styles.meta}>
            <MetaPill label={technique.difficulty} />
            <MetaPill label={technique.timeNeeded} icon />
          </Arrive>

          <Arrive delay={90} style={styles.sections}>
            <Text style={[typography.heading, styles.sectionTitle]}>Understand it</Text>
            {technique.sections.map((section) => (
              <View key={section.heading} style={styles.block}>
                <Text style={[typography.subheading, styles.blockHeading]}>{section.heading}</Text>
                <Text style={[typography.body, styles.blockBody]}>{section.body}</Text>
              </View>
            ))}
            <Text style={[typography.label, styles.bestFor]}>Best for: {technique.bestFor}</Text>
          </Arrive>

          <Arrive delay={130}>
            <Card style={styles.tipsCard} elevated>
              <View style={styles.tipsHeader}>
                <Lightbulb color={colors.accent.primary} size={16} strokeWidth={1.75} />
                <Text style={[typography.overline, styles.tipsLabel]}>Tips</Text>
              </View>
              {technique.tips.map((tip) => (
                <View key={tip} style={styles.tipRow}>
                  <View style={styles.bullet} />
                  <Text style={[typography.body, styles.tipText]}>{tip}</Text>
                </View>
              ))}
            </Card>
          </Arrive>

          <Arrive delay={170} style={styles.sections}>
            <Text style={[typography.heading, styles.sectionTitle]}>Guided practice</Text>
            {!isResolved ? null : isPro ? (
              <GuidedPractice technique={technique} />
            ) : (
              <ProUpsell
                icon={PlayCircle}
                label="GUIDED PRACTICE"
                text={`A step-by-step ${technique.name} session, paced for you. Reading the explanation above is always free.`}
              />
            )}
          </Arrive>
        </ScrollView>
      </NightSky>
    </ScreenContainer>
  );
}

function MetaPill({ label, icon }: { label: string; icon?: boolean }) {
  return (
    <View style={styles.pill}>
      {icon ? <Clock color={colors.text.secondary} size={14} strokeWidth={1.75} /> : null}
      <Text style={[typography.caption, styles.pillText]}>{label}</Text>
    </View>
  );
}

// One step on screen at a time, with back and next. Deliberately untimed: the steps are a
// rehearsal to read through at your own pace, not a live session (that is Wake Back to Bed).
function GuidedPractice({ technique }: { technique: Technique }) {
  const { intro, steps } = technique.practice;
  const [index, setIndex] = useState<number | null>(null);

  if (index === null) {
    return (
      <Card style={styles.practiceCard} elevated>
        <Text style={[typography.body, styles.blockBody]}>{intro}</Text>
        <Text style={[typography.label, styles.stepCount]}>{steps.length} steps</Text>
        <Button label="Begin practice" onPress={() => setIndex(0)} />
      </Card>
    );
  }

  const step = steps[index];
  const isLast = index === steps.length - 1;

  return (
    <Card style={styles.practiceCard} elevated>
      <ProgressBar
        progress={(index + 1) / steps.length}
        color={colors.accent.primary}
        trackColor={colors.surface.track}
      />
      <Text style={[typography.label, styles.stepCount]}>
        Step {index + 1} of {steps.length}
      </Text>
      <Text style={[typography.displaySm, styles.stepTitle]}>{step.title}</Text>
      <Text style={[typography.body, styles.stepBody]}>{step.body}</Text>
      <View style={styles.practiceActions}>
        {index > 0 ? (
          <Button label="Back" variant="secondary" onPress={() => setIndex(index - 1)} />
        ) : (
          <View />
        )}
        <Button
          label={isLast ? 'Finish' : 'Next'}
          onPress={() => (isLast ? setIndex(null) : setIndex(index + 1))}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sky: { flex: 1 },
  header: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.md },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  eyebrow: { color: colors.accent.primary, marginBottom: spacing.xs },
  title: { color: colors.text.primary },
  tagline: { color: colors.text.secondary, marginTop: spacing.sm },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  pillText: { color: colors.text.secondary },
  sections: { gap: spacing.md },
  sectionTitle: { color: colors.text.primary },
  block: { gap: spacing.xs },
  blockHeading: { color: colors.text.primary },
  blockBody: { color: colors.text.secondary },
  bestFor: { color: colors.text.tertiary },
  tipsCard: { gap: spacing.sm },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tipsLabel: { color: colors.text.secondary },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primary,
    marginTop: 10,
  },
  tipText: { flex: 1, color: colors.text.secondary },
  practiceCard: { gap: spacing.md },
  stepCount: { color: colors.text.secondary },
  stepTitle: { color: colors.text.primary },
  stepBody: { color: colors.text.secondary },
  practiceActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
