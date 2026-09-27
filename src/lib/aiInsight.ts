import { supabase } from './supabase';
import { Tables } from '../types/database';

export type DreamInsight = Tables<'dream_insights'>;

export const MIN_DREAMS_FOR_INSIGHT = 3;

type GenerateInsightResponse =
  | { insight: DreamInsight; isFirst: boolean; cached?: boolean }
  | { insight: null; isFirst: false; reason: 'not_enough_data' };

// Calls the generate-dream-insight Edge Function, which does all the real work
// server-side: pulls the signed-in user's own recent journal entries, dream signs,
// and streak, and either returns the existing insight (if one was already generated
// in the last 24h) or calls Claude Haiku for a fresh one and persists it. Safe to call
// on every Home/Insights visit — the daily cap lives in the function, not the client.
export async function fetchOrGenerateInsight(): Promise<GenerateInsightResponse> {
  const { data, error } = await supabase.functions.invoke<GenerateInsightResponse>(
    'generate-dream-insight',
    { method: 'POST' }
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No response from generate-dream-insight');
  return data;
}

// Whether this user has ever had a real insight generated. A plain existence check
// against Supabase, same shape as isFirstLucidDream in lib/milestones.ts — kept
// around for callers that just need the yes/no without triggering a generation.
export async function hasGeneratedFirstInsight(userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('dream_insights')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) return false;
  return (count ?? 0) > 0;
}
