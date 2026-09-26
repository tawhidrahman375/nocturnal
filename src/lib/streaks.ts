import { supabase } from './supabase';

const MS_PER_DAY = 86_400_000;

// Journal entries store `dreamed_at` as the device's local calendar day, so streaks
// must compare against that same local day rather than the server's UTC "today".
export function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / MS_PER_DAY);
}

export function computeStreaks(dreamedDates: string[], today: Date = new Date()) {
  const uniqueDays = [...new Set(dreamedDates)].sort();
  if (uniqueDays.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let longestStreak = 1;
  let runLength = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    runLength = daysBetween(uniqueDays[i - 1], uniqueDays[i]) === 1 ? runLength + 1 : 1;
    longestStreak = Math.max(longestStreak, runLength);
  }

  const todayStr = localDateString(today);
  const yesterdayStr = localDateString(new Date(today.getTime() - MS_PER_DAY));
  const lastDay = uniqueDays[uniqueDays.length - 1];

  // A missed day (last entry older than yesterday) breaks the streak back to zero.
  let currentStreak = 0;
  if (lastDay === todayStr || lastDay === yesterdayStr) {
    currentStreak = 1;
    for (let i = uniqueDays.length - 1; i > 0; i--) {
      if (daysBetween(uniqueDays[i - 1], uniqueDays[i]) === 1) currentStreak += 1;
      else break;
    }
  }

  return { currentStreak, longestStreak };
}

export const MAX_STREAK_FREEZES = 2;
const INITIAL_STREAK_FREEZES = 1;

function countMondaysBetween(startExclusiveStr: string, endInclusiveStr: string) {
  const totalDays = daysBetween(startExclusiveStr, endInclusiveStr);
  if (totalDays <= 0) return 0;
  const startMs = Date.parse(startExclusiveStr);
  let count = 0;
  for (let offset = 1; offset <= totalDays; offset++) {
    if (new Date(startMs + offset * MS_PER_DAY).getUTCDay() === 1) count += 1;
  }
  return count;
}

// Freeze-aware streak calculation. Dreams are never deleted, so — like computeStreaks —
// this recomputes from full history every call rather than reading back a mutable token
// balance. That's deliberate: it's what makes this safe to call many times a day (every
// screen focus) without double-spending a freeze or double-logging the same gap. The
// weekly token economy (1 at signup, +1 every Monday, capped at 2) is simulated
// chronologically from account creation up to `today`, spending a token on any single
// missed day it can cover along the way; a gap of 2+ missed days always breaks the run.
export function computeStreaksWithFreezes(
  dreamedDates: string[],
  accountCreatedAt: Date,
  today: Date = new Date()
) {
  const uniqueDays = [...new Set(dreamedDates)].sort();
  const todayStr = localDateString(today);

  let freezes = INITIAL_STREAK_FREEZES;
  let cursor = localDateString(accountCreatedAt);
  const replenishThrough = (dateStr: string) => {
    freezes = Math.min(freezes + countMondaysBetween(cursor, dateStr), MAX_STREAK_FREEZES);
    cursor = dateStr;
  };

  if (uniqueDays.length === 0) {
    replenishThrough(todayStr);
    return { currentStreak: 0, longestStreak: 0, freezesRemaining: freezes, freezeUsedForCurrentStreak: false };
  }

  let longestStreak = 1;
  let runLength = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    replenishThrough(uniqueDays[i]);
    const gap = daysBetween(uniqueDays[i - 1], uniqueDays[i]);
    if (gap === 1) {
      runLength += 1;
    } else if (gap === 2 && freezes > 0) {
      freezes -= 1;
      runLength += 1;
    } else {
      runLength = 1;
    }
    longestStreak = Math.max(longestStreak, runLength);
  }

  const lastDay = uniqueDays[uniqueDays.length - 1];
  replenishThrough(todayStr);
  const tailGap = daysBetween(lastDay, todayStr);

  let currentStreak: number;
  let freezeUsedForCurrentStreak = false;
  if (tailGap === 0 || tailGap === 1) {
    currentStreak = runLength;
  } else if (tailGap === 2 && freezes > 0) {
    freezes -= 1;
    currentStreak = runLength;
    freezeUsedForCurrentStreak = true;
  } else {
    currentStreak = 0;
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak, freezesRemaining: freezes, freezeUsedForCurrentStreak };
}

export async function refreshStreakForUser(userId: string) {
  const [{ data: dreams, error: dreamsError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from('dreams').select('dreamed_at').eq('user_id', userId),
    supabase.from('profiles').select('created_at').eq('id', userId).single(),
  ]);
  if (dreamsError) throw new Error(dreamsError.message);
  if (profileError) throw new Error(profileError.message);

  const { currentStreak, longestStreak, freezesRemaining, freezeUsedForCurrentStreak } =
    computeStreaksWithFreezes(
      (dreams ?? []).map((row) => row.dreamed_at),
      new Date(profile.created_at)
    );

  if (freezeUsedForCurrentStreak) {
    console.log(`[streaks] freeze token used to preserve streak for user ${userId}`);
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      streak_freezes: freezesRemaining,
      freeze_last_replenished: localDateString(new Date()),
    })
    .eq('id', userId);
  if (updateError) throw new Error(updateError.message);

  return { currentStreak, longestStreak };
}
