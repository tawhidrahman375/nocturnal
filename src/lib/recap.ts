import { computeDreamIdentity, DreamIdentity } from './dreamIdentity';
import { DREAM_CATEGORY_LABELS, parseDreamCategory } from './dreamCategories';
import { localDateString } from './streaks';
import { Tables } from '../types/database';

type DreamLike = Pick<Tables<'dreams'>, 'dreamed_at' | 'is_lucid' | 'category' | 'content' | 'tags'>;

export type MonthlyRecap = {
  periodLabel: string;
  dreams: number;
  lucid: number;
  previousLucid: number;
  previousDreams: number;
  activeNights: number;
  topSign: string | null;
  topCategory: string | null;
  identity: DreamIdentity;
};

const MS_PER_DAY = 86_400_000;

function mostCommon<T extends string>(values: T[]) {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best: T | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

// A rolling 30 days against the 30 before it, so the recap is always about "lately" and
// the comparison can go either way. It never reads as a bill: a quiet month still gets a
// card, framed around what is left to come back to.
export function computeMonthlyRecap(dreams: DreamLike[], longestStreak: number, now: Date = new Date()): MonthlyRecap {
  const thisStart = localDateString(new Date(now.getTime() - 29 * MS_PER_DAY));
  const prevStart = localDateString(new Date(now.getTime() - 59 * MS_PER_DAY));
  const current = dreams.filter((d) => d.dreamed_at >= thisStart);
  const previous = dreams.filter((d) => d.dreamed_at >= prevStart && d.dreamed_at < thisStart);

  const categories = current
    .map((d) => parseDreamCategory(d.category))
    .filter((c): c is NonNullable<typeof c> => c !== null && c !== 'unknown' && c !== 'lucid');
  const topCategory = mostCommon(categories);

  const start = new Date(now.getTime() - 29 * MS_PER_DAY);
  const periodLabel = `${start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} to ${now.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;

  return {
    periodLabel,
    dreams: current.length,
    lucid: current.filter((d) => d.is_lucid).length,
    previousLucid: previous.filter((d) => d.is_lucid).length,
    previousDreams: previous.length,
    activeNights: new Set(current.map((d) => d.dreamed_at)).size,
    topSign: mostCommon(current.flatMap((d) => d.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))),
    topCategory: topCategory ? DREAM_CATEGORY_LABELS[topCategory].toLowerCase() : null,
    identity: computeDreamIdentity(dreams, longestStreak),
  };
}

// The plain-text half of the share. There is no image capture library in the app, so the
// card travels as words, which also means it pastes cleanly anywhere. The invite line is
// what turns a brag into an introduction.
export function recapShareMessage(recap: MonthlyRecap, inviteUrl: string) {
  const lines = [
    `My month in dreams on Nocturnal (${recap.periodLabel})`,
    `${recap.identity.label}: ${recap.identity.tagline}`,
    `${recap.dreams} dreams logged · ${recap.lucid} lucid · ${recap.activeNights} nights remembered`,
  ];
  if (recap.topSign) lines.push(`Most common dream sign: ${recap.topSign}`);
  lines.push('', `Learn to lucid dream with me: ${inviteUrl}`);
  return lines.join('\n');
}

const INVITE_BASE_URL = 'https://nocturnal.app/invite';

// A short code from the user's id, stable and non-reversible enough to print. Redeeming it
// needs a backend that does not exist yet, so for now it only identifies who shared.
export function inviteCodeFor(userId: string) {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export function inviteUrlFor(userId: string) {
  return `${INVITE_BASE_URL}/${inviteCodeFor(userId)}`;
}
