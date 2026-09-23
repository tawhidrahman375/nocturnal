const MAX_DREAM_SIGNS = 8;

// Recurring tags across a user's journal act as their personal "dream signs" —
// the recurring people, places, or events that can tip them off they're dreaming.
export function extractDreamSigns(dreams: { tags: string[] }[]): string[] {
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
    .slice(0, MAX_DREAM_SIGNS)
    .map((entry) => entry.display);
}
