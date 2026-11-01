import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { activePause, endPause, getPauseRanges, PauseRange, startPause } from '../lib/pause';
import { applyRoutineSchedules } from '../lib/routineSchedule';
import { localDateString, refreshStreakForUser } from '../lib/streaks';

// Vacation mode. A pause silences every reminder and makes its days free for the streak;
// when it ends (on its own at the end date, or early by hand) everything switches back on.
export function usePause() {
  const { user } = useAuth();
  const [ranges, setRanges] = useState<PauseRange[]>([]);

  const load = useCallback(() => {
    if (!user) return;
    let ignore = false;
    getPauseRanges(user.id).then((loaded) => {
      if (ignore) return;
      setRanges(loaded);
      // A pause that ran out while the app was closed: bring the reminders back now.
      const wasPaused = loaded.some((range) => range.end === localDateString(new Date(Date.now() - 86_400_000)));
      if (wasPaused && !activePause(loaded, localDateString(new Date()))) {
        applyRoutineSchedules(user.id).catch(() => {});
      }
    });
    return () => {
      ignore = true;
    };
  }, [user]);

  useFocusEffect(load);

  const apply = async (userId: string) => {
    setRanges(await getPauseRanges(userId));
    await Promise.all([applyRoutineSchedules(userId), refreshStreakForUser(userId)]).catch(() => {});
  };

  const pause = async (days: number) => {
    if (!user) return;
    await startPause(user.id, days, localDateString(new Date()));
    await apply(user.id);
  };

  const resume = async () => {
    if (!user) return;
    await endPause(user.id, localDateString(new Date()));
    await apply(user.id);
  };

  return { ranges, active: activePause(ranges, localDateString(new Date())), pause, resume };
}
