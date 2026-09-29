import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { ChipGroup } from '../../components/ChipGroup';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useWbtbDefaults } from '../../hooks/useWbtbDefaults';
import {
  DEFAULT_WAKE_WINDOW_MINUTES,
  formatDuration,
  RECOMMENDED_SLEEP_MINUTES,
  SLEEP_DURATION_OPTIONS,
  WAKE_WINDOW_OPTIONS,
  WBTB_DEFAULTS_SLEEP_MINUTES,
} from '../../lib/wbtb';
import { AppStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'WbtbDefaults'>;
type SleepMinutes = (typeof SLEEP_DURATION_OPTIONS)[number];
type WakeWindowMinutes = (typeof WAKE_WINDOW_OPTIONS)[number];

export function WbtbDefaultsScreen({ navigation }: Props) {
  const { defaults, isLoading, save } = useWbtbDefaults();

  const [hasHydrated, setHasHydrated] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState(WBTB_DEFAULTS_SLEEP_MINUTES as SleepMinutes);
  const [wakeWindowMinutes, setWakeWindowMinutes] = useState(
    DEFAULT_WAKE_WINDOW_MINUTES as WakeWindowMinutes
  );

  if (!isLoading && !hasHydrated) {
    setHasHydrated(true);
    if (defaults) {
      setSleepMinutes(defaults.sleep_duration_minutes as SleepMinutes);
      setWakeWindowMinutes(defaults.wake_window_minutes as WakeWindowMinutes);
    }
  }

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await save({ sleep_duration_minutes: sleepMinutes, wake_window_minutes: wakeWindowMinutes });
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
          <Text style={[typography.displayMd, styles.title]}>Defaults</Text>
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
          <View style={styles.section}>
            <Text style={[typography.label, styles.sectionLabel]}>Sleep before waking</Text>
            <ChipGroup
              options={SLEEP_DURATION_OPTIONS}
              value={sleepMinutes}
              onChange={setSleepMinutes}
              format={formatDuration}
            />
            <Text style={[typography.label, styles.caption]}>
              {formatDuration(RECOMMENDED_SLEEP_MINUTES)} is recommended. It lands late in your fourth
              sleep cycle, when REM periods run longest and dreams are easiest to recall.
            </Text>
          </View>
        </Arrive>

        <Arrive delay={50}>
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

        <Arrive delay={90}>
          <Text style={[typography.label, styles.caption]}>
            These are just your starting point — every time you plan a WBTB session you can still
            change them for that night only.
          </Text>
        </Arrive>
      </ScrollView>

      <View style={styles.footer}>
        {error ? (
          <Arrive from="down">
            <Text style={[typography.label, styles.errorText]}>{error}</Text>
          </Arrive>
        ) : null}
        <Button label="Save defaults" onPress={handleSave} loading={saving} />
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
  errorText: {
    color: '#F87171',
  },
});
