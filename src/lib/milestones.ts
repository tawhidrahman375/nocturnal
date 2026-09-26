import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const STREAK_MILESTONE_KEY_PREFIX = 'nocturnal:milestone:streak-high-water-mark:';

// A dream can be created as lucid but this app never un-marks or deletes one, so a
// count of exactly 1 lucid dream right after a save can only mean this was the first
// one ever — no need to compare before/after counts or track anything extra.
export async function isFirstLucidDream(userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('dreams')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_lucid', true);
  if (error) return false;
  return count === 1;
}

// Streak milestones celebrate a "highest ever reached" achievement rather than firing
// every single time the exact number recurs, so breaking a streak and climbing back to
// a multiple of 7 already celebrated doesn't re-trigger it. Tracked per device, like the
// pre-permission "already shown" flags in lib/permissionPrompts.ts — this is a
// presentational "don't re-celebrate" flag, not data that needs to sync across devices.
export async function getLastCelebratedStreakMilestone(userId: string): Promise<number> {
  const value = await AsyncStorage.getItem(STREAK_MILESTONE_KEY_PREFIX + userId);
  return value ? Number(value) : 0;
}

export async function setLastCelebratedStreakMilestone(userId: string, value: number): Promise<void> {
  await AsyncStorage.setItem(STREAK_MILESTONE_KEY_PREFIX + userId, String(value));
}
