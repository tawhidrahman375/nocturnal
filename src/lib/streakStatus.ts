import { activePause, PauseRange, pausedDaySet } from './pause';
import { computeStreaksWithFreezes, daysBetween, localDateString } from './streaks';

export type StreakStatusKind = 'new' | 'active' | 'atRisk' | 'frozen' | 'broken' | 'paused';

export type StreakStatus = {
  kind: StreakStatusKind;
  title: string;
  body: string;
};

type Input = {
  dreamedDates: string[];
  accountCreatedAt: Date;
  pauseRanges: PauseRange[];
  today?: Date;
};

const nights = (n: number) => `${n} ${n === 1 ? 'night' : 'nights'}`;

// Turns the streak numbers into something a person can read on a bad day. A streak that
// ended is never shown as a bare 0: the best run stays on the page and the way back is one
// entry. Computed on the client from the same history the profile columns are built from,
// so it also knows whether a freeze or a pause is what is holding the streak up.
export function describeStreak({ dreamedDates, accountCreatedAt, pauseRanges, today = new Date() }: Input): StreakStatus {
  const todayStr = localDateString(today);
  const paused = activePause(pauseRanges, todayStr);
  const { currentStreak, longestStreak, freezesRemaining, freezeUsedForCurrentStreak } =
    computeStreaksWithFreezes(dreamedDates, accountCreatedAt, today, pausedDaySet(pauseRanges));

  if (paused) {
    return {
      kind: 'paused',
      title: 'Streak paused',
      body:
        currentStreak > 0
          ? `Your ${nights(currentStreak)} are safe until ${formatDay(paused.end)}. Rest well.`
          : `Reminders are off until ${formatDay(paused.end)}. Rest well.`,
    };
  }

  if (dreamedDates.length === 0) {
    return {
      kind: 'new',
      title: 'Your first night is waiting',
      body: 'Log one dream, even a fragment, and your streak begins.',
    };
  }

  if (currentStreak === 0) {
    return {
      kind: 'broken',
      title: 'A fresh start',
      body:
        longestStreak > 1
          ? `Your best run of ${nights(longestStreak)} is still yours. One entry begins the next one.`
          : 'Missing a day is part of it. One entry begins your next run.',
    };
  }

  if (freezeUsedForCurrentStreak) {
    return {
      kind: 'frozen',
      title: 'A freeze covered yesterday',
      body: `Your ${nights(currentStreak)} live on. ${
        freezesRemaining > 0 ? `${freezesRemaining} freeze left.` : 'Another freeze arrives on Monday.'
      }`,
    };
  }

  const lastDay = [...dreamedDates].sort().at(-1);
  if (lastDay && daysBetween(lastDay, todayStr) >= 1) {
    return {
      kind: 'atRisk',
      title: `${nights(currentStreak)} and counting`,
      body: "Log today's dream to keep it going. A single line is enough.",
    };
  }

  return {
    kind: 'active',
    title: `${nights(currentStreak)} in a row`,
    body: 'Your recall is getting stronger every morning.',
  };
}

function formatDay(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}
