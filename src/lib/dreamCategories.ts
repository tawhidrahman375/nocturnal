import { supabase } from './supabase';

// The fixed category list. Mirrors supabase/functions/categorise-dream/index.ts, which
// assigns one per dream: `lucid` in code when the user marked the dream lucid, otherwise
// whatever Claude Haiku picks, falling back to `unknown`.
export const DREAM_CATEGORIES = [
  'lucid',
  'nightmare',
  'adventure',
  'emotional',
  'mundane',
  'surreal',
  'recurring',
  'sleep paralysis',
  'astral projection',
  'unknown',
] as const;

export type DreamCategory = (typeof DREAM_CATEGORIES)[number];

export const DREAM_CATEGORY_LABELS: Record<DreamCategory, string> = {
  lucid: 'Lucid',
  nightmare: 'Nightmare',
  adventure: 'Adventure',
  emotional: 'Emotional',
  mundane: 'Mundane',
  surreal: 'Surreal',
  recurring: 'Recurring',
  'sleep paralysis': 'Sleep paralysis',
  'astral projection': 'Astral projection',
  unknown: 'Unknown',
};

// `dreams.category` is a plain text column, so anything could be in it. Null, or a value
// outside the list, means "no badge".
export function parseDreamCategory(value: string | null): DreamCategory | null {
  return (DREAM_CATEGORIES as readonly string[]).includes(value ?? '') ? (value as DreamCategory) : null;
}

type CategoriseDreamInput = { dreamId: string; content: string; isLucid: boolean };

// Calls the categorise-dream Edge Function, which writes the category onto the dream row
// itself and returns it. Callers fire this after a dream is saved and do not await it
// on the save path; a failure just leaves the column null.
export async function categoriseDream({ dreamId, content, isLucid }: CategoriseDreamInput): Promise<DreamCategory | null> {
  const { data, error } = await supabase.functions.invoke<{ category: string }>('categorise-dream', {
    method: 'POST',
    body: { dream_id: dreamId, content, is_lucid: isLucid },
  });
  if (error) throw new Error(error.message);
  return parseDreamCategory(data?.category ?? null);
}
