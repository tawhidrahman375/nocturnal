import { supabase } from './supabase';
import { Tables, TablesUpdate } from '../types/database';

export type WbtbDefaults = Tables<'wbtb_defaults'>;
export type WbtbDefaultsPatch = Omit<TablesUpdate<'wbtb_defaults'>, 'user_id'>;

export async function fetchWbtbDefaults(userId: string) {
  const { data, error } = await supabase
    .from('wbtb_defaults')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveWbtbDefaults(userId: string, patch: WbtbDefaultsPatch) {
  const { data, error } = await supabase
    .from('wbtb_defaults')
    .upsert({ ...patch, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
