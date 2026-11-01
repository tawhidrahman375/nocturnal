import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  completeTrackDay,
  currentDayNumber,
  fetchBeginnerTrackProgress,
  fetchTrackCompletions,
  startBeginnerTrack,
  trackDayFor,
  uncompleteTrackDay,
} from '../lib/beginnerTrack';
import { useAuth } from './useAuth';

export function useBeginnerTrack() {
  const { user } = useAuth();
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [completedTodayDay, setCompletedTodayDay] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let ignore = false;

    (async () => {
      try {
        const [progress, completions] = await Promise.all([
          fetchBeginnerTrackProgress(user.id),
          fetchTrackCompletions(user.id),
        ]);
        if (ignore) return;
        setStartedAt(progress?.started_at ?? null);
        setCompletedDays(completions.days);
        setCompletedTodayDay(completions.completedTodayDay);
        setError(null);
      } catch (e) {
        if (!ignore) setError((e as Error).message);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [user]);

  useFocusEffect(load);

  const start = async () => {
    if (!user) return;
    const progress = await startBeginnerTrack(user.id);
    setStartedAt(progress.started_at);
  };

  const toggleDay = async (day: number) => {
    if (!user) return;
    if (completedDays.has(day)) {
      await uncompleteTrackDay(user.id, day);
      setCompletedDays((prev) => {
        const next = new Set(prev);
        next.delete(day);
        return next;
      });
      setCompletedTodayDay((prev) => (prev === day ? null : prev));
    } else {
      await completeTrackDay(user.id, day);
      setCompletedDays((prev) => new Set(prev).add(day));
      setCompletedTodayDay(day);
    }
  };

  const currentDay = startedAt ? trackDayFor(startedAt, completedDays, completedTodayDay) : null;
  // How many calendar days the track is running behind. Never shown as a penalty: it is what
  // lets the screen say "nothing was lost, pick up where you are".
  const daysBehind = startedAt && currentDay ? Math.max(0, currentDayNumber(startedAt) - currentDay) : 0;

  return { startedAt, currentDay, daysBehind, completedDays, isLoading, error, start, toggleDay };
}
