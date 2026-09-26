import { localDateString } from './streaks';
import { fetchOpenSession } from './wbtbSessions';
import { supabase } from './supabase';
import { Dream } from '../hooks/useDreams';

export const REALITY_CHECK_GOAL = 3;

export type TonightRoutineSteps = {
  realityCheck: boolean;
  journal: boolean;
  intention: boolean;
  wbtb: boolean;
};

// The nightly routine resets at 6am, not midnight, so a dream logged or an alarm set
// at 2am still belongs to the night that started the evening before. Every completion
// check below compares against this "routine day" rather than the plain calendar day.
export function routineDateFor(now: Date) {
  const anchor = now.getHours() < 6 ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now;
  return localDateString(anchor);
}

// The absolute [start, end) instants covered by a given routine day — a full 24h span
// running 6am to 6am, not midnight to midnight. Kept as one helper so every check below
// (timestamp comparisons and the reality-check DB query) agrees on the same boundary.
function routineWindow(routineDateStr: string) {
  const start = new Date(`${routineDateStr}T06:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function isWithinRoutineDay(timestamp: string, routineDateStr: string, now: Date) {
  const { start, end } = routineWindow(routineDateStr);
  const t = new Date(timestamp);
  return t >= start && t < end && t <= now;
}

async function countOpenedRealityChecks(userId: string, routineDateStr: string) {
  const { start, end } = routineWindow(routineDateStr);

  const { count, error } = await supabase
    .from('reality_check_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'opened')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function fetchTonightRoutineSteps(
  userId: string,
  dreams: Pick<Dream, 'created_at'>[],
  mildIntentionSetAt: string | null,
  now: Date = new Date()
): Promise<TonightRoutineSteps> {
  const routineDateStr = routineDateFor(now);

  const [realityCheckCount, openSession] = await Promise.all([
    countOpenedRealityChecks(userId, routineDateStr),
    fetchOpenSession(),
  ]);

  const journal = dreams.some((dream) => isWithinRoutineDay(dream.created_at, routineDateStr, now));
  const intention = mildIntentionSetAt
    ? isWithinRoutineDay(mildIntentionSetAt, routineDateStr, now)
    : false;

  return {
    realityCheck: realityCheckCount >= REALITY_CHECK_GOAL,
    journal,
    intention,
    wbtb: openSession !== null,
  };
}

export async function markMildIntentionSet(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ mild_intention_set_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}
