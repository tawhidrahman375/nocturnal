import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Eye, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ChipGroup } from '../../components/ChipGroup';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TimeStepper } from '../../components/TimeStepper';
import { useDreamSigns } from '../../hooks/useDreamSigns';
import { useRealityCheckSettings } from '../../hooks/useRealityCheckSettings';
import { notificationsSupported, requestRealityCheckPermission } from '../../lib/notifications';
import {
  computeSlotMinutes,
  DEFAULT_ACTIVE_END_MINUTES,
  DEFAULT_ACTIVE_START_MINUTES,
  DEFAULT_FREQUENCY_MINUTES,
  FREQUENCY_OPTIONS,
  minutesSinceMidnight,
  timeOfDayFromMinutes,
} from '../../lib/realityChecks';
import { addMinutes, formatDuration, formatTime } from '../../lib/wbtb';
import { AppStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'RealityCheckSetup'>;
type FrequencyMinutes = (typeof FREQUENCY_OPTIONS)[number];

export function RealityCheckSetupScreen({ navigation }: Props) {
  const { settings, isLoading: settingsLoading, save } = useRealityCheckSettings();
  const { dreamSigns } = useDreamSigns();
  const referenceDate = useMemo(() => new Date(), []);

  const [hasHydrated, setHasHydrated] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [frequencyMinutes, setFrequencyMinutes] = useState(
    DEFAULT_FREQUENCY_MINUTES as FrequencyMinutes
  );
  const [activeStart, setActiveStart] = useState(() =>
    timeOfDayFromMinutes(DEFAULT_ACTIVE_START_MINUTES, referenceDate)
  );
  const [activeEnd, setActiveEnd] = useState(() =>
    timeOfDayFromMinutes(DEFAULT_ACTIVE_END_MINUTES, referenceDate)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  // Adjust state during render (React's documented escape hatch) rather than in an effect,
  // so the saved schedule replaces the defaults before the first paint instead of after it.
  if (!settingsLoading && !hasHydrated) {
    setHasHydrated(true);
    if (settings) {
      setEnabled(settings.enabled);
      setFrequencyMinutes(settings.frequency_minutes as FrequencyMinutes);
      setActiveStart(timeOfDayFromMinutes(settings.active_start_minutes, referenceDate));
      setActiveEnd(timeOfDayFromMinutes(settings.active_end_minutes, referenceDate));
    }
  }

  const dayStart = useMemo(() => timeOfDayFromMinutes(0, referenceDate), [referenceDate]);
  const dayEnd = useMemo(() => timeOfDayFromMinutes(23 * 60 + 45, referenceDate), [referenceDate]);

  const slotTimes = computeSlotMinutes(
    minutesSinceMidnight(activeStart),
    minutesSinceMidnight(activeEnd),
    frequencyMinutes
  ).map((minute) => formatTime(timeOfDayFromMinutes(minute, referenceDate)));

  const handleSave = async () => {
    setError(null);
    setPermissionBlocked(false);
    setSaving(true);
    try {
      if (enabled && !(await requestRealityCheckPermission())) {
        setPermissionBlocked(true);
        return;
      }
      await save(
        {
          enabled,
          frequency_minutes: frequencyMinutes,
          active_start_minutes: minutesSinceMidnight(activeStart),
          active_end_minutes: minutesSinceMidnight(activeEnd),
        },
        dreamSigns
      );
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
          <Text style={[typography.label, styles.eyebrow]}>Reality checks</Text>
          <Text style={[typography.displayMd, styles.title]}>Stay aware</Text>
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
        <Card style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <View style={styles.toggleTitleRow}>
                <Eye color={colors.accent.primary} size={18} strokeWidth={1.5} />
                <Text style={[typography.bodyMedium, styles.toggleTitle]}>Reminders</Text>
              </View>
              <Text style={[typography.body, styles.toggleBody]}>
                Nudges throughout the day to question whether you&apos;re awake.
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: colors.border.default, true: colors.accent.primary }}
              thumbColor={colors.text.primary}
            />
          </View>
        </Card>

        <View style={[styles.section, !enabled && styles.dimmed]} pointerEvents={enabled ? 'auto' : 'none'}>
          <Text style={[typography.label, styles.sectionLabel]}>How often</Text>
          <ChipGroup
            options={FREQUENCY_OPTIONS}
            value={frequencyMinutes}
            onChange={setFrequencyMinutes}
            format={formatDuration}
          />
        </View>

        <View style={[styles.section, !enabled && styles.dimmed]} pointerEvents={enabled ? 'auto' : 'none'}>
          <Text style={[typography.label, styles.sectionLabel]}>Active from</Text>
          <TimeStepper
            value={activeStart}
            onChange={setActiveStart}
            min={dayStart}
            max={addMinutes(activeEnd, -15)}
          />
        </View>

        <View style={[styles.section, !enabled && styles.dimmed]} pointerEvents={enabled ? 'auto' : 'none'}>
          <Text style={[typography.label, styles.sectionLabel]}>Until</Text>
          <TimeStepper
            value={activeEnd}
            onChange={setActiveEnd}
            min={addMinutes(activeStart, 15)}
            max={dayEnd}
          />
        </View>

        <Card style={StyleSheet.flatten([styles.previewCard, !enabled && styles.dimmed])}>
          <Text style={[typography.label, styles.previewLabel]}>Today&apos;s reminders</Text>
          <Text style={[typography.body, styles.previewBody]}>{slotTimes.join(' · ')}</Text>
        </Card>

        <Card style={styles.previewCard} elevated>
          <Text style={[typography.label, styles.previewLabel]}>Your dream signs</Text>
          {dreamSigns.length > 0 ? (
            <Text style={[typography.body, styles.previewBody]}>{dreamSigns.join(', ')}</Text>
          ) : (
            <Text style={[typography.body, styles.previewBody]}>
              Add dream signs when you log a dream in your Journal, and reminders will start
              referencing them instead of generic prompts.
            </Text>
          )}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        {permissionBlocked ? (
          <View style={styles.notice}>
            <Text style={[typography.label, styles.errorText]}>
              Notifications are off, so reminders can&apos;t reach you.
            </Text>
            <Pressable onPress={() => Linking.openSettings()} hitSlop={8}>
              <Text style={[typography.label, styles.link]}>Open settings</Text>
            </Pressable>
          </View>
        ) : null}
        {error ? <Text style={[typography.label, styles.errorText]}>{error}</Text> : null}
        {!notificationsSupported ? (
          <Text style={[typography.label, styles.caption]}>
            Reminders only ring in the iOS and Android apps. Your schedule will still be saved.
          </Text>
        ) : null}
        <Button label="Save schedule" onPress={handleSave} loading={saving} />
      </View>
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
  dimmed: {
    opacity: 0.45,
  },
  sectionLabel: {
    color: colors.text.secondary,
  },
  caption: {
    color: colors.text.tertiary,
  },
  previewCard: {
    gap: spacing.xs,
  },
  previewLabel: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewBody: {
    color: colors.text.secondary,
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

