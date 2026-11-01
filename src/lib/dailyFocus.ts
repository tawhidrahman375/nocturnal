export type DailyFocus = {
  id: string;
  kind: 'Reality check' | 'Recall' | 'Intention' | 'Wake window' | 'Awareness';
  title: string;
  body: string;
};

// The 6am boundary the nightly routine already uses (lib/tonightRoutine.ts), so the focus
// and the routine card turn over together.
const RESET_HOUR = 6;
const MS_PER_DAY = 86_400_000;

const FOCUSES: DailyFocus[] = [
  {
    id: 'hands',
    kind: 'Reality check',
    title: 'Count your fingers, properly',
    body: 'Every time you check the time today, look at your hands first. Slow down enough to count.',
  },
  {
    id: 'recall-before-moving',
    kind: 'Recall',
    title: 'Hold still when you wake',
    body: 'Tomorrow, keep your eyes closed for ten seconds before reaching for your phone. Let the last scene come back.',
  },
  {
    id: 'mantra',
    kind: 'Intention',
    title: 'One sentence, said like you mean it',
    body: 'As you fall asleep tonight: "Next time I\'m dreaming, I\'ll know it." Say it slowly, three times.',
  },
  {
    id: 'odd-thing',
    kind: 'Awareness',
    title: 'Notice one odd thing',
    body: 'Find one thing today that would be strange in a dream, then ask yourself if you are awake.',
  },
  {
    id: 'text-check',
    kind: 'Reality check',
    title: 'Read it twice',
    body: 'Read any line of text, look away, and read it again. In a dream, the words usually change.',
  },
  {
    id: 'wake-window',
    kind: 'Wake window',
    title: 'Treat the wake window as the main event',
    body: 'If you plan a WBTB tonight, stay properly awake for the whole window. It is where most lucid dreams begin.',
  },
  {
    id: 'write-first-line',
    kind: 'Recall',
    title: 'Write one line, whatever it is',
    body: 'A colour, a face, a feeling. Recall grows from the smallest fragment written down.',
  },
  {
    id: 'push-through',
    kind: 'Reality check',
    title: 'Push a finger through your palm',
    body: 'Do it gently, and expect it to stay solid. Doing it expecting otherwise is what makes it work at night.',
  },
  {
    id: 'visualise',
    kind: 'Intention',
    title: 'Rehearse the moment you realise',
    body: 'Before sleep, picture a recent dream and see yourself noticing "this is a dream" inside it.',
  },
];

function dayIndexFor(routineDate: Date) {
  return Math.floor(
    new Date(routineDate.getFullYear(), routineDate.getMonth(), routineDate.getDate()).getTime() / MS_PER_DAY
  );
}

function routineDay(now: Date) {
  return now.getHours() < RESET_HOUR ? new Date(now.getTime() - MS_PER_DAY) : now;
}

// Chosen from the date alone, so it changes on its own at 6am whether or not the app is
// open, and two opens on the same day agree. When the user has dream signs, every third
// day is about one of theirs.
export function focusFor(now: Date, dreamSigns: string[]): DailyFocus {
  const index = dayIndexFor(routineDay(now));
  if (dreamSigns.length > 0 && index % 3 === 0) {
    const sign = dreamSigns[Math.floor(index / 3) % dreamSigns.length];
    return {
      id: `sign-${sign}`,
      kind: 'Awareness',
      title: `Watch for "${sign}"`,
      body: `It has shown up in your dreams before. If it appears today, stop and ask yourself if you are dreaming.`,
    };
  }
  return FOCUSES[index % FOCUSES.length];
}

export function msUntilFocusChanges(now: Date) {
  const next = new Date(now);
  next.setHours(RESET_HOUR, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// The tags the user keeps coming back to, most frequent first. Read straight from the
// journal so the Home screen never waits on a network call for it.
export function topDreamSigns(dreams: { tags: string[] }[], limit = 5) {
  const counts = new Map<string, number>();
  for (const dream of dreams) {
    for (const tag of dream.tags) {
      const sign = tag.trim().toLowerCase();
      if (sign) counts.set(sign, (counts.get(sign) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([sign]) => sign);
}
