import AsyncStorage from '@react-native-async-storage/async-storage';

const PAUSE_KEY_PREFIX = 'nocturnal:pause:ranges:';
const MS_PER_DAY = 86_400_000;

export const PAUSE_OPTIONS_DAYS = [3, 7, 14] as const;

// Inclusive local calendar days, "YYYY-MM-DD". Kept on this device, like the other
// presentational flags in lib/permissionPrompts.ts: pausing silences reminders here and
// stops the days counting against the streak when it is recomputed here.
export type PauseRange = { start: string; end: string };

function addDays(dateStr: string, days: number) {
  return new Date(Date.parse(dateStr) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export async function getPauseRanges(userId: string): Promise<PauseRange[]> {
  try {
    const raw = await AsyncStorage.getItem(PAUSE_KEY_PREFIX + userId);
    const parsed = raw ? (JSON.parse(raw) as PauseRange[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function savePauseRanges(userId: string, ranges: PauseRange[]) {
  try {
    await AsyncStorage.setItem(PAUSE_KEY_PREFIX + userId, JSON.stringify(ranges));
  } catch {
    // A pause that fails to persist just behaves as no pause.
  }
}

export function pausedDaySet(ranges: PauseRange[]) {
  const days = new Set<string>();
  for (const range of ranges) {
    for (let day = range.start; day <= range.end; day = addDays(day, 1)) days.add(day);
  }
  return days;
}

export function activePause(ranges: PauseRange[], todayStr: string) {
  return ranges.find((range) => range.start <= todayStr && todayStr <= range.end) ?? null;
}

export async function startPause(userId: string, days: number, todayStr: string) {
  const ranges = await getPauseRanges(userId);
  await savePauseRanges(userId, [...ranges, { start: todayStr, end: addDays(todayStr, days - 1) }]);
}

// Ending early keeps the days already rested (they were paused) and frees today onwards.
export async function endPause(userId: string, todayStr: string) {
  const ranges = await getPauseRanges(userId);
  const next = ranges
    .map((range) =>
      range.start <= todayStr && todayStr <= range.end ? { ...range, end: addDays(todayStr, -1) } : range
    )
    .filter((range) => range.start <= range.end);
  await savePauseRanges(userId, next);
}

export async function isPausedToday(userId: string, todayStr: string) {
  return activePause(await getPauseRanges(userId), todayStr) !== null;
}
