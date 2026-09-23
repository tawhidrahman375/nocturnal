import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  completeTrackDay,
  currentDayNumber,
  fetchBeginnerTrackProgress,
  fetchCompletedDays,
  startBeginnerTrack,
  uncompleteTrackDay,
} from '../lib/beginnerTrack';
import { useAuth } from './useAuth';

export function useBeginnerTrack() {
  const { user } = useAuth();
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
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
        const [progress, days] = await Promise.all([
          fetchBeginnerTrackProgress(user.id),
          fetchCompletedDays(user.id),
        ]);
        if (ignore) return;
        setStartedAt(progress?.started_at ?? null);
        setCompletedDays(days);
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
    } else {
      await completeTrackDay(user.id, day);
      setCompletedDays((prev) => new Set(prev).add(day));
    }
  };

  const currentDay = startedAt ? currentDayNumber(startedAt) : null;

  return { startedAt, currentDay, completedDays, isLoading, error, start, toggleDay };
}
