import { BookOpen, Hand, Lamp, LucideIcon } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ProgressRing } from '../../../components/ProgressRing';
import { useNow } from '../../../hooks/useNow';
import { formatCountdown, MINUTE_MS, WbtbSession, wakeWindowEndsAt } from '../../../lib/wbtb';
import { colors, spacing, typography } from '../../../theme';

type WakeWindowStageProps = {
  session: WbtbSession;
  onContinue: () => void;
};

export function WakeWindowStage({ session, onContinue }: WakeWindowStageProps) {
  const now = useNow(1000);
  const endsAt = wakeWindowEndsAt(session) ?? now;
  const totalMs = session.wake_window_minutes * MINUTE_MS;
  const remainingMs = endsAt.getTime() - now.getTime();
  const isDone = remainingMs <= 0;

  const tips: { icon: LucideIcon; text: string }[] = [
    { icon: Lamp, text: 'Keep the lights low and get out of bed for a few minutes.' },
    {
      icon: Hand,
      text: 'Do a reality check: pinch your nose and try to breathe through it.',
    },
    {
      icon: BookOpen,
      text: session.dream_recall
        ? 'Reread what you just wrote. What in it could never happen awake?'
        : 'Read back through recent dreams and look for places or people that repeat.',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.ringWrap}>
          <ProgressRing size={232} strokeWidth={6} progress={1 - remainingMs / totalMs}>
            <Text style={[typography.clock, styles.countdown]}>{formatCountdown(remainingMs)}</Text>
            <Text style={[typography.label, styles.ringLabel]}>
              {isDone ? 'Complete' : `of ${session.wake_window_minutes} min`}
            </Text>
          </ProgressRing>
        </View>

        <View style={styles.copy}>
          <Text style={[typography.heading, styles.title]}>
            {isDone ? 'Time to go back to bed' : 'Stay gently awake'}
          </Text>
          <Text style={[typography.body, styles.body]}>
            {isDone
              ? 'Your mind is alert and your body is ready for sleep. That is the window you want.'
              : 'A little wakefulness makes the next REM period far more lucid-prone.'}
          </Text>
        </View>

        <Card style={styles.tips}>
          {tips.map(({ icon: Icon, text }) => (
            <View key={text} style={styles.tipRow}>
              <Icon color={colors.accent.primary} size={20} strokeWidth={1.5} />
              <Text style={[typography.body, styles.tipText]}>{text}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          label={isDone ? 'Continue' : "I'm ready to sleep"}
          variant={isDone ? 'primary' : 'secondary'}
          onPress={onContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  ringWrap: {
    alignItems: 'center',
  },
  countdown: {
    color: colors.text.primary,
    fontSize: 52,
    lineHeight: 60,
  },
  ringLabel: {
    color: colors.text.tertiary,
  },
  copy: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text.primary,
  },
  body: {
    color: colors.text.secondary,
  },
  tips: {
    gap: spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    color: colors.text.secondary,
  },
  actions: {
    paddingVertical: spacing.lg,
  },
});
