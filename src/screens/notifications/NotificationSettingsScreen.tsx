import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AlarmClock, Eye, LucideIcon, Mic, Moon, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PrePermissionModal } from '../../components/PrePermissionModal';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TimeStepper } from '../../components/TimeStepper';
import { useDreamSigns } from '../../hooks/useDreamSigns';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { usePrePermissionGate } from '../../hooks/usePrePermissionGate';
import { useProfile } from '../../hooks/useProfile';
import { useRealityCheckSettings } from '../../hooks/useRealityCheckSettings';
import { bedtimeMinutesFor } from '../../lib/mildPromptSchedule';
import {
  notificationsSupported,
  requestAlarmPermission,
  requestMildPromptPermission,
  requestRealityCheckPermission,
} from '../../lib/notifications';
import {
  hideQuickRecordNotification,
  isQuickRecordEnabled,
  quickRecordSupported,
  requestQuickRecordPermission,
  setQuickRecordEnabled,
  showQuickRecordNotification,
} from '../../lib/quickRecord';
import { minutesSinceMidnight, timeOfDayFromMinutes } from '../../lib/realityChecks';
import { AppStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'NotificationSettings'>;

function ToggleRow({
  icon: Icon,
  title,
  body,
  value,
  onValueChange,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Card style={styles.toggleCard}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <View style={styles.toggleTitleRow}>
            <Icon color={colors.accent.primary} size={18} strokeWidth={1.5} />
            <Text style={[typography.bodyMedium, styles.toggleTitle]}>{title}</Text>
          </View>
          <Text style={[typography.body, styles.toggleBody]}>{body}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border.default, true: colors.accent.primary }}
          thumbColor={colors.text.primary}
        />
      </View>
    </Card>
  );
}

export function NotificationSettingsScreen({ navigation }: Props) {
  const { profile } = useProfile();
  const { settings, isLoading: settingsLoading, save } = useNotificationSettings();
  const { settings: realityCheckSettings, isLoading: realityCheckLoading, save: saveRealityCheck } =
    useRealityCheckSettings();
  const { dreamSigns } = useDreamSigns();
  const referenceDate = useState(() => new Date())[0];

  const defaultMildPromptTime = timeOfDayFromMinutes(
    bedtimeMinutesFor(profile?.natural_wake_time ?? null),
    referenceDate
  );

  const [hasHydrated, setHasHydrated] = useState(false);
  const [mildPromptEnabled, setMildPromptEnabled] = useState(true);
  const [mildPromptTime, setMildPromptTime] = useState(defaultMildPromptTime);
  const [realityCheckEnabled, setRealityCheckEnabled] = useState(true);
  const [wbtbAlarmEnabled, setWbtbAlarmEnabled] = useState(true);

  const loading = settingsLoading || realityCheckLoading;

  // Adjust during render (the same escape hatch RealityCheckSetupScreen and
  // WbtbSetupScreen use) so saved values replace the defaults before first paint.
  if (!loading && !hasHydrated) {
    setHasHydrated(true);
    if (settings) {
      setMildPromptEnabled(settings.mild_prompt_enabled);
      if (settings.mild_prompt_time_minutes != null) {
        setMildPromptTime(timeOfDayFromMinutes(settings.mild_prompt_time_minutes, referenceDate));
      }
      setWbtbAlarmEnabled(settings.wbtb_alarm_enabled);
    }
    if (realityCheckSettings) {
      setRealityCheckEnabled(realityCheckSettings.enabled);
    }
  }

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const mildPromptPermission = usePrePermissionGate('mild-prompt', requestMildPromptPermission);
  const realityCheckPermission = usePrePermissionGate('reality-check', requestRealityCheckPermission);
  const alarmPermission = usePrePermissionGate('wbtb-alarm', requestAlarmPermission);

  // Android's persistent "Tap to record a dream" notification. Unlike the rest of this screen
  // it applies straight away rather than on Save, and it is remembered on this device only
  // (the notification itself only exists here).
  const [quickRecordEnabled, setQuickRecordEnabledState] = useState(true);
  const quickRecordPermission = usePrePermissionGate('quick-record', requestQuickRecordPermission);
  useEffect(() => {
    if (!quickRecordSupported) return;
    let ignore = false;
    isQuickRecordEnabled().then((enabled) => {
      if (!ignore) setQuickRecordEnabledState(enabled);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const handleQuickRecordToggle = async (value: boolean) => {
    setQuickRecordEnabledState(value);
    await setQuickRecordEnabled(value);
    if (!value) {
      await hideQuickRecordNotification();
      return;
    }
    if (await quickRecordPermission.requestWithGate()) await showQuickRecordNotification();
    else setPermissionBlocked(true);
  };

  const handleSave = async () => {
    setError(null);
    setPermissionBlocked(false);
    setSaving(true);
    try {
      if (mildPromptEnabled && !(await mildPromptPermission.requestWithGate())) {
        setPermissionBlocked(true);
        return;
      }
      if (realityCheckEnabled && !(await realityCheckPermission.requestWithGate())) {
        setPermissionBlocked(true);
        return;
      }
      if (wbtbAlarmEnabled && !(await alarmPermission.requestWithGate())) {
        setPermissionBlocked(true);
        return;
      }

      await save({
        mild_prompt_enabled: mildPromptEnabled,
        mild_prompt_time_minutes: minutesSinceMidnight(mildPromptTime),
        wbtb_alarm_enabled: wbtbAlarmEnabled,
      });
      await saveRealityCheck({ enabled: realityCheckEnabled }, dreamSigns);
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
          <Text style={[typography.label, styles.eyebrow]}>Notifications</Text>
          <Text style={[typography.displayMd, styles.title]}>Stay in the loop</Text>
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Arrive>
          <ToggleRow
            icon={Moon}
            title="Pre-bed MILD prompt"
            body="A nightly nudge to set your dream intention before you fall asleep."
            value={mildPromptEnabled}
            onValueChange={setMildPromptEnabled}
          />
        </Arrive>

        {mildPromptEnabled ? (
          <Arrive delay={40}>
            <View style={styles.section}>
              <Text style={[typography.label, styles.sectionLabel]}>Prompt time</Text>
              <TimeStepper
                value={mildPromptTime}
                onChange={setMildPromptTime}
                min={timeOfDayFromMinutes(0, referenceDate)}
                max={timeOfDayFromMinutes(23 * 60 + 45, referenceDate)}
              />
              <Text style={[typography.label, styles.caption]}>
                Defaults to your bedtime, worked out from your usual wake time.
              </Text>
            </View>
          </Arrive>
        ) : null}

        <Arrive delay={80}>
          <ToggleRow
            icon={Eye}
            title="Reality check reminders"
            body="Nudges throughout the day to question whether you're awake."
            value={realityCheckEnabled}
            onValueChange={setRealityCheckEnabled}
          />
        </Arrive>

        <Arrive delay={120}>
          <ToggleRow
            icon={AlarmClock}
            title="WBTB alarm"
            body="The wake-up alarm for any Wake Back To Bed session you plan."
            value={wbtbAlarmEnabled}
            onValueChange={setWbtbAlarmEnabled}
          />
        </Arrive>

        {quickRecordSupported ? (
          <Arrive delay={160}>
            <ToggleRow
              icon={Mic}
              title="Quick record"
              body="A quiet notification you can tap to record a dream the moment you wake."
              value={quickRecordEnabled}
              onValueChange={handleQuickRecordToggle}
            />
          </Arrive>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {permissionBlocked ? (
          <Arrive from="down" style={styles.notice}>
            <Text style={[typography.label, styles.errorText]}>
              Notifications are off, so reminders can&apos;t reach you.
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
            Reminders only ring in the iOS and Android apps. Your settings will still be saved.
          </Text>
        ) : null}
        <Button label="Save" onPress={handleSave} loading={saving} />
      </View>

      <PrePermissionModal
        visible={mildPromptPermission.visible}
        icon={Moon}
        headline="Your MILD prompt needs to reach you"
        body="Nocturnal sends one reminder a night, timed to your bedtime, to set tonight's dream intention. Allow notifications so it can reach you."
        ctaLabel="Allow Prompt"
        onAllow={mildPromptPermission.handleAllow}
        onDismiss={mildPromptPermission.handleDismiss}
      />
      <PrePermissionModal
        visible={realityCheckPermission.visible}
        icon={Eye}
        headline="Reality checks only work if they surprise you"
        body="Nocturnal sends you reminders throughout the day tied to your actual dream signs, not generic alerts. Allow notifications so we can remind you at the right moments."
        ctaLabel="Allow Reminders"
        onAllow={realityCheckPermission.handleAllow}
        onDismiss={realityCheckPermission.handleDismiss}
      />
      <PrePermissionModal
        visible={alarmPermission.visible}
        icon={Moon}
        headline="WBTB only works if the alarm actually wakes you"
        body="Your WBTB alarm needs to break through Do Not Disturb and sleep mode. Allow this so Nocturnal can wake you at exactly the right moment in your sleep cycle."
        ctaLabel="Allow Alarm"
        onAllow={alarmPermission.handleAllow}
        onDismiss={alarmPermission.handleDismiss}
      />
      <PrePermissionModal
        visible={quickRecordPermission.visible}
        icon={Mic}
        headline="Record a dream before it fades"
        body="Nocturnal keeps one quiet notification in your shade, so you can record a dream the moment you wake, even from the lock screen. Allow notifications to turn it on."
        ctaLabel="Allow Quick Record"
        onAllow={quickRecordPermission.handleAllow}
        onDismiss={quickRecordPermission.handleDismiss}
      />
    </ScreenContainer>
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
  toggleCard: {
    gap: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toggleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleTitle: {
    color: colors.text.primary,
  },
  toggleBody: {
    color: colors.text.secondary,
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
