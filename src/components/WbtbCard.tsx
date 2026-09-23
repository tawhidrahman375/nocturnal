import { useNavigation } from '@react-navigation/native';
import { AlarmClock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { LoadingView } from './LoadingView';
import { useNow } from '../hooks/useNow';
import { useOpenWbtbSession } from '../hooks/useOpenWbtbSession';
import { formatDuration, formatTime, MINUTE_MS } from '../lib/wbtb';
import { cancelSession } from '../lib/wbtbSessions';
import { colors, spacing, typography } from '../theme';

function Eyebrow({ label, action }: { label: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.eyebrowRow}>
      <View style={styles.eyebrowLeft}>
        <AlarmClock color={colors.accent.primary} size={18} strokeWidth={1.5} />
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
      <Card style={styles.loadingCard}>
        <LoadingView label="Checking tonight's alarm" />
      </Card>
    );
  }

  if (error && !session) {
    return (
      <Card style={styles.card}>
        <Eyebrow label="Tonight" />
        <Text style={[typography.body, styles.body]}>Couldn&apos;t load your WBTB alarm.</Text>
        <Button label="Try again" variant="secondary" onPress={reload} />
      </Card>
    );
  }

  if (!session) {
    return (
      <Card style={styles.card}>
        <Eyebrow label="Tonight" />
        <View style={styles.copy}>
          <Text style={[typography.heading, styles.title]}>Wake Back To Bed</Text>
          <Text style={[typography.body, styles.body]}>
            Wake after 5–6 hours, stay up for 20 minutes, then drift back with a lucid intention.
          </Text>
        </View>
        <Button label="Plan tonight" onPress={() => navigation.navigate('WbtbSetup')} />
      </Card>
    );
  }

  const openSession = () => navigation.navigate('WbtbSession', { sessionId: session.id });

  if (session.status === 'active') {
    return (
      <Card style={styles.card}>
        <Eyebrow label="In progress" />
        <Text style={[typography.heading, styles.title]}>Your session is waiting</Text>
        <Button label="Resume session" onPress={openSession} />
      </Card>
    );
  }

  const wakeAt = new Date(session.wake_at);
  if (wakeAt <= now) {
    return (
      <Card style={styles.card}>
        <Eyebrow label="Alarm" />
        <Text style={[typography.heading, styles.title]}>Your wake window is open</Text>
        <Button label="Begin session" onPress={openSession} />
      </Card>
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
    <Card style={styles.card}>
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
              },
            })
          }
          style={styles.flex}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  loadingCard: {
    height: 164,
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
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
});
