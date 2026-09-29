import { cancelMildPrompt, requestMildPromptPermission, scheduleMildPrompt } from './notifications';
import { supabase } from './supabase';
import { RECOMMENDED_SLEEP_MINUTES } from './wbtb';

const MINUTES_PER_DAY = 24 * 60;
export const DEFAULT_BEDTIME_MINUTES = 22 * 60; // 22:00, per spec, when no bedtime is on file.

// Same derivation WbtbSetupScreen uses to default its own bedtime picker: the user's
// onboarding-recorded natural wake time, minus the recommended sleep duration. This is
// the only "stored sleep schedule" that exists independent of a specific WBTB session.
export function bedtimeMinutesFor(naturalWakeTime: number | null) {
  if (naturalWakeTime == null) return DEFAULT_BEDTIME_MINUTES;
  return ((naturalWakeTime - RECOMMENDED_SLEEP_MINUTES) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

// Single source of truth for "should the MILD prompt be scheduled, and at what time" —
// used both by useMildPromptScheduling (root-level, runs on sign-in) and by
// NotificationSettingsScreen (so a toggle/time change takes effect immediately instead
// of waiting for the next app launch). Queries Supabase directly rather than taking
// profile/settings as params so both call sites can invoke it without needing the
// other's data loaded first.
export async function applyMildPromptSchedule(userId: string) {
  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('natural_wake_time').eq('id', userId).single(),
    supabase
      .from('notification_settings')
      .select('mild_prompt_enabled, mild_prompt_time_minutes')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (settings?.mild_prompt_enabled === false) {
    await cancelMildPrompt();
    return;
  }

  const granted = await requestMildPromptPermission();
  if (!granted) return;

  const minutes = settings?.mild_prompt_time_minutes ?? bedtimeMinutesFor(profile?.natural_wake_time ?? null);
  await scheduleMildPrompt(Math.floor(minutes / 60), minutes % 60);
}
