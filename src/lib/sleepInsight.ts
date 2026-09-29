import { supabase } from './supabase';
import type { SleepCorrelationStats } from './sleepCorrelation';
import { Tables } from '../types/database';

export type SleepInsight = Tables<'sleep_correlations'>;

// Copy for the "Sleep and dreams" card's non-insight states.
export const SLEEP_INSIGHT_NOT_ENOUGH_DATA = 'Log more dreams and sleep data to unlock your sleep correlation insight.';
export const SLEEP_INSIGHT_CONNECT = 'Connect Apple Health or Google Fit to unlock sleep insights.';
export const SLEEP_INSIGHT_UNSUPPORTED = 'Sleep insights are available in the iOS and Android apps.';
export const SLEEP_INSIGHT_HEALTH_CONNECT_MISSING = 'Sleep insights need Health Connect, which is not installed on this phone.';
export const SLEEP_INSIGHT_HEALTH_CONNECT_UPDATE = 'Sleep insights need an updated Health Connect. Update it from the Play Store.';
export const SLEEP_INSIGHT_ERROR = 'Sleep insights are unavailable right now.';

type GenerateSleepCorrelationResponse =
  | { insight: SleepInsight; cached?: boolean }
  | { insight: null; reason: 'not_enough_data' };

// Calls the generate-sleep-correlation Edge Function with the numbers computed on the
// device (lib/sleepCorrelation.ts). Only those aggregates are sent, never the sleep data
// itself. The function returns the cached insight if one was made in the last 7 days, or
// calls Claude Haiku for a fresh one. Same cache/regenerate pattern as
// generate-dream-profile (src/lib/dreamProfile.ts).
export async function fetchOrGenerateSleepCorrelation(
  stats: SleepCorrelationStats
): Promise<GenerateSleepCorrelationResponse> {
  const { data, error } = await supabase.functions.invoke<GenerateSleepCorrelationResponse>(
    'generate-sleep-correlation',
    { method: 'POST', body: { stats } }
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No response from generate-sleep-correlation');
  return data;
}
