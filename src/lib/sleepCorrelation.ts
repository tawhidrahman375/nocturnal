// Pure sleep-versus-dreams correlation. No React Native or network imports on purpose: it
// runs on the device (sleep data never leaves it, only the computed numbers below do)
// and is easy to test on its own. Nothing here is AI; Haiku only narrates the result.

export const SLEEP_WINDOW_DAYS = 30;
export const MIN_SLEEP_NIGHTS = 5;
export const MIN_DREAMS_FOR_SLEEP_INSIGHT = 3;

// Asleep segments closer together than this belong to one night. iOS reports sleep as
// many short stage segments, often from more than one source, and a quick wake in the
// middle of the night should not split it in two.
const MERGE_GAP_MS = 60 * 60 * 1000;
// A day's longest sleep only counts as a night if it lasted at least this long, so a
// nap-only day is not mistaken for a very short night.
const MIN_NIGHT_HOURS = 2;
// Each side of the longer/shorter-sleep comparison needs at least this many nights.
const MIN_NIGHTS_PER_GROUP = 2;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// One stretch of being asleep, as reported by Apple Health or Health Connect.
export type SleepInterval = { start: Date; end: Date };

export type SleepNight = {
  // Local calendar day the sleep ended on. A dream logged on this day (see dreams'
  // `dreamed_at`) is the one that followed this night.
  wakeDate: string;
  start: Date;
  end: Date;
  hours: number;
};

export type DreamForCorrelation = { dreamed_at: string; is_lucid: boolean };

export type SleepCorrelationStats = {
  periodDays: number;
  nightsWithSleepData: number;
  dreamsInPeriod: number;
  lucidDreamsInPeriod: number;
  avgSleepHours: number;
  lucidNights: number;
  nonLucidNights: number;
  avgSleepBeforeLucid: number | null;
  avgSleepBeforeNonLucid: number | null;
  // Most common hour the user woke up on a lucid dream night: `startHour` is the start of
  // the one-hour bucket (6 means "between 6 and 7 AM"); `count` is how many lucid nights.
  commonLucidWake: { startHour: number; count: number } | null;
  // Most common total sleep, rounded to the nearest half hour, on lucid dream nights.
  commonLucidDuration: { hours: number; count: number } | null;
  // Share of nights followed by a logged dream, split by whether the night was longer than
  // the user's own average. Null when either side has too few nights to compare.
  longerSleep: { nights: number; dreamLogRate: number } | null;
  shorterSleep: { nights: number; dreamLogRate: number } | null;
};

// Same local-day format as lib/streaks.ts localDateString, kept here so this file stays
// free of the app's Supabase import.
export function localDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const round = (value: number, places: number) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

// Turns raw asleep intervals into one night per wake date: overlapping and near-adjacent
// intervals are merged into sessions (overlap counted once, so two sources reporting the
// same sleep do not double it), then each wake date keeps its longest session.
export function buildSleepNights(intervals: SleepInterval[]): SleepNight[] {
  const sorted = intervals
    .filter((i) => i.end.getTime() > i.start.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const sessions: { start: number; end: number; asleepMs: number }[] = [];
  for (const interval of sorted) {
    const start = interval.start.getTime();
    const end = interval.end.getTime();
    const current = sessions[sessions.length - 1];
    if (current && start - current.end <= MERGE_GAP_MS) {
      current.asleepMs += Math.max(0, end - Math.max(start, current.end));
      current.end = Math.max(current.end, end);
    } else {
      sessions.push({ start, end, asleepMs: end - start });
    }
  }

  const longestByDate = new Map<string, SleepNight & { asleepMs: number }>();
  for (const session of sessions) {
    if (session.asleepMs < MIN_NIGHT_HOURS * HOUR_MS) continue;
    const end = new Date(session.end);
    const wakeDate = localDay(end);
    const existing = longestByDate.get(wakeDate);
    if (existing && existing.asleepMs >= session.asleepMs) continue;
    longestByDate.set(wakeDate, {
      wakeDate,
      start: new Date(session.start),
      end,
      hours: session.asleepMs / HOUR_MS,
      asleepMs: session.asleepMs,
    });
  }

  return [...longestByDate.values()]
    .map(({ asleepMs: _asleepMs, ...night }) => night)
    .sort((a, b) => a.wakeDate.localeCompare(b.wakeDate));
}

// Most common value; on a tie the smaller one wins, so the result is deterministic.
function modeOf(values: number[]): { value: number; count: number } | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: { value: number; count: number } | null = null;
  for (const [value, count] of counts) {
    if (!best || count > best.count || (count === best.count && value < best.value)) best = { value, count };
  }
  return best;
}

export function computeSleepCorrelationStats(
  allNights: SleepNight[],
  allDreams: DreamForCorrelation[],
  now: Date = new Date()
): SleepCorrelationStats {
  const startDate = localDay(new Date(now.getTime() - (SLEEP_WINDOW_DAYS - 1) * DAY_MS));
  const nights = allNights.filter((n) => n.wakeDate >= startDate);
  const dreams = allDreams.filter((d) => d.dreamed_at >= startDate);

  const dreamsByDate = new Map<string, DreamForCorrelation[]>();
  for (const dream of dreams) {
    const list = dreamsByDate.get(dream.dreamed_at);
    if (list) list.push(dream);
    else dreamsByDate.set(dream.dreamed_at, [dream]);
  }

  const lucid: SleepNight[] = [];
  const nonLucid: SleepNight[] = [];
  for (const night of nights) {
    const that = dreamsByDate.get(night.wakeDate);
    if (!that) continue;
    (that.some((d) => d.is_lucid) ? lucid : nonLucid).push(night);
  }

  const avgSleepHours = nights.length ? mean(nights.map((n) => n.hours)) : 0;

  const wake = modeOf(lucid.map((n) => n.end.getHours()));
  const duration = modeOf(lucid.map((n) => Math.round(n.hours * 2) / 2));

  const longer = nights.filter((n) => n.hours > avgSleepHours);
  const shorter = nights.filter((n) => n.hours <= avgSleepHours);
  const dreamRate = (group: SleepNight[]) =>
    group.length >= MIN_NIGHTS_PER_GROUP
      ? { nights: group.length, dreamLogRate: round(group.filter((n) => dreamsByDate.has(n.wakeDate)).length / group.length, 2) }
      : null;

  return {
    periodDays: SLEEP_WINDOW_DAYS,
    nightsWithSleepData: nights.length,
    dreamsInPeriod: dreams.length,
    lucidDreamsInPeriod: dreams.filter((d) => d.is_lucid).length,
    avgSleepHours: round(avgSleepHours, 1),
    lucidNights: lucid.length,
    nonLucidNights: nonLucid.length,
    avgSleepBeforeLucid: lucid.length ? round(mean(lucid.map((n) => n.hours)), 1) : null,
    avgSleepBeforeNonLucid: nonLucid.length ? round(mean(nonLucid.map((n) => n.hours)), 1) : null,
    commonLucidWake: wake ? { startHour: wake.value, count: wake.count } : null,
    commonLucidDuration: duration ? { hours: duration.value, count: duration.count } : null,
    longerSleep: dreamRate(longer),
    shorterSleep: dreamRate(shorter),
  };
}

// Whether there is enough to correlate at all. Below this the client never calls the
// Edge Function and shows a static line instead.
export function hasEnoughSleepData(stats: SleepCorrelationStats): boolean {
  return stats.nightsWithSleepData >= MIN_SLEEP_NIGHTS && stats.dreamsInPeriod >= MIN_DREAMS_FOR_SLEEP_INSIGHT;
}
