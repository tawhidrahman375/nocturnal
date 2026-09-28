import { supabase } from './supabase';
import { Tables } from '../types/database';

export type MildMantra = Tables<'mild_mantras'>;

type GenerateMantraResponse =
  | { mantra: MildMantra; cached?: boolean }
  | { mantra: null; reason: 'not_enough_data' };

// Calls the generate-mild-mantra Edge Function, which does all the real work
// server-side: pulls the signed-in user's own recent journal entries and dream signs,
// and either returns the existing mantra (if one was already generated in the last
// 24h) or calls Claude Haiku for a fresh one and persists it. Same cache/regenerate
// pattern as generate-dream-insight (src/lib/aiInsight.ts).
export async function fetchOrGenerateMildMantra(): Promise<GenerateMantraResponse> {
  const { data, error } = await supabase.functions.invoke<GenerateMantraResponse>(
    'generate-mild-mantra',
    { method: 'POST' }
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No response from generate-mild-mantra');
  return data;
}
