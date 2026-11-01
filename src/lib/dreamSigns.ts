import AsyncStorage from '@react-native-async-storage/async-storage';
import { isProNow } from './purchases';
import { supabase } from './supabase';

const MAX_DREAM_SIGNS = 8;
// Must match RECENT_DREAM_LIMIT in the extract-dream-signs Edge Function, which reads the
// same entries on the server.
const RECENT_DREAM_LIMIT = 14;
const CACHE_KEY_PREFIX = 'nocturnal:dream-signs:extracted:';

type SignDream = { id: string; title: string; content: string; tags: string[] };

// Last-resort fallback when Claude is unreachable and nothing is cached: recurring journal
// tags are the next best thing to a dream sign.
function extractDreamSignsFromTags(dreams: Pick<SignDream, 'tags'>[]): string[] {
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
    .filter((entry) => entry.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_DREAM_SIGNS)
    .map((entry) => entry.display);
}

// A cheap fingerprint of the entries Claude reads, so signs are only re-extracted when one
// of the last 14 entries is added, edited or removed.
function signatureOf(dreams: SignDream[]) {
  return dreams.map((d) => `${d.id}:${d.title.length}:${d.content.length}`).join('|');
}

async function readCache(userId: string): Promise<{ signature: string; signs: string[] } | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.signature === 'string' && Array.isArray(parsed?.signs) ? parsed : null;
  } catch {
    return null;
  }
}

// The user's dream signs, extracted by the extract-dream-signs Edge Function from the text
// of their last 14 journal entries. The result is cached per device against the entries'
// fingerprint, so screens and the reminder scheduler can call this freely. If the call
// fails it falls back to the last extraction, then to recurring tags, and never throws.
//
// Dream sign detection is Pro. Every caller (the journal reveal, the reminder scheduler and
// both settings screens) goes through here, so a free user simply has no signs: nothing is
// extracted, and reminders stay generic.
export async function fetchDreamSigns(userId: string): Promise<string[]> {
  if (!(await isProNow())) return [];

  const { data, error } = await supabase
    .from('dreams')
    .select('id, title, content, tags')
    .eq('user_id', userId)
    .order('dreamed_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(RECENT_DREAM_LIMIT);
  if (error || !data) return (await readCache(userId))?.signs ?? [];

  // Recurrence needs at least two entries.
  if (data.length < 2) return [];

  const signature = signatureOf(data);
  const cached = await readCache(userId);
  if (cached?.signature === signature) return cached.signs;

  const { data: result, error: invokeError } = await supabase.functions.invoke<{ dream_signs: string[] }>(
    'extract-dream-signs',
    { method: 'POST' }
  );
  if (invokeError || !Array.isArray(result?.dream_signs)) {
    return cached?.signs ?? extractDreamSignsFromTags(data);
  }

  const signs = result.dream_signs.slice(0, MAX_DREAM_SIGNS);
  AsyncStorage.setItem(CACHE_KEY_PREFIX + userId, JSON.stringify({ signature, signs })).catch(() => {});
  return signs;
}
