import { supabase } from './supabase';
import { Tables } from '../types/database';

export type DreamProfile = Tables<'dream_profiles'>;

export const DREAM_PROFILE_FALLBACK =
  'Your dream profile builds over time. Keep logging and your identity as a dreamer will start to take shape.';

// Below this many dreams in total there is not enough to describe, so the client skips
// the Edge Function entirely (no Claude call, no cost) and shows DREAM_PROFILE_FALLBACK.
export const MIN_DREAMS_FOR_PROFILE = 5;

type GenerateDreamProfileResponse =
  | { profile: DreamProfile; cached?: boolean }
  | { profile: null; reason: 'not_enough_dreams' };

// Calls the generate-dream-profile Edge Function, which reads the signed-in user's whole
// dream history, WBTB results and streaks server-side and either returns the cached
// profile (if one was generated in the last 7 days) or calls Claude Haiku for a fresh
// one. Same cache/regenerate pattern as generate-progress-narrative
// (src/lib/progressNarrative.ts). The user is identified by the session's JWT.
export async function fetchOrGenerateDreamProfile(): Promise<GenerateDreamProfileResponse> {
  const { data, error } = await supabase.functions.invoke<GenerateDreamProfileResponse>(
    'generate-dream-profile',
    { method: 'POST' }
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No response from generate-dream-profile');
  return data;
}
