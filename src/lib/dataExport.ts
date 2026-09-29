import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { Tables } from '../types/database';

type Dream = Tables<'dreams'>;

export type DataExport = {
  exported_at: string;
  profile: Tables<'profiles'> | null;
  dreams: Dream[];
  dream_signs: { tag: string; count: number }[];
  streaks: {
    current_streak: number;
    longest_streak: number;
    streak_freezes: number;
    freeze_last_replenished: string;
  } | null;
  wbtb_sessions: Tables<'wbtb_sessions'>[];
  reality_check_settings: Tables<'reality_check_settings'> | null;
  notification_settings: Tables<'notification_settings'> | null;
  wbtb_defaults: Tables<'wbtb_defaults'> | null;
  ai_insights: Tables<'dream_insights'>[];
  mild_mantras: Tables<'mild_mantras'>[];
  technique_recommendations: Tables<'technique_recommendations'>[];
  progress_narratives: Tables<'progress_narratives'>[];
  dream_profiles: Tables<'dream_profiles'>[];
  sleep_correlations: Tables<'sleep_correlations'>[];
  coach_messages: Tables<'coach_messages'>[];
};

// Every distinct tag across all journal entries, unlike lib/dreamSigns.ts's
// extractDreamSigns (which caps at MAX_DREAM_SIGNS for the reality-check feature) — a
// full data export should list everything, not just the top few used for reminders.
function computeDreamSignCounts(dreams: Dream[]): { tag: string; count: number }[] {
  const counts = new Map<string, { display: string; count: number }>();
  for (const dream of dreams) {
    for (const rawTag of dream.tags ?? []) {
      const tag = rawTag.trim();
      if (!tag) continue;
      const key = tag.toLowerCase();
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { display: tag, count: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map(({ display, count }) => ({ tag: display, count }));
}

export async function buildDataExport(userId: string): Promise<DataExport> {
  const [
    profileRes,
    dreamsRes,
    wbtbSessionsRes,
    realityCheckRes,
    notificationRes,
    wbtbDefaultsRes,
    insightsRes,
    mantrasRes,
    recommendationsRes,
    narrativesRes,
    dreamProfilesRes,
    sleepCorrelationsRes,
    coachRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('dreams').select('*').eq('user_id', userId).order('dreamed_at', { ascending: false }),
    supabase.from('wbtb_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('reality_check_settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('notification_settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('wbtb_defaults').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('dream_insights').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('mild_mantras').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('technique_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('progress_narratives')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false }),
    supabase.from('dream_profiles').select('*').eq('user_id', userId).order('generated_at', { ascending: false }),
    supabase.from('sleep_correlations').select('*').eq('user_id', userId).order('generated_at', { ascending: false }),
    supabase.from('coach_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
  ]);

  for (const res of [
    profileRes,
    dreamsRes,
    wbtbSessionsRes,
    realityCheckRes,
    notificationRes,
    wbtbDefaultsRes,
    insightsRes,
    mantrasRes,
    recommendationsRes,
    narrativesRes,
    dreamProfilesRes,
    sleepCorrelationsRes,
    coachRes,
  ]) {
    if (res.error) throw new Error(res.error.message);
  }

  const profile = profileRes.data;
  const dreams = dreamsRes.data ?? [];

  return {
    exported_at: new Date().toISOString(),
    profile,
    dreams,
    dream_signs: computeDreamSignCounts(dreams),
    streaks: profile
      ? {
          current_streak: profile.current_streak,
          longest_streak: profile.longest_streak,
          streak_freezes: profile.streak_freezes,
          freeze_last_replenished: profile.freeze_last_replenished,
        }
      : null,
    wbtb_sessions: wbtbSessionsRes.data ?? [],
    reality_check_settings: realityCheckRes.data,
    notification_settings: notificationRes.data,
    wbtb_defaults: wbtbDefaultsRes.data,
    ai_insights: insightsRes.data ?? [],
    mild_mantras: mantrasRes.data ?? [],
    technique_recommendations: recommendationsRes.data ?? [],
    progress_narratives: narrativesRes.data ?? [],
    dream_profiles: dreamProfilesRes.data ?? [],
    sleep_correlations: sleepCorrelationsRes.data ?? [],
    coach_messages: coachRes.data ?? [],
  };
}

function downloadOnWeb(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function shareOnNative(json: string, filename: string) {
  const file = new File(Paths.cache, filename);
  file.create();
  file.write(json);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export your Nocturnal data',
  });
}

// Assembles the full export, then hands it off the platform-appropriate way: a browser
// download on web (expo-file-system/expo-sharing don't support local files there), or
// the native share sheet everywhere else.
export async function exportAndDeliverData(userId: string): Promise<void> {
  const data = await buildDataExport(userId);
  const json = JSON.stringify(data, null, 2);
  const filename = `nocturnal-export-${Date.now()}.json`;

  if (Platform.OS === 'web') {
    downloadOnWeb(json, filename);
    return;
  }
  await shareOnNative(json, filename);
}
