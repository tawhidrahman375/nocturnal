import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Breathing } from '../../../components/Breathing';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { MILD_MANTRA, WbtbSession } from '../../../lib/wbtb';
import { colors, radius, spacing, typography } from '../../../theme';

type MildStageProps = {
  session: WbtbSession;
  onComplete: () => void;
};

export function MildStage({ session, onComplete }: MildStageProps) {
  const steps = [
    'Lie down and settle into a comfortable position.',
    'Repeat the intention slowly, meaning every word.',
    session.dream_recall
      ? 'Picture yourself back in the dream you just wrote down. Spot something strange, and realise: this is a dream.'
      : 'Picture yourself back in a recent dream. Spot something strange, and realise: this is a dream.',
    'Keep repeating until you drift off.',
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[typography.displayMd, styles.title]}>Set your intention</Text>

        <Card style={styles.mantraCard}>
          <Breathing minOpacity={0.55} durationMs={5000}>
            <Text style={[typography.displayMd, styles.mantra]}>{MILD_MANTRA}</Text>
          </Breathing>
        </Card>

        <View style={styles.steps}>
          {steps.map((step, i) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={[typography.caption, styles.stepNumberText]}>{i + 1}</Text>
              </View>
              <Text style={[typography.body, styles.stepText]}>{step}</Text>
            </View>
          ))}
        </View>

        {session.dream_recall ? (
          <Text style={[typography.body, styles.recall]} numberOfLines={3}>
            &ldquo;{session.dream_recall}&rdquo;
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.actions}>
        <Button label="I'm lying down" onPress={onComplete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    color: colors.text.primary,
  },
  mantraCard: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  mantra: {
    color: colors.text.primary,
    textAlign: 'center',
    fontFamily: typography.heading.fontFamily,
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
  recall: {
    color: colors.text.tertiary,
    fontStyle: 'italic',
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.border.default,
  },
  actions: {
    paddingVertical: spacing.lg,
  },
});
