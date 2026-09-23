import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ChipGroup } from '../../components/ChipGroup';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TimeStepper } from '../../components/TimeStepper';
import { useAuth } from '../../hooks/useAuth';
import { useNow } from '../../hooks/useNow';
import { notificationsSupported, requestAlarmPermission } from '../../lib/notifications';
import {
  addMinutes,
  calculateWakeTime,
  DEFAULT_WAKE_WINDOW_MINUTES,
  defaultSleepTime,
  formatDuration,
  formatTime,
  RECOMMENDED_SLEEP_MINUTES,
  SLEEP_DURATION_OPTIONS,
  WAKE_WINDOW_OPTIONS,
} from '../../lib/wbtb';
import { planSession } from '../../lib/wbtbSessions';
import { AppStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'WbtbSetup'>;

type SleepMinutes = (typeof SLEEP_DURATION_OPTIONS)[number];
type WakeWindowMinutes = (typeof WAKE_WINDOW_OPTIONS)[number];

export function WbtbSetupScreen({ navigation, route }: Props) {
  const plan = route.params?.plan;
  const { user } = useAuth();
  const now = useNow(30_000);
  const [sleepAt, setSleepAt] = useState(() =>
    plan ? new Date(plan.sleepAt) : defaultSleepTime(new Date())
  );
  const [sleepMinutes, setSleepMinutes] = useState(
    (plan?.sleepMinutes ?? RECOMMENDED_SLEEP_MINUTES) as SleepMinutes
  );
  const [wakeWindowMinutes, setWakeWindowMinutes] = useState(
    (plan?.wakeWindowMinutes ?? DEFAULT_WAKE_WINDOW_MINUTES) as WakeWindowMinutes
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  const wakeAt = calculateWakeTime(sleepAt, sleepMinutes);
  const backToSleepAt = addMinutes(wakeAt, wakeWindowMinutes);

  const handleSetAlarm = async () => {
    if (!user) return;
    setError(null);
    setPermissionBlocked(false);
    setSaving(true);
    try {
      if (!(await requestAlarmPermission())) {
        setPermissionBlocked(true);
        return;
      }
      await planSession({ userId: user.id, sleepAt, wakeAt, wakeWindowMinutes });
      navigation.goBack();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[typography.label, styles.eyebrow]}>Wake Back To Bed</Text>
          <Text style={[typography.displayMd, styles.title]}>
            {plan ? 'Change your alarm' : 'Plan tonight'}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X color={colors.text.secondary} size={24} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Going to sleep at</Text>
          <TimeStepper
            value={sleepAt}
            onChange={setSleepAt}
            min={addMinutes(now, -120)}
            max={addMinutes(now, 23 * 60)}
          />
        </View>

        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Sleep before waking</Text>
          <ChipGroup
            options={SLEEP_DURATION_OPTIONS}
            value={sleepMinutes}
            onChange={setSleepMinutes}
            format={formatDuration}
          />
          <Text style={[typography.label, styles.caption]}>
            6h is recommended. It lands late in your fourth sleep cycle, when REM periods run
            longest and dreams are easiest to recall.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel]}>Wake window</Text>
          <ChipGroup
            options={WAKE_WINDOW_OPTIONS}
            value={wakeWindowMinutes}
            onChange={setWakeWindowMinutes}
            format={(m) => `${m} min`}
          />
          <Text style={[typography.label, styles.caption]}>
            Long enough to wake your mind, short enough to slip back into REM.
          </Text>
        </View>

        <Card style={styles.timeline}>
          <TimelineRow label="Sleep" time={formatTime(sleepAt)} />
          <TimelineRow label="Alarm" time={formatTime(wakeAt)} highlight />
          <TimelineRow label="Back to sleep" time={`~${formatTime(backToSleepAt)}`} last />
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        {permissionBlocked ? (
          <View style={styles.notice}>
            <Text style={[typography.label, styles.errorText]}>
              Notifications are off, so your alarm can&apos;t ring.
            </Text>
            <Pressable onPress={() => Linking.openSettings()} hitSlop={8}>
              <Text style={[typography.label, styles.link]}>Open settings</Text>
            </Pressable>
          </View>
        ) : null}
        {error ? <Text style={[typography.label, styles.errorText]}>{error}</Text> : null}
        {!notificationsSupported ? (
          <Text style={[typography.label, styles.caption]}>
            Alarms only ring in the iOS and Android apps. Your session will still be saved.
          </Text>
        ) : null}
        <Button
          label={`Set alarm for ${formatTime(wakeAt)}`}
          onPress={handleSetAlarm}
          loading={saving}
        />
      </View>
    </ScreenContainer>
  );
}

function TimelineRow({
  label,
  time,
  highlight,
  last,
}: {
  label: string;
  time: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.dot, highlight && styles.dotHighlight]} />
        {last ? null : <View style={styles.connector} />}
      </View>
      <Text style={[typography.body, highlight ? styles.timelineLabelStrong : styles.timelineLabel]}>
        {label}
      </Text>
      <Text
        style={[
          highlight ? typography.bodyMedium : typography.body,
          highlight ? styles.timelineTimeStrong : styles.timelineTime,
        ]}
      >
        {time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerText: {
    gap: spacing.xs / 2,
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text.primary,
  },
  scroll: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.text.secondary,
  },
  caption: {
    color: colors.text.tertiary,
  },
  timeline: {
    paddingVertical: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  timelineRail: {
    width: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.tertiary,
  },
  dotHighlight: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.primary,
  },
  connector: {
    position: 'absolute',
    top: '50%',
    bottom: '-50%',
    width: 1,
    marginTop: 6,
    backgroundColor: colors.border.default,
  },
  timelineLabel: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.text.secondary,
  },
  timelineLabelStrong: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.text.primary,
  },
  timelineTime: {
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  timelineTimeStrong: {
    color: colors.accent.primary,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  errorText: {
    color: '#F87171',
    flexShrink: 1,
  },
  link: {
    color: colors.accent.primary,
  },
});
