import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Breathing } from '../../../components/Breathing';
import { Button } from '../../../components/Button';
import { useNow } from '../../../hooks/useNow';
import { formatClock, formatDuration, MINUTE_MS, WbtbSession } from '../../../lib/wbtb';
import { colors, spacing, typography } from '../../../theme';

type AlarmStageProps = {
  session: WbtbSession;
  onBegin: () => void;
  onSkip: () => void;
};

export function AlarmStage({ session, onBegin, onSkip }: AlarmStageProps) {
  const now = useNow(15_000);
  const { hour, minute, period } = formatClock(now);
  const isEarly = now < new Date(session.wake_at);
  const sleptMinutes = (now.getTime() - new Date(session.sleep_at).getTime()) / MINUTE_MS;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.clockWrap}>
          <Breathing minOpacity={0.35} durationMs={3000} style={styles.halo} />
          <View style={styles.clockRow}>
            <Text style={[typography.clock, styles.clock]}>
              {hour}:{minute}
            </Text>
            <Text style={[typography.heading, styles.period]}>{period}</Text>
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={[typography.displayMd, styles.title]}>
            {isEarly ? 'Awake early' : 'Time to wake up'}
          </Text>
          {sleptMinutes >= 60 ? (
            <Text style={[typography.body, styles.body]}>
              You&apos;ve slept about {formatDuration(Math.round(sleptMinutes / 5) * 5)}.
            </Text>
          ) : null}
          <Text style={[typography.body, styles.body]}>
            Stay still for a moment. Your last dream is closest right now.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button label="I'm awake" onPress={onBegin} />
        <Pressable onPress={onSkip} hitSlop={8} style={styles.skip} accessibilityRole="button">
          <Text style={[typography.bodyMedium, styles.skipText]}>Skip tonight</Text>
        </Pressable>
      </View>
    </View>
  );
}

const HALO_SIZE = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  clockWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: HALO_SIZE,
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    backgroundColor: 'rgba(108, 142, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(108, 142, 255, 0.18)',
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  clock: {
    color: colors.text.primary,
  },
  period: {
    color: colors.text.secondary,
  },
  copy: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  body: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
  skip: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    color: colors.text.tertiary,
  },
});
