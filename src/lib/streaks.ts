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

function daysBetween(a: string, b: string) {
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

// Dreams are never deleted in this app, so recomputing from full history is always
// accurate — no need to reconcile against a possibly-stale stored longest streak.
export async function refreshStreakForUser(userId: string) {
  const { data, error } = await supabase.from('dreams').select('dreamed_at').eq('user_id', userId);
  if (error) throw new Error(error.message);

  const { currentStreak, longestStreak } = computeStreaks((data ?? []).map((row) => row.dreamed_at));

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ current_streak: currentStreak, longest_streak: longestStreak })
    .eq('id', userId);
  if (updateError) throw new Error(updateError.message);

  return { currentStreak, longestStreak };
}
