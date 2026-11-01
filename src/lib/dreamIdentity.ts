import { Tables } from '../types/database';

type DreamLike = Pick<Tables<'dreams'>, 'is_lucid' | 'category' | 'content' | 'tags'>;

export type DreamIdentity = {
  id: string;
  label: string;
  tagline: string;
  // What would move the user toward the next identity, said as an invitation.
  next: string;
};

const MIN_DREAMS_FOR_IDENTITY = 3;

// A name for the way this person dreams, earned from their own entries and re-derived every
// time, so it can change as they do. Ordered most-specific first: the first rule that holds
// wins, so a lucid dreamer is a lucid dreamer before they are a vivid one.
export function computeDreamIdentity(dreams: DreamLike[], longestStreak: number): DreamIdentity {
  const total = dreams.length;
  const lucid = dreams.filter((d) => d.is_lucid).length;
  const count = (category: string) => dreams.filter((d) => d.category === category).length;
  const nightmares = count('nightmare');
  const edge = count('surreal') + count('astral projection') + count('sleep paralysis');
  const averageLength = total > 0 ? dreams.reduce((sum, d) => sum + d.content.length, 0) / total : 0;
  const distinctTags = new Set(dreams.flatMap((d) => d.tags.map((t) => t.toLowerCase()))).size;

  if (total < MIN_DREAMS_FOR_IDENTITY) {
    const remaining = MIN_DREAMS_FOR_IDENTITY - total;
    return {
      id: 'new',
      label: 'New Dreamer',
      tagline: 'Your dream identity is still forming.',
      next: `Log ${remaining} more ${remaining === 1 ? 'dream' : 'dreams'} and Nocturnal will name the way you dream.`,
    };
  }

  if (lucid >= 5 && lucid / total >= 0.2) {
    return {
      id: 'navigator',
      label: 'Lucid Navigator',
      tagline: "You don't just visit your dreams. You steer them.",
      next: 'Keep going. Stabilising and extending lucid dreams is the next craft.',
    };
  }

  if (lucid >= 1) {
    return {
      id: 'explorer',
      label: 'Lucid Explorer',
      tagline: "You've crossed the line between dreaming and knowing.",
      next: `${Math.max(1, 5 - lucid)} more lucid ${5 - lucid === 1 ? 'dream makes' : 'dreams make'} you a Lucid Navigator.`,
    };
  }

  if (nightmares >= 3 && nightmares / total >= 0.25) {
    return {
      id: 'tamer',
      label: 'Nightmare Tamer',
      tagline: 'You face the dark ones and write them down anyway.',
      next: 'Noticing you are dreaming is the surest way to turn a nightmare around.',
    };
  }

  if (edge >= 3) {
    return {
      id: 'edge',
      label: 'Edge Walker',
      tagline: 'Your dreams live close to the border of waking.',
      next: 'That border is exactly where lucidity begins. Your first lucid dream is closer than most.',
    };
  }

  if (averageLength >= 280) {
    return {
      id: 'vivid',
      label: 'Vivid Dreamer',
      tagline: 'You bring back whole worlds, not fragments.',
      next: 'Rich recall is the best foundation for lucidity. Add Wake Back to Bed to use it.',
    };
  }

  if (longestStreak >= 7) {
    return {
      id: 'chronicler',
      label: 'Steady Chronicler',
      tagline: 'You show up for your dreams, night after night.',
      next: 'Consistency is done. Pairing it with MILD is the step to lucidity.',
    };
  }

  if (distinctTags >= 8) {
    return {
      id: 'hunter',
      label: 'Pattern Hunter',
      tagline: 'You notice what keeps coming back.',
      next: 'Your dream signs are your triggers. Use them in your reality checks.',
    };
  }

  return {
    id: 'collector',
    label: 'Dream Collector',
    tagline: 'You keep a record. The patterns come next.',
    next: 'Log a few more nights and a sharper identity will emerge.',
  };
}
