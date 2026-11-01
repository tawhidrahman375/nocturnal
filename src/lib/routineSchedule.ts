import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyMildPromptSchedule } from './mildPromptSchedule';
import {
  cancelComeBackNudges,
  cancelMorningRecall,
  requestRoutinePermission,
  scheduleComeBackNudges,
  scheduleMorningRecall,
} from './notifications';
import { isPausedToday } from './pause';
import { refreshRealityCheckSchedule } from './realityChecks';
import { localDateString } from './streaks';
import { supabase } from './supabase';

const MINUTES_PER_DAY = 24 * 60;
// Shortly after waking, not at the instant of the alarm: time to reach the phone, not so
// long that the dream is gone.
const MORNING_OFFSET_MINUTES = 15;
const DEFAULT_WAKE_MINUTES = 7 * 60;

const MORNING_RECALL_KEY_PREFIX = 'nocturnal:morning-recall:enabled:';

export async function isMorningRecallEnabled(userId: string) {
  try {
    return (await AsyncStorage.getItem(MORNING_RECALL_KEY_PREFIX + userId)) !== '0';
  } catch {
    return true;
  }
}

export async function setMorningRecallEnabled(userId: string, enabled: boolean) {
  try {
    await AsyncStorage.setItem(MORNING_RECALL_KEY_PREFIX + userId, enabled ? '1' : '0');
  } catch {
    // The toggle simply won't be remembered across launches.
  }
}

export function morningRecallMinutes(naturalWakeTime: number | null) {
  return ((naturalWakeTime ?? DEFAULT_WAKE_MINUTES) + MORNING_OFFSET_MINUTES) % MINUTES_PER_DAY;
}

// Everything that is anchored to the user's day rather than to a single WBTB session:
// the bedtime MILD prompt (from the bedtime they gave), the morning recall and the
// come-back nudges (from the wake time they gave) and the reality checks (from their own
// dream signs). A pause switches all of it off in one place and a resume switches it back on.
export async function applyRoutineSchedules(userId: string) {
  const paused = await isPausedToday(userId, localDateString(new Date()));

  const { data: profile } = await supabase
    .from('profiles')
    .select('natural_wake_time')
    .eq('id', userId)
    .single();
  const wakeMinutes = morningRecallMinutes(profile?.natural_wake_time ?? null);

  if (paused) {
    await Promise.all([cancelMorningRecall(), cancelComeBackNudges()]);
  } else {
    if (await requestRoutinePermission()) {
      if (await isMorningRecallEnabled(userId)) {
        await scheduleMorningRecall(Math.floor(wakeMinutes / 60), wakeMinutes % 60);
      } else {
        await cancelMorningRecall();
      }
      await scheduleComeBackNudges(Math.floor(wakeMinutes / 60), wakeMinutes % 60);
    }
  }

  await Promise.all([
    applyMildPromptSchedule(userId).catch(() => {}),
    refreshRealityCheckSchedule(userId).catch(() => {}),
  ]);
}

// Opening the app is the signal the user is around, so the "you've been away" nudges move
// out again. Cheap and local; runs on every return to the foreground.
export async function pushBackComeBackNudges(userId: string) {
  if (await isPausedToday(userId, localDateString(new Date()))) return;
  const { data: profile } = await supabase
    .from('profiles')
    .select('natural_wake_time')
    .eq('id', userId)
    .single();
  const wakeMinutes = morningRecallMinutes(profile?.natural_wake_time ?? null);
  await scheduleComeBackNudges(Math.floor(wakeMinutes / 60), wakeMinutes % 60);
}
