import { daysBetween, localDateString } from './streaks';
import { supabase } from './supabase';
import { Tables } from '../types/database';

export type BeginnerTrackProgress = Tables<'beginner_track_progress'>;

export const TRACK_LENGTH = 30;

export type TrackPhase = 'reality-checks' | 'journaling' | 'wbtb' | 'mild';

export type TrackDay = {
  day: number;
  phase: TrackPhase;
  title: string;
  description: string;
};

export const PHASE_LABELS: Record<TrackPhase, string> = {
  'reality-checks': 'Reality checks',
  journaling: 'Journaling',
  wbtb: 'Wake Back to Bed',
  mild: 'MILD',
};

// Days 1-7 build the reality-check habit, 8-13 build recall and journaling,
// 14-20 introduce and practice Wake Back to Bed, 21-30 layer MILD on top of it all.
export const TRACK_DAYS: TrackDay[] = [
  {
    day: 1,
    phase: 'reality-checks',
    title: 'Turn on reality check reminders',
    description:
      'Open Reality Checks from your profile and set a schedule. These daytime nudges are the foundation everything else builds on.',
  },
  {
    day: 2,
    phase: 'reality-checks',
    title: 'The hand check',
    description: 'Every time a reminder fires, look at your hands and count your fingers. In a dream they blur, stretch, or miscount.',
  },
  {
    day: 3,
    phase: 'reality-checks',
    title: 'The text check',
    description: 'Read a line of text, look away, then read it again. Words shift and rearrange in dreams.',
  },
  {
    day: 4,
    phase: 'reality-checks',
    title: 'The push-through check',
    description: 'Push a finger against your opposite palm. In a dream it can push right through.',
  },
  {
    day: 5,
    phase: 'reality-checks',
    title: 'The time check',
    description: 'Check a clock or your phone, look away, then check it again. Time behaves strangely in dreams.',
  },
  {
    day: 6,
    phase: 'reality-checks',
    title: 'The breath check',
    description: "Try to breathe in with your nose pinched shut. If you still can, you're dreaming.",
  },
  {
    day: 7,
    phase: 'reality-checks',
    title: 'Reality checks on autopilot',
    description: "Do a check without waiting for the reminder. Notice one genuinely odd thing today and question it.",
  },
  {
    day: 8,
    phase: 'journaling',
    title: 'Start your dream journal',
    description: 'The moment you wake up, log whatever you remember in Journal. Even a single fragment counts.',
  },
  {
    day: 9,
    phase: 'journaling',
    title: 'Write in the present tense',
    description: "Record today's entry as if it's happening now. Writing this way sharpens recall over time.",
  },
  {
    day: 10,
    phase: 'journaling',
    title: 'Spot a dream sign',
    description: 'Tag one recurring detail in today\'s entry, a place, person, or event that keeps showing up.',
  },
  {
    day: 11,
    phase: 'journaling',
    title: 'Journal before you move',
    description: 'Recall and log your dream before getting out of bed or checking your phone. Movement erases recall fast.',
  },
  {
    day: 12,
    phase: 'journaling',
    title: 'Rate your recall',
    description: "Note in today's entry how vivid or vague the dream felt. Recall usually improves the more you track it.",
  },
  {
    day: 13,
    phase: 'journaling',
    title: 'Review your dream signs',
    description: 'Look back through your tagged signs. These recurring details are your personal lucidity triggers.',
  },
  {
    day: 14,
    phase: 'wbtb',
    title: 'Meet Wake Back to Bed',
    description: 'Open Wake Back to Bed and plan tonight\'s alarm. Waking mid-cycle is when lucid dreams become far more likely.',
  },
  {
    day: 15,
    phase: 'wbtb',
    title: 'Your first wake window',
    description: 'Stay up for the full wake window tonight and notice how alert you feel by the end of it.',
  },
  {
    day: 16,
    phase: 'wbtb',
    title: 'Dial in your wake time',
    description: 'If last night was hard to wake from, try a different sleep duration before tonight\'s alarm.',
  },
  {
    day: 17,
    phase: 'wbtb',
    title: 'Recall during the window',
    description: 'Use tonight\'s wake window to write down anything you remember before drifting back to sleep.',
  },
  {
    day: 18,
    phase: 'wbtb',
    title: 'Reality check + WBTB',
    description: 'During tonight\'s wake window, do a reality check before you go back to bed.',
  },
  {
    day: 19,
    phase: 'wbtb',
    title: 'Consistency check',
    description: "Set your WBTB alarm again tonight, even if last night didn't go perfectly. The habit matters more than any single night.",
  },
  {
    day: 20,
    phase: 'wbtb',
    title: 'Reflect on your WBTB week',
    description: "Look back at this week's sessions. What's working? Adjust your wake window if it needs tuning.",
  },
  {
    day: 21,
    phase: 'mild',
    title: 'Meet MILD',
    description: 'Learn the mantra: "Next time I\'m dreaming, I will remember I\'m dreaming." You\'ll repeat it during tonight\'s wake window.',
  },
  {
    day: 22,
    phase: 'mild',
    title: 'Say it with intention',
    description: 'During tonight\'s wake window, repeat the mantra slowly until it feels less like words and more like a plan.',
  },
  {
    day: 23,
    phase: 'mild',
    title: 'Visualize while you repeat',
    description: 'While repeating the mantra, picture yourself back inside a recent dream, noticing you\'re dreaming.',
  },
  {
    day: 24,
    phase: 'mild',
    title: 'Bring in a dream sign',
    description: 'Hold one of your tagged dream signs in mind while doing MILD tonight.',
  },
  {
    day: 25,
    phase: 'mild',
    title: 'Full stack tonight',
    description: 'Run all three together: Wake Back to Bed, a reality check in the window, then MILD before you sleep.',
  },
  {
    day: 26,
    phase: 'mild',
    title: 'Stay patient',
    description: 'Lucid dreams often arrive when least expected. Keep tonight\'s routine going regardless of last night\'s result.',
  },
  {
    day: 27,
    phase: 'mild',
    title: 'Reality checks, still',
    description: "Don't drop the daytime habit. It's still reinforcing everything you're doing at night.",
  },
  {
    day: 28,
    phase: 'mild',
    title: 'Journal every angle',
    description: 'Log tonight\'s dream in full, lucid or not, and note anything that felt even slightly unusual.',
  },
  {
    day: 29,
    phase: 'mild',
    title: 'One more full stack',
    description: 'Run reality checks, Wake Back to Bed, and MILD together again. Repetition is what builds the reflex.',
  },
  {
    day: 30,
    phase: 'mild',
    title: 'Graduate your toolkit',
    description: "Look back over 30 days of practice. Reality checks, journaling, WBTB, and MILD are yours to keep using.",
  },
];

export function getTrackDay(day: number): TrackDay {
  const clamped = Math.min(Math.max(day, 1), TRACK_LENGTH);
  return TRACK_DAYS[clamped - 1];
}

export function currentDayNumber(startedAt: string, today: Date = new Date()) {
  const elapsed = daysBetween(startedAt, localDateString(today));
  return Math.min(TRACK_LENGTH, Math.max(1, elapsed + 1));
}

export async function fetchBeginnerTrackProgress(userId: string) {
  const { data, error } = await supabase
    .from('beginner_track_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function startBeginnerTrack(userId: string) {
  const { data, error } = await supabase
    .from('beginner_track_progress')
    .upsert({ user_id: userId, started_at: localDateString(new Date()) }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchCompletedDays(userId: string) {
  const { data, error } = await supabase
    .from('beginner_track_completions')
    .select('day_number')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((row) => row.day_number));
}

export async function completeTrackDay(userId: string, day: number) {
  const { error } = await supabase
    .from('beginner_track_completions')
    .insert({ user_id: userId, day_number: day });
  if (error) throw new Error(error.message);
}

export async function uncompleteTrackDay(userId: string, day: number) {
  const { error } = await supabase
    .from('beginner_track_completions')
    .delete()
    .eq('user_id', userId)
    .eq('day_number', day);
  if (error) throw new Error(error.message);
}
