import AsyncStorage from '@react-native-async-storage/async-storage';
import { TablesUpdate } from '../types/database';
import { supabase } from './supabase';

export type ExperienceLevel = 'never_heard' | 'know_basics' | 'tried_techniques' | 'experienced';
export type MainGoal = 'first_lucid_dream' | 'more_consistent' | 'explore_experiment' | 'self_discovery';
export type DreamsPerWeek = 'zero_to_one' | 'two_to_three' | 'four_to_five' | 'most_nights';
export type TriedTechnique = 'mild' | 'wild' | 'wbtb' | 'ssild';

export const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'never_heard', label: 'Never heard of it' },
  { value: 'know_basics', label: 'Know the basics' },
  { value: 'tried_techniques', label: 'Tried a few techniques' },
  { value: 'experienced', label: 'Experienced lucid dreamer' },
];

export const GOAL_OPTIONS: { value: MainGoal; label: string }[] = [
  { value: 'first_lucid_dream', label: 'Have my first lucid dream' },
  { value: 'more_consistent', label: 'Lucid dream more consistently' },
  { value: 'explore_experiment', label: 'Explore and experiment' },
  { value: 'self_discovery', label: 'Self-discovery and meaning' },
];

export const DREAMS_PER_WEEK_OPTIONS: { value: DreamsPerWeek; label: string }[] = [
  { value: 'zero_to_one', label: '0 to 1' },
  { value: 'two_to_three', label: '2 to 3' },
  { value: 'four_to_five', label: '4 to 5' },
  { value: 'most_nights', label: 'Most nights' },
];

export const TECHNIQUE_TRIED_OPTIONS: { value: TriedTechnique; label: string }[] = [
  { value: 'mild', label: 'MILD' },
  { value: 'wild', label: 'WILD' },
  { value: 'wbtb', label: 'WBTB' },
  { value: 'ssild', label: 'SSILD' },
];

export type OnboardingAnswers = {
  experienceLevel: ExperienceLevel;
  mainGoal: MainGoal;
  dreamsPerWeek: DreamsPerWeek;
  naturalWakeMinutes: number;
  bedtimeMinutes: number;
  triedTechniques: TriedTechnique[];
};

export async function saveOnboardingAnswers(userId: string, answers: OnboardingAnswers) {
  const patch: TablesUpdate<'profiles'> = {
    experience_level: answers.experienceLevel,
    main_goal: answers.mainGoal,
    dreams_per_week: answers.dreamsPerWeek,
    natural_wake_time: answers.naturalWakeMinutes,
    tried_techniques: answers.triedTechniques,
  };
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(error.message);

  // The bedtime they gave is when the nightly MILD prompt fires, so it lands in the same
  // column the notification settings screen edits.
  const { error: bedtimeError } = await supabase
    .from('notification_settings')
    .upsert({ user_id: userId, mild_prompt_time_minutes: answers.bedtimeMinutes }, { onConflict: 'user_id' });
  if (bedtimeError) throw new Error(bedtimeError.message);
}

export type OnboardingPrediction = {
  headline: string;
  detail: string;
};

// Detail varies by stated goal, independent of the headline's day-count bucket, so the
// reveal feels personalised on two axes rather than a single canned message.
function detailFor(mainGoal: MainGoal): string {
  switch (mainGoal) {
    case 'first_lucid_dream':
      return "We'll walk you through the 30 day track and a guided Wake Back to Bed session built for your very first one.";
    case 'more_consistent':
      return "We'll pair Wake Back to Bed sessions with reality check reminders tuned to how often you already remember dreams.";
    case 'explore_experiment':
      return "You'll have MILD, WILD, and SSILD ready to try, guided step by step whenever you want to switch it up.";
    case 'self_discovery':
      return 'Your journal will surface the people, places, and patterns that keep showing up, so your dreams start to mean something.';
  }
}

export function predictOutcome(answers: OnboardingAnswers): OnboardingPrediction {
  const detail = detailFor(answers.mainGoal);

  if (answers.experienceLevel === 'experienced' && answers.dreamsPerWeek === 'most_nights') {
    return { headline: 'You could have your first lucid dream within 7 days.', detail };
  }

  const someExperience =
    answers.experienceLevel === 'know_basics' || answers.experienceLevel === 'tried_techniques';
  if (someExperience && answers.dreamsPerWeek === 'two_to_three') {
    return {
      headline: 'Most people at your level have their first lucid dream within 14 days.',
      detail,
    };
  }

  return {
    headline: 'Follow the 30 day track and you could be lucid dreaming within a month.',
    detail,
  };
}

// --- Starter plan ------------------------------------------------------------------------
//
// What the quiz hands back before the paywall: a dream type, a technique to begin with and a
// first step on times the user chose. Saved on the device so the paywall can say it is
// protecting something that is already theirs.

export type StarterPlan = {
  dreamType: string;
  technique: string;
  techniqueWhy: string;
  firstStep: string;
};

const DREAM_TYPE_BY_GOAL: Record<MainGoal, string> = {
  first_lucid_dream: 'Awakening Dreamer',
  more_consistent: 'Rising Lucid Dreamer',
  explore_experiment: 'Dream Explorer',
  self_discovery: 'Dream Interpreter',
};

// Beginners begin with MILD; anyone who already has it moves on to the next piece of the
// stack they have not tried, in the order that builds on what they know.
function startingTechnique(tried: TriedTechnique[]): { technique: string; why: string } {
  if (!tried.includes('mild')) {
    return { technique: 'MILD', why: 'The most beginner-friendly technique, and it pairs with a dream journal.' };
  }
  if (!tried.includes('wbtb')) {
    return { technique: 'Wake Back To Bed', why: 'You know MILD. Waking mid-night first makes it far more likely to work.' };
  }
  if (!tried.includes('ssild')) {
    return { technique: 'SSILD', why: 'A light, sensory technique that stacks on the wake window you already know.' };
  }
  return { technique: 'WILD', why: "You've covered the rest. Entering a dream straight from waking is the next level." };
}

function formatClock(minutes: number) {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function buildStarterPlan(answers: OnboardingAnswers): StarterPlan {
  const { technique, why } = startingTechnique(answers.triedTechniques);
  const morning = (answers.naturalWakeMinutes + 15) % (24 * 60);
  return {
    dreamType: DREAM_TYPE_BY_GOAL[answers.mainGoal],
    technique,
    techniqueWhy: why,
    firstStep: `Tonight at ${formatClock(answers.bedtimeMinutes)}, set your intention. Tomorrow at ${formatClock(morning)}, write down what you remember.`,
  };
}

const STARTER_PLAN_KEY_PREFIX = 'nocturnal:starter-plan:';

export async function saveStarterPlan(userId: string, plan: StarterPlan) {
  try {
    await AsyncStorage.setItem(STARTER_PLAN_KEY_PREFIX + userId, JSON.stringify(plan));
  } catch {
    // The paywall just won't show the plan strip.
  }
}

export async function loadStarterPlan(userId: string): Promise<StarterPlan | null> {
  try {
    const raw = await AsyncStorage.getItem(STARTER_PLAN_KEY_PREFIX + userId);
    return raw ? (JSON.parse(raw) as StarterPlan) : null;
  } catch {
    return null;
  }
}
