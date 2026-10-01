import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Circle, CircleCheck, Lock } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle as SvgCircle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CrossFade } from '../../components/CrossFade';
import { GlassBackButton } from '../../components/GlassBackButton';
import { NightSky } from '../../components/NightSky';
import { PopIn } from '../../components/PopIn';
import { ProgressBar } from '../../components/ProgressBar';
import { useAuth } from '../../hooks/useAuth';
import { useBeginnerTrack } from '../../hooks/useBeginnerTrack';
import {
  getTrackDay,
  isSetupConfigured,
  PHASE_LABELS,
  SETUP_ACTIONS,
  TRACK_DAYS,
  TRACK_LENGTH,
  TrackSetup,
} from '../../lib/beginnerTrack';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'BeginnerTrack'>;

// Whether the configuration today's task asks for is already saved. null while it is being
// checked (and when the day needs nothing). Re-checked every time this screen regains focus,
// which is what happens when the setup sheet it opened closes.
function useSetupConfigured(setup: TrackSetup | undefined) {
  const { user } = useAuth();
  const [configured, setConfigured] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!setup || !user) return;
      let ignore = false;
      isSetupConfigured(setup, user.id)
        .then((value) => {
          if (!ignore) setConfigured(value);
        })
        .catch(() => {
          if (!ignore) setConfigured(false);
        });
      return () => {
        ignore = true;
      };
    }, [setup, user])
  );

  return setup ? configured : null;
}

// Hand-placed dots in the sky's lower half: [x, y, radius, opacity] in a 375x440 box.
const GLOW_BOX = { w: 375, h: 440 };
const CLUSTER: readonly (readonly [number, number, number, number])[] = [
  [58, 120, 1.4, 0.5],
  [92, 168, 1, 0.35],
  [140, 96, 1.8, 0.6],
  [176, 140, 1.1, 0.4],
  [214, 82, 1.3, 0.45],
  [252, 128, 1.9, 0.65],
  [286, 70, 1, 0.35],
  [318, 150, 1.5, 0.5],
  [338, 98, 1.1, 0.4],
  [120, 238, 1.2, 0.4],
  [196, 214, 1.6, 0.55],
  [268, 244, 1.1, 0.4],
  [74, 286, 1.7, 0.5],
  [232, 310, 1.2, 0.35],
  [322, 276, 1.4, 0.45],
  [150, 346, 1, 0.3],
];

// A soft blue glow rising from the bottom edge and a loose cluster of stars, so the empty
// lower half of the intro reads as sky, not a void. Static and non-interactive.
function LowerSky() {
  return (
    <Svg
      width="100%"
      height="55%"
      viewBox={`0 0 ${GLOW_BOX.w} ${GLOW_BOX.h}`}
      preserveAspectRatio="xMidYMax slice"
      style={styles.lowerSky}
    >
      <Defs>
        <RadialGradient id="trackGlow" cx="50%" cy="100%" r="75%">
          <Stop offset="0" stopColor={colors.accent.primary} stopOpacity={0.2} />
          <Stop offset="0.5" stopColor={colors.accent.primary} stopOpacity={0.07} />
          <Stop offset="1" stopColor={colors.accent.primary} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={GLOW_BOX.w} height={GLOW_BOX.h} fill="url(#trackGlow)" />
      {CLUSTER.map(([x, y, r, opacity]) => (
        <SvgCircle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={colors.text.primary} opacity={opacity} />
      ))}
    </Svg>
  );
}

export function BeginnerTrackScreen({ navigation }: Props) {
  const { startedAt, currentDay, completedDays, isLoading, error, start, toggleDay } = useBeginnerTrack();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // The sky bleeds edge to edge, so both safe-area insets are added by hand.
  const insets = useSafeAreaInsets();

  const handleStart = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await start();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleToday = async () => {
    if (!currentDay) return;
    setBusy(true);
    setActionError(null);
    try {
      await toggleDay(currentDay);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const todaysTask = currentDay ? getTrackDay(currentDay) : null;
  const setupConfigured = useSetupConfigured(todaysTask?.setup);
  const isTodayDone = currentDay ? completedDays.has(currentDay) : false;
  const progress = completedDays.size / TRACK_LENGTH;
  const allDone = completedDays.size >= TRACK_LENGTH;

  return (
    <View style={styles.root}>
      <NightSky intensity="full" style={styles.sky}>
        {!isLoading && !startedAt ? <LowerSky /> : null}
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.barRow}>
            <GlassBackButton onPress={() => navigation.goBack()} accessibilityLabel="Back" />
            {/* Centred on the screen, not on what is left beside the back button. */}
            <View style={styles.labelWrap}>
              <Text style={[typography.label, styles.eyebrow]}>30-Day Track</Text>
            </View>
          </View>
        </View>

        <Text style={[typography.heroTitle, styles.title]}>Your first lucid dream</Text>

        {isLoading ? null : !startedAt ? (
          <Arrive style={styles.intro}>
            <View style={styles.introCard}>
              <Text style={[typography.body, styles.introBody]}>
                A day-by-day program: reality checks first, then journaling habits, then Wake Back to
                Bed, then MILD, building one on top of the last.
              </Text>
            </View>
            {actionError ? (
              <Arrive from="down">
                <Text style={[typography.label, styles.errorText]}>{actionError}</Text>
              </Arrive>
            ) : null}
            <Button
              label="Start the track"
              labelColor={colors.text.primary}
              onPress={handleStart}
              loading={busy}
              style={styles.startButton}
            />
          </Arrive>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.progressSection}>
              <View style={styles.progressHeaderRow}>
                <Text style={[typography.label, styles.progressLabel]}>Day {currentDay} of {TRACK_LENGTH}</Text>
                <Text style={[typography.label, styles.progressLabel]}>
                  {completedDays.size}/{TRACK_LENGTH} complete
                </Text>
              </View>
              <ProgressBar progress={progress} color={colors.accent.primary} trackColor={colors.surface.track} />
            </View>

            {allDone ? (
              <Arrive>
                <Card style={styles.bannerCard}>
                  <Text style={[typography.body, styles.bannerText]}>
                    You&apos;ve completed the 30-day track. These habits are yours to keep.
                  </Text>
                </Card>
              </Arrive>
            ) : null}

            {todaysTask ? (
              <Arrive delay={40}>
                <Card style={styles.todayCard}>
                  <Text style={[typography.label, styles.todayEyebrow]}>{PHASE_LABELS[todaysTask.phase]}</Text>
                  <Text style={[typography.heading, styles.todayTitle]}>{todaysTask.title}</Text>
                  <Text style={[typography.body, styles.todayBody]}>{todaysTask.description}</Text>
                  {actionError ? (
                    <Arrive from="down">
                      <Text style={[typography.label, styles.errorText]}>{actionError}</Text>
                    </Arrive>
                  ) : null}
                  <CrossFade
                    contentKey={
                      isTodayDone ? 'done' : todaysTask.setup && setupConfigured !== true ? `setup-${setupConfigured}` : 'pending'
                    }
                  >
                    {isTodayDone ? (
                      <View style={styles.doneRow}>
                        <PopIn>
                          <CircleCheck color={colors.status.lucid} size={20} strokeWidth={1.5} />
                        </PopIn>
                        <Text style={[typography.bodyMedium, styles.doneText]}>Completed today</Text>
                        <AnimatedPressable onPress={handleToggleToday} hitSlop={10} disabled={busy}>
                          <Text style={[typography.label, styles.undoLink]}>Undo</Text>
                        </AnimatedPressable>
                      </View>
                    ) : todaysTask.setup && setupConfigured === null ? (
                      // Still checking whether it is already set up; hold the button's space.
                      <View style={styles.actionPlaceholder} />
                    ) : todaysTask.setup && !setupConfigured ? (
                      // Needs configuring first: the sheet opens over this screen, and
                      // completing the day only becomes the main action once it is saved.
                      <View style={styles.setupActions}>
                        <Button
                          label={SETUP_ACTIONS[todaysTask.setup].label}
                          labelColor={colors.text.primary}
                          onPress={() => navigation.navigate(SETUP_ACTIONS[todaysTask.setup!].route)}
                          style={styles.fullWidthButton}
                        />
                        <Button
                          label="Mark complete without setting up"
                          variant="ghost"
                          size="sm"
                          onPress={handleToggleToday}
                          loading={busy}
                          style={styles.skipSetup}
                        />
                      </View>
                    ) : (
                      <Button
                        label="Mark day complete"
                        labelColor={colors.text.primary}
                        onPress={handleToggleToday}
                        loading={busy}
                        style={styles.fullWidthButton}
                      />
                    )}
                  </CrossFade>
                </Card>
              </Arrive>
            ) : null}

            <View style={styles.list}>
              {TRACK_DAYS.map((trackDay, index) => (
                <Arrive key={trackDay.day} delay={Math.min(index, 10) * 25}>
                  <DayRow
                    day={trackDay.day}
                    title={trackDay.title}
                    isCurrent={trackDay.day === currentDay}
                    isDone={completedDays.has(trackDay.day)}
                    isFuture={currentDay !== null && trackDay.day > currentDay}
                  />
                </Arrive>
              ))}
            </View>
          </ScrollView>
        )}

        {error ? (
          <Arrive from="down" style={[styles.footerError, { paddingBottom: spacing.sm + insets.bottom }]}>
            <Text style={[typography.label, styles.errorText]}>{error}</Text>
          </Arrive>
        ) : null}
      </NightSky>
    </View>
  );
}

function DayRow({
  day,
  title,
  isCurrent,
  isDone,
  isFuture,
}: {
  day: number;
  title: string;
  isCurrent: boolean;
  isDone: boolean;
  isFuture: boolean;
}) {
  const Icon = isDone ? CircleCheck : isFuture ? Lock : Circle;
  const iconColor = isDone ? colors.status.lucid : isCurrent ? colors.accent.primary : colors.text.tertiary;

  return (
    <View style={[styles.dayRow, isCurrent && styles.dayRowCurrent, isFuture && styles.dayRowFuture]}>
      <Icon color={iconColor} size={18} strokeWidth={1.5} />
      <Text style={[typography.label, styles.dayNumber, isFuture && styles.dayTextFuture]}>{day}</Text>
      <Text
        style={[typography.bodyMedium, styles.dayTitle, isFuture && styles.dayTextFuture]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {isCurrent ? (
        <View style={styles.todayBadge}>
          <Text style={[typography.caption, styles.todayBadgeText]}>Today</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  sky: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.screenPadding,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Spans the row and centres the label on it; the back button sits on top at the left.
  labelWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  eyebrow: {
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text.primary,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.screenPadding,
  },
  intro: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  // Plain translucent glass: no border, shadow or elevation.
  introCard: {
    padding: spacing.lg,
    borderRadius: radius.glass,
    backgroundColor: colors.surface.glassSoft,
  },
  introBody: {
    color: colors.text.secondary,
  },
  startButton: {
    alignSelf: 'stretch',
  },
  lowerSky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  actionPlaceholder: {
    height: 52,
  },
  setupActions: {
    gap: spacing.xs,
  },
  fullWidthButton: {
    alignSelf: 'stretch',
  },
  skipSetup: {
    alignSelf: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  progressSection: {
    gap: spacing.xs,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: colors.text.secondary,
  },
  bannerCard: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.glassSoft,
    borderRadius: radius.glass,
  },
  bannerText: {
    color: colors.text.primary,
  },
  todayCard: {
    gap: spacing.xs,
    backgroundColor: colors.surface.glassSoft,
    borderRadius: radius.glass,
  },
  todayEyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayTitle: {
    color: colors.text.primary,
    marginTop: spacing.xs / 2,
  },
  todayBody: {
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  doneText: {
    color: colors.status.lucid,
    flex: 1,
  },
  undoLink: {
    color: colors.text.tertiary,
  },
  list: {
    gap: spacing.xs,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.button,
  },
  dayRowCurrent: {
    backgroundColor: 'rgba(108, 142, 255, 0.1)',
  },
  dayRowFuture: {
    opacity: 0.5,
  },
  dayNumber: {
    color: colors.text.tertiary,
    width: 20,
  },
  dayTitle: {
    color: colors.text.primary,
    flex: 1,
  },
  dayTextFuture: {
    color: colors.text.tertiary,
  },
  todayBadge: {
    backgroundColor: 'rgba(108, 142, 255, 0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  todayBadgeText: {
    color: colors.accent.primary,
  },
  errorText: {
    color: colors.status.danger,
  },
  footerError: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
  },
});
