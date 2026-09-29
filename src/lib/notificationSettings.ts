import { supabase } from './supabase';
import { Tables, TablesUpdate } from '../types/database';

export type NotificationSettings = Tables<'notification_settings'>;
export type NotificationSettingsPatch = Omit<TablesUpdate<'notification_settings'>, 'user_id'>;

export async function fetchNotificationSettings(userId: string) {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveNotificationSettings(userId: string, patch: NotificationSettingsPatch) {
  const { data, error } = await supabase
    .from('notification_settings')
    .upsert({ ...patch, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
