import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Circle, CircleCheck, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CrossFade } from '../../components/CrossFade';
import { PopIn } from '../../components/PopIn';
import { ProgressBar } from '../../components/ProgressBar';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useBeginnerTrack } from '../../hooks/useBeginnerTrack';
import { getTrackDay, PHASE_LABELS, TRACK_DAYS, TRACK_LENGTH } from '../../lib/beginnerTrack';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'BeginnerTrack'>;

export function BeginnerTrackScreen({ navigation }: Props) {
  const { startedAt, currentDay, completedDays, isLoading, error, start, toggleDay } = useBeginnerTrack();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
  const isTodayDone = currentDay ? completedDays.has(currentDay) : false;
  const progress = completedDays.size / TRACK_LENGTH;
  const allDone = completedDays.size >= TRACK_LENGTH;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft color={colors.text.secondary} size={24} strokeWidth={1.5} />
        </AnimatedPressable>
        <View style={styles.headerText}>
          <Text style={[typography.label, styles.eyebrow]}>30-Day Track</Text>
          <Text style={[typography.displayMd, styles.title]}>Your first lucid dream</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? null : !startedAt ? (
        <Arrive style={styles.introWrap}>
          <Card style={styles.introCard} elevated>
            <Text style={[typography.heading, styles.introTitle]}>30 days to your first lucid dream</Text>
            <Text style={[typography.body, styles.introBody]}>
              A day-by-day program: reality checks first, then journaling habits, then Wake Back to
              Bed, then MILD, building one on top of the last.
            </Text>
          </Card>
          {actionError ? (
            <Arrive from="down">
              <Text style={[typography.label, styles.errorText]}>{actionError}</Text>
            </Arrive>
          ) : null}
          <Button label="Start the track" onPress={handleStart} loading={busy} />
        </Arrive>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.progressSection}>
            <View style={styles.progressHeaderRow}>
              <Text style={[typography.label, styles.progressLabel]}>Day {currentDay} of {TRACK_LENGTH}</Text>
              <Text style={[typography.label, styles.progressLabel]}>
                {completedDays.size}/{TRACK_LENGTH} complete
              </Text>
            </View>
            <ProgressBar progress={progress} color={colors.accent.primary} trackColor={colors.surface.card} />
          </View>

          {allDone ? (
            <Arrive>
              <Card style={styles.bannerCard} elevated>
                <Text style={[typography.body, styles.bannerText]}>
                  You&apos;ve completed the 30-day track. These habits are yours to keep.
                </Text>
              </Card>
            </Arrive>
          ) : null}

          {todaysTask ? (
            <Arrive delay={40}>
              <Card style={styles.todayCard} elevated>
                <Text style={[typography.label, styles.todayEyebrow]}>{PHASE_LABELS[todaysTask.phase]}</Text>
                <Text style={[typography.heading, styles.todayTitle]}>{todaysTask.title}</Text>
                <Text style={[typography.body, styles.todayBody]}>{todaysTask.description}</Text>
                {actionError ? (
                  <Arrive from="down">
                    <Text style={[typography.label, styles.errorText]}>{actionError}</Text>
                  </Arrive>
                ) : null}
                <CrossFade contentKey={isTodayDone ? 'done' : 'pending'}>
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
                  ) : (
                    <Button label="Mark day complete" onPress={handleToggleToday} loading={busy} />
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
        <Arrive from="down">
          <Text style={[typography.label, styles.errorText]}>{error}</Text>
        </Arrive>
      ) : null}
    </ScreenContainer>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  headerSpacer: {
    width: 24,
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  introWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  introCard: {
    gap: spacing.sm,
  },
  introTitle: {
    color: colors.text.primary,
  },
  introBody: {
    color: colors.text.secondary,
  },
  scroll: {
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
  },
  bannerText: {
    color: colors.text.primary,
  },
  todayCard: {
    gap: spacing.xs,
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
    borderWidth: 1,
    borderColor: colors.accent.primary,
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
    color: '#F87171',
  },
});
