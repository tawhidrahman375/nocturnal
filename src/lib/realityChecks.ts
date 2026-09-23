import { extractDreamSigns } from './dreamSigns';
import {
  MAX_REALITY_CHECK_SLOTS,
  RealityCheckSlot,
  cancelRealityChecks,
  scheduleRealityChecks,
} from './notifications';
import { supabase } from './supabase';
import { Tables, TablesInsert, TablesUpdate } from '../types/database';

export type RealityCheckSettings = Tables<'reality_check_settings'>;
export type RealityCheckLogStatus = 'scheduled' | 'delivered' | 'opened';

export const FREQUENCY_OPTIONS = [60, 90, 120, 180, 240] as const;
export const DEFAULT_FREQUENCY_MINUTES = 120;
export const DEFAULT_ACTIVE_START_MINUTES = 9 * 60; // 9:00 AM
export const DEFAULT_ACTIVE_END_MINUTES = 22 * 60; // 10:00 PM

const REALITY_CHECK_TECHNIQUES = [
  'Look at your hands and count your fingers. In a dream they blur, stretch, or miscount.',
  'Read a line of text, look away, then read it again. Words shift and rearrange in dreams.',
  'Push a finger against your opposite palm. In a dream it can push right through.',
  'Check a clock, look away, then check it again. Time behaves strangely in dreams.',
  "Try to breathe in with your nose pinched shut. If you still can, you're dreaming.",
];

export function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function timeOfDayFromMinutes(minutes: number, referenceDate: Date = new Date()) {
  const result = new Date(referenceDate);
  result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return result;
}

export function computeSlotMinutes(
  startMinutes: number,
  endMinutes: number,
  frequencyMinutes: number
): number[] {
  const slots: number[] = [];
  for (
    let minute = startMinutes;
    minute <= endMinutes && slots.length < MAX_REALITY_CHECK_SLOTS;
    minute += frequencyMinutes
  ) {
    slots.push(minute);
  }
  return slots.length > 0 ? slots : [startMinutes];
}

export function pickDreamSign(dreamSigns: string[], index: number): string | null {
  if (dreamSigns.length === 0) return null;
  return dreamSigns[index % dreamSigns.length];
}

export function buildReminderCopy(dreamSign: string | null, index: number) {
  const technique = REALITY_CHECK_TECHNIQUES[index % REALITY_CHECK_TECHNIQUES.length];
  return {
    title: 'Reality check',
    body: dreamSign ? `You've dreamed about "${dreamSign}" before. ${technique}` : technique,
  };
}

export function buildSlots(settings: RealityCheckSettings, dreamSigns: string[]): RealityCheckSlot[] {
  return computeSlotMinutes(
    settings.active_start_minutes,
    settings.active_end_minutes,
    settings.frequency_minutes
  ).map((minute, index) => {
    const dreamSign = pickDreamSign(dreamSigns, index);
    const { title, body } = buildReminderCopy(dreamSign, index);
    return {
      index,
      hour: Math.floor(minute / 60),
      minute: minute % 60,
      title,
      body,
      dreamSign,
    };
  });
}

export async function fetchRealityCheckSettings(userId: string) {
  const { data, error } = await supabase
    .from('reality_check_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export type RealityCheckSettingsPatch = Omit<TablesUpdate<'reality_check_settings'>, 'user_id'>;

export async function saveRealityCheckSettings(userId: string, patch: RealityCheckSettingsPatch) {
  const { data, error } = await supabase
    .from('reality_check_settings')
    .upsert({ ...patch, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function applyRealityCheckSchedule(settings: RealityCheckSettings, dreamSigns: string[]) {
  if (!settings.enabled) {
    await cancelRealityChecks();
    return;
  }
  await scheduleRealityChecks(buildSlots(settings, dreamSigns));
}

// Fire-and-forget refresh so new journal entries (and their tags) keep future reminders
// personalized without the user having to revisit the schedule screen.
export async function refreshRealityCheckSchedule(userId: string) {
  const settings = await fetchRealityCheckSettings(userId);
  if (!settings) return;
  const { data } = await supabase.from('dreams').select('tags').eq('user_id', userId);
  await applyRealityCheckSchedule(settings, extractDreamSigns(data ?? []));
}

export async function logRealityCheckReminder(
  userId: string,
  entry: { dreamSign: string | null; status: RealityCheckLogStatus }
) {
  const payload: TablesInsert<'reality_check_logs'> = {
    user_id: userId,
    dream_sign: entry.dreamSign,
    status: entry.status,
    scheduled_for: new Date().toISOString(),
  };
  const { error } = await supabase.from('reality_check_logs').insert(payload);
  if (error) throw new Error(error.message);
}
