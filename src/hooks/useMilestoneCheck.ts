import { useCallback, useRef, useState } from 'react';
import {
  getLastCelebratedStreakMilestone,
  isFirstLucidDream,
  setLastCelebratedStreakMilestone,
} from '../lib/milestones';

export type MilestoneType = 'firstLucidDream' | 'streak7' | 'firstInsight';

// Owns "which milestone overlay (if any) should be showing right now" for whichever
// screen calls it. Each call site gets its own independent instance on purpose — a
// milestone always celebrates in response to something that just happened on THAT
// screen, so there's no need for a shared/global celebration store.
export function useMilestoneCheck() {
  const [milestone, setMilestone] = useState<MilestoneType | null>(null);
  // Avoids re-reading AsyncStorage for a streak value already ruled out earlier in the
  // same session; setLastCelebratedStreakMilestone is still the source of truth across
  // app restarts.
  const sessionHighWaterMarkRef = useRef(0);

  const checkLucidDreamMilestone = useCallback(async (userId: string) => {
    if (await isFirstLucidDream(userId)) setMilestone('firstLucidDream');
  }, []);

  const checkStreakMilestone = useCallback(async (userId: string, currentStreak: number | null | undefined) => {
    if (!currentStreak || currentStreak <= 0 || currentStreak % 7 !== 0) return;
    if (currentStreak <= sessionHighWaterMarkRef.current) return;

    const lastCelebrated = await getLastCelebratedStreakMilestone(userId);
    if (currentStreak <= lastCelebrated) {
      sessionHighWaterMarkRef.current = lastCelebrated;
      return;
    }

    sessionHighWaterMarkRef.current = currentStreak;
    await setLastCelebratedStreakMilestone(userId, currentStreak);
    setMilestone('streak7');
  }, []);

  const triggerFirstInsightMilestone = useCallback(() => setMilestone('firstInsight'), []);

  const dismissMilestone = useCallback(() => setMilestone(null), []);

  return {
    milestone,
    checkLucidDreamMilestone,
    checkStreakMilestone,
    triggerFirstInsightMilestone,
    dismissMilestone,
  };
}
