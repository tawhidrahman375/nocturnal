import { TablesUpdate } from '../types/database';
import { cancelAlarm, cancelWindowEnd, scheduleAlarm } from './notifications';
import { supabase } from './supabase';
import { MINUTE_MS, WbtbSession, WbtbStatus, WbtbTechnique } from './wbtb';

// Sessions left open this long after the alarm (or after waking) are treated as missed.
const STALE_AFTER_MINUTES = 180;

export type SessionPatch = Omit<TablesUpdate<'wbtb_sessions'>, 'status' | 'technique'> & {
  status?: WbtbStatus;
  technique?: WbtbTechnique;
};

export async function fetchSession(id: string) {
  const { data, error } = await supabase.from('wbtb_sessions').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSession(id: string, patch: SessionPatch) {
  const { error } = await supabase.from('wbtb_sessions').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchOpenSession(): Promise<WbtbSession | null> {
  const { data, error } = await supabase
    .from('wbtb_sessions')
    .select('*')
    .in('status', ['scheduled', 'active'])
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const anchor = new Date(data.woke_at ?? data.wake_at).getTime();
  if (Date.now() - anchor > STALE_AFTER_MINUTES * MINUTE_MS) {
    await cancelAlarm(data.id);
    await updateSession(data.id, { status: 'missed' });
    return null;
  }
  return data;
}

export async function cancelSession(session: WbtbSession) {
  await Promise.all([cancelAlarm(session.id), cancelWindowEnd(session.id)]);
  await updateSession(session.id, { status: 'cancelled' });
}

export async function planSession(input: {
  userId: string;
  sleepAt: Date;
  wakeAt: Date;
  wakeWindowMinutes: number;
  technique: WbtbTechnique;
}) {
  const existing = await fetchOpenSession();
  if (existing) await cancelSession(existing);

  const { data, error } = await supabase
    .from('wbtb_sessions')
    .insert({
      user_id: input.userId,
      sleep_at: input.sleepAt.toISOString(),
      wake_at: input.wakeAt.toISOString(),
      wake_window_minutes: input.wakeWindowMinutes,
      technique: input.technique,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  try {
    await scheduleAlarm(data.id, input.wakeAt);
  } catch (e) {
    await updateSession(data.id, { status: 'cancelled' });
    throw e;
  }
  return data;
}

export async function saveRecallToJournal(userId: string, recall: string) {
  const { data, error } = await supabase
    .from('dreams')
    .insert({ user_id: userId, title: 'Recalled during WBTB', content: recall })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}
