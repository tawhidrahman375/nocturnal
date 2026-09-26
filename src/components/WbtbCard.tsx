import { useNavigation } from '@react-navigation/native';
import { AlarmClock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { LoadingView } from './LoadingView';
import { useNow } from '../hooks/useNow';
import { useOpenWbtbSession } from '../hooks/useOpenWbtbSession';
import { formatDuration, formatTime, MINUTE_MS, WbtbTechnique } from '../lib/wbtb';
import { cancelSession } from '../lib/wbtbSessions';
import { colors, fontFamily, spacing, typography } from '../theme';

function Eyebrow({ label, action }: { label: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.eyebrowRow}>
      <View style={styles.eyebrowLeft}>
        <View style={styles.eyebrowIconChip}>
          <AlarmClock color={colors.accent.primary} size={14} strokeWidth={2} />
        </View>
        <Text style={[typography.label, styles.eyebrow]}>{label}</Text>
      </View>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={10} accessibilityRole="button">
          <Text style={[typography.label, styles.eyebrowAction]}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function WbtbCard() {
  const navigation = useNavigation();
  const now = useNow(30_000);
  const { session, isLoading, error, reload } = useOpenWbtbSession();
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingCard}>
        <LoadingView label="Checking tonight's alarm" />
      </View>
    );
  }

  if (error && !session) {
    return (
      <View style={styles.card}>
        <Eyebrow label="Tonight" />
        <Text style={[typography.body, styles.body]}>Your alarm didn&apos;t load.</Text>
        <Button label="Try again" variant="secondary" onPress={reload} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.card}>
        <Eyebrow label="Tonight" />
        <View style={styles.copy}>
          <Text style={[typography.heading, styles.wakeTitle]}>Wake Back To Bed</Text>
          <Text style={[typography.body, styles.body]}>
            Wake after 5 to 6 hours. Stay up 20 minutes. Drift back with intention.
          </Text>
        </View>
        <Button
          label="Plan tonight"
          onPress={() => navigation.navigate('WbtbSetup')}
          style={styles.planButton}
        />
      </View>
    );
  }

  const openSession = () => navigation.navigate('WbtbSession', { sessionId: session.id });

  if (session.status === 'active') {
    return (
      <View style={styles.card}>
        <Eyebrow label="In progress" />
        <Text style={[typography.heading, styles.title]}>Your session is waiting</Text>
        <Button label="Resume session" onPress={openSession} />
      </View>
    );
  }

  const wakeAt = new Date(session.wake_at);
  if (wakeAt <= now) {
    return (
      <View style={styles.card}>
        <Eyebrow label="Alarm" />
        <Text style={[typography.heading, styles.title]}>Your wake window is open</Text>
        <Button label="Begin session" onPress={openSession} />
      </View>
    );
  }

  const handleCancel = async () => {
    setCancelError(null);
    try {
      await cancelSession(session);
      reload();
    } catch (e) {
      setCancelError((e as Error).message);
    }
  };

  const sleepMinutes = (wakeAt.getTime() - new Date(session.sleep_at).getTime()) / MINUTE_MS;

  return (
    <View style={styles.card}>
      <Eyebrow label="Alarm set" action={{ label: 'Cancel', onPress: handleCancel }} />
      <View style={styles.copy}>
        <Text style={[typography.displayMd, styles.time]}>{formatTime(wakeAt)}</Text>
        <Text style={[typography.label, styles.meta]}>
          {formatDuration(sleepMinutes)} after {formatTime(new Date(session.sleep_at))} ·{' '}
          {session.wake_window_minutes} min wake window
        </Text>
      </View>
      {cancelError ? <Text style={[typography.label, styles.error]}>{cancelError}</Text> : null}
      <View style={styles.actionsRow}>
        <Button label="Start early" variant="secondary" onPress={openSession} style={styles.flex} />
        <Button
          label="Change"
          variant="secondary"
          onPress={() =>
            navigation.navigate('WbtbSetup', {
              plan: {
                sleepAt: session.sleep_at,
                sleepMinutes,
                wakeWindowMinutes: session.wake_window_minutes,
                technique: session.technique as WbtbTechnique,
              },
            })
          }
          style={styles.flex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.cardPadding,
  },
  loadingCard: {
    height: 164,
    padding: spacing.cardPadding,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    opacity: 0.4,
  },
  eyebrowIconChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  eyebrowAction: {
    color: colors.text.secondary,
  },
  copy: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text.primary,
  },
  wakeTitle: {
    color: colors.text.primary,
    fontFamily: fontFamily.serif,
    fontSize: 26,
  },
  body: {
    color: colors.text.secondary,
  },
  time: {
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  meta: {
    color: colors.text.secondary,
  },
  error: {
    color: '#F87171',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  planButton: {
    height: 44,
    // Same navy identity as before, just lightened a step and given a lighter edge —
    // #1E2A4A alone was reading as nearly the same tone as the atmosphere behind it.
    backgroundColor: '#26365C',
    borderWidth: 1,
    borderColor: '#4A5C8C',
  },
});
