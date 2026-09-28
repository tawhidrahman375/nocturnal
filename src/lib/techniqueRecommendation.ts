import { supabase } from './supabase';
import { Tables } from '../types/database';

export type TechniqueRecommendation = Tables<'technique_recommendations'>;

export const DEFAULT_TECHNIQUE_RECOMMENDATION =
  'Try MILD tonight. It is the most beginner-friendly technique and pairs perfectly with your dream journal habit.';

type GenerateRecommendationResponse =
  | { recommendation: TechniqueRecommendation; cached?: boolean }
  | { recommendation: null; reason: 'no_history' };

// Calls the generate-technique-recommendation Edge Function, which pulls the user's own
// WBTB session history (which techniques, how many times, how many led to a lucid
// dream), streak, and recent dream signs, and either returns the cached recommendation
// (if one was generated in the last 24h) or calls Claude Haiku for a fresh one. Same
// cache/regenerate pattern as generate-mild-mantra (src/lib/mildMantra.ts).
export async function fetchOrGenerateTechniqueRecommendation(): Promise<GenerateRecommendationResponse> {
  const { data, error } = await supabase.functions.invoke<GenerateRecommendationResponse>(
    'generate-technique-recommendation',
    { method: 'POST' }
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No response from generate-technique-recommendation');
  return data;
}
