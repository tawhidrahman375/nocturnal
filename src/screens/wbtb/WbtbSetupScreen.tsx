import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Moon, X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ChipGroup } from '../../components/ChipGroup';
import { Panel } from '../../components/Panel';
import { PrePermissionModal } from '../../components/PrePermissionModal';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TimeStepper } from '../../components/TimeStepper';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { useNow } from '../../hooks/useNow';
import { usePrePermissionGate } from '../../hooks/usePrePermissionGate';
import { useProfile } from '../../hooks/useProfile';
import { useWbtbDefaults } from '../../hooks/useWbtbDefaults';
import { notificationsSupported, requestAlarmPermission } from '../../lib/notifications';
import { timeOfDayFromMinutes } from '../../lib/realityChecks';
import {
  addMinutes,
  calculateWakeTime,
  DEFAULT_WAKE_WINDOW_MINUTES,
  defaultSleepTime,
  formatDuration,
  formatTime,
  RECOMMENDED_SLEEP_MINUTES,
  SLEEP_DURATION_OPTIONS,
  TECHNIQUE_DESCRIPTIONS,
  TECHNIQUE_LABELS,
  TECHNIQUE_OPTIONS,
  WAKE_WINDOW_OPTIONS,
  WbtbTechnique,
} from '../../lib/wbtb';
import { planSession } from '../../lib/wbtbSessions';
import { AppStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

const MINUTES_PER_DAY = 24 * 60;

type Props = NativeStackScreenProps<AppStackParamList, 'WbtbSetup'>;

type SleepMinutes = (typeof SLEEP_DURATION_OPTIONS)[number];
type WakeWindowMinutes = (typeof WAKE_WINDOW_OPTIONS)[number];

export function WbtbSetupScreen({ navigation, route }: Props) {
  const plan = route.params?.plan;
  const { user } = useAuth();
  const { profile } = useProfile();
  const { defaults: wbtbDefaults } = useWbtbDefaults();
  const { settings: notificationSettings } = useNotificationSettings();
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
  const [technique, setTechnique] = useState<WbtbTechnique>(plan?.technique ?? 'mild');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const alarmPermission = usePrePermissionGate('wbtb-alarm', requestAlarmPermission);
  const [hasAppliedNaturalWakeTime, setHasAppliedNaturalWakeTime] = useState(false);
  // Same "adjust during render" pattern as the natural-wake-time hydration below: once
  // per fresh (non-`plan`) open, replace the RECOMMENDED_SLEEP_MINUTES/
  // DEFAULT_WAKE_WINDOW_MINUTES constants with whatever the user saved on
  // WbtbDefaultsScreen, before this screen's first paint.
  const [hasAppliedWbtbDefaults, setHasAppliedWbtbDefaults] = useState(false);
  if (!plan && !hasAppliedWbtbDefaults && wbtbDefaults) {
    setHasAppliedWbtbDefaults(true);
    setSleepMinutes(wbtbDefaults.sleep_duration_minutes as SleepMinutes);
    setWakeWindowMinutes(wbtbDefaults.wake_window_minutes as WakeWindowMinutes);
  }
  const alarmEnabled = notificationSettings?.wbtb_alarm_enabled ?? true;
  // ScreenContainer only reserves the top safe-area inset here (edges={['top']}), so
  // the Panel — and the fixed footer living inside it — can bleed to the literal
  // screen bottom per DESIGN.md §4; the bottom inset is added to the footer by hand.
  const insets = useSafeAreaInsets();

  // Defaults the bedtime picker so the alarm lands on the user's own natural wake
  // time (from onboarding) instead of the generic "round up from now" default —
  // but only on first open of a fresh plan, and only once, so a later profile
  // refetch (useProfile reconciles on every focus) can't clobber a manual edit.
  // Adjusted during render (React's documented escape hatch, already used the same
  // way in RealityCheckSetupScreen) rather than in an effect, so the default lands
  // before the first paint instead of after it.
  if (!plan && !hasAppliedNaturalWakeTime && profile?.natural_wake_time != null) {
    setHasAppliedNaturalWakeTime(true);
    const bedtimeMinutes =
      ((profile.natural_wake_time - RECOMMENDED_SLEEP_MINUTES) % MINUTES_PER_DAY + MINUTES_PER_DAY) %
      MINUTES_PER_DAY;
    setSleepAt(timeOfDayFromMinutes(bedtimeMinutes, new Date()));
  }

  const wakeAt = calculateWakeTime(sleepAt, sleepMinutes);
  const backToSleepAt = addMinutes(wakeAt, wakeWindowMinutes);

  const handleSetAlarm = async () => {
    if (!user) return;
    setError(null);
    setPermissionBlocked(false);
    setSaving(true);
    try {
      if (alarmEnabled && !(await alarmPermission.requestWithGate())) {
        setPermissionBlocked(true);
        return;
      }
      await planSession({ userId: user.id, sleepAt, wakeAt, wakeWindowMinutes, technique, alarmEnabled });
      navigation.goBack();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer edges={['top']} edgeToEdge>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[typography.label, styles.eyebrow]}>Wake Back To Bed</Text>
          <Text style={[typography.displayMd, styles.title]}>
            {plan ? 'Change your alarm' : 'Plan tonight'}
          </Text>
        </View>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X color={colors.text.secondary} size={24} strokeWidth={1.5} />
        </AnimatedPressable>
      </View>

      <Panel>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Arrive>
            <View style={styles.section}>
              <Text style={[typography.label, styles.sectionLabel]}>Going to sleep at</Text>
              <TimeStepper
                value={sleepAt}
                onChange={setSleepAt}
                min={addMinutes(now, -120)}
                max={addMinutes(now, 23 * 60)}
              />
            </View>
          </Arrive>

          <Arrive delay={50}>
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
          </Arrive>

          <Arrive delay={100}>
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
          </Arrive>

          <Arrive delay={150}>
            <View style={styles.section}>
              <Text style={[typography.label, styles.sectionLabel]}>Technique</Text>
              <ChipGroup
                options={TECHNIQUE_OPTIONS}
                value={technique}
                onChange={setTechnique}
                format={(t) => TECHNIQUE_LABELS[t]}
              />
              <Text style={[typography.label, styles.caption]}>{TECHNIQUE_DESCRIPTIONS[technique]}</Text>
            </View>
          </Arrive>

          <Arrive delay={200}>
            <Card style={styles.timeline}>
              <TimelineRow label="Sleep" time={formatTime(sleepAt)} />
              <TimelineRow label="Alarm" time={formatTime(wakeAt)} highlight />
              <TimelineRow label="Back to sleep" time={`~${formatTime(backToSleepAt)}`} last />
            </Card>
          </Arrive>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
          {permissionBlocked ? (
            <Arrive from="down" style={styles.notice}>
              <Text style={[typography.label, styles.errorText]}>
                Notifications are off, so your alarm can&apos;t ring.
              </Text>
              <AnimatedPressable onPress={() => Linking.openSettings()} hitSlop={8}>
                <Text style={[typography.label, styles.link]}>Open settings</Text>
              </AnimatedPressable>
            </Arrive>
          ) : null}
          {error ? (
            <Arrive from="down">
              <Text style={[typography.label, styles.errorText]}>{error}</Text>
            </Arrive>
          ) : null}
          {!notificationsSupported ? (
            <Text style={[typography.label, styles.caption]}>
              Alarms only ring in the iOS and Android apps. Your session will still be saved.
            </Text>
          ) : !alarmEnabled ? (
            <Text style={[typography.label, styles.caption]}>
              Your WBTB alarm is off in Notification settings — this session will save without one.
            </Text>
          ) : null}
          <Button
            label={`Set alarm for ${formatTime(wakeAt)}`}
            onPress={handleSetAlarm}
            loading={saving}
          />
        </View>
      </Panel>

      <PrePermissionModal
        visible={alarmPermission.visible}
        icon={Moon}
        headline="WBTB only works if the alarm actually wakes you"
        body="Your WBTB alarm needs to break through Do Not Disturb and sleep mode. Allow this so Nocturnal can wake you at exactly the right moment in your sleep cycle."
        ctaLabel="Allow Alarm"
        onAllow={alarmPermission.handleAllow}
        onDismiss={alarmPermission.handleDismiss}
      />
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
      <Text
        style={[
          highlight ? typography.bodyMedium : typography.body,
          highlight ? styles.timelineLabelStrong : styles.timelineLabel,
        ]}
      >
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
    paddingHorizontal: spacing.screenPadding,
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
    paddingHorizontal: spacing.screenPadding,
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
    paddingHorizontal: spacing.screenPadding,
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
