import { daysBetween, localDateString } from './streaks';

export type RecallLevel = 'sharp' | 'warm' | 'cooling' | 'faint';

export type RecallStrength = {
  // 0 to 1.
  value: number;
  level: RecallLevel;
  label: string;
  hint: string;
};

const DECAY_PER_IDLE_DAY = 0.14;
const FLOOR = 0.12;

// Dream recall is a muscle, and this is its visible half: it holds at full while the user
// logged yesterday or today, then cools a little every day they do not, on its own clock,
// with the app open or not. One entry brings it straight back. Paused days do not cool it.
// Null until there is a first entry, since there is nothing yet to cool.
export function computeRecallStrength(
  dreamedDates: string[],
  pausedDays: Set<string>,
  today: Date = new Date()
): RecallStrength | null {
  if (dreamedDates.length === 0) return null;

  const todayStr = localDateString(today);
  const lastDay = [...dreamedDates].sort().at(-1) as string;
  let idle = Math.max(0, daysBetween(lastDay, todayStr));
  for (let offset = 1; offset < daysBetween(lastDay, todayStr); offset++) {
    const day = new Date(Date.parse(lastDay) + offset * 86_400_000).toISOString().slice(0, 10);
    if (pausedDays.has(day)) idle -= 1;
  }

  const value = Math.max(FLOOR, 1 - DECAY_PER_IDLE_DAY * Math.max(0, idle - 1));

  if (value >= 0.85) {
    return { value, level: 'sharp', label: 'Sharp', hint: 'Fresh from the last few days. Keep it warm.' };
  }
  if (value >= 0.55) {
    return { value, level: 'warm', label: 'Warm', hint: "It's cooling a little. A line about last night warms it back." };
  }
  if (value >= 0.3) {
    return { value, level: 'cooling', label: 'Cooling', hint: 'Recall fades without practice. One short entry brings it back.' };
  }
  return { value, level: 'faint', label: 'Quiet', hint: 'Your dreams are still there. Start with whatever you remember.' };
}
