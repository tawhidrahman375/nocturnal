import { supabase } from './supabase';
import { Tables } from '../types/database';

export type ProgressNarrative = Tables<'progress_narratives'>;

export const PROGRESS_NARRATIVE_FALLBACK = 'Check back after logging a few more dreams.';

// Below this many dreams in total, there is nothing worth summarizing, so the client
// skips the Edge Function entirely (no Claude call, no cost) and shows the fallback.
export const MIN_DREAMS_FOR_NARRATIVE = 2;

type PeriodResult = { narrative: ProgressNarrative; cached?: boolean } | { narrative: null; error: string };

export type GenerateProgressNarrativesResponse = {
  weekly?: PeriodResult;
  monthly?: PeriodResult;
};

// Calls the generate-progress-narrative Edge Function, which does the real work
// server-side: pulls the signed-in user's own dreams, WBTB sessions and streaks, and for
// each period either returns the cached narrative (24h for weekly, 7 days for monthly)
// or makes a separate Claude Haiku call for a fresh one. Same cache/regenerate pattern
// as generate-technique-recommendation (src/lib/techniqueRecommendation.ts). The user is
// identified by the session's JWT, so no user id is sent.
export async function fetchOrGenerateProgressNarratives(): Promise<GenerateProgressNarrativesResponse> {
  const { data, error } = await supabase.functions.invoke<GenerateProgressNarrativesResponse | { error: string }>(
    'generate-progress-narrative',
    { method: 'POST', body: { period: 'both' } }
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No response from generate-progress-narrative');
  if ('error' in data) throw new Error(data.error);
  return data;
}
