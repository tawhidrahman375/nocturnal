import {
  SSILD_CYCLES_PER_ROUND,
  SSILD_REST_SECONDS,
  SSILD_ROUNDS,
  SSILD_SENSE_SECONDS,
  MILD_MANTRA,
  RECOMMENDED_SLEEP_MINUTES,
} from './wbtb';

export type TechniqueId = 'mild' | 'wild' | 'wbtb' | 'ssild';

export const TECHNIQUE_IDS: readonly TechniqueId[] = ['mild', 'wild', 'wbtb', 'ssild'];

export type TechniqueSection = { heading: string; body: string };
export type PracticeStep = { title: string; body: string };

export type Technique = {
  id: TechniqueId;
  name: string;
  fullName: string;
  tagline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  // How long one attempt takes, and when in the night it fits.
  timeNeeded: string;
  bestFor: string;
  sections: TechniqueSection[];
  tips: string[];
  practice: { intro: string; steps: PracticeStep[] };
};

const SLEEP_HOURS = RECOMMENDED_SLEEP_MINUTES / 60;
const SSILD_ROUND_SECONDS = SSILD_SENSE_SECONDS * 3 * SSILD_CYCLES_PER_ROUND;

// Everything the Technique Library shows. The explanations are free to read; only the guided
// practice is Pro (see TechniqueDetailScreen). The numbers here come from the same constants
// the WBTB session uses, so the library and a real session never disagree.
export const TECHNIQUES: Record<TechniqueId, Technique> = {
  mild: {
    id: 'mild',
    name: 'MILD',
    fullName: 'Mnemonic Induction of Lucid Dreams',
    tagline: 'Plant an intention to notice you are dreaming.',
    difficulty: 'Beginner',
    timeNeeded: '10 to 15 minutes',
    bestFor: 'Anyone who already remembers a dream or two each week.',
    sections: [
      {
        heading: 'What it is',
        body: 'MILD trains your prospective memory, the part of your mind that remembers to do something in the future. You rehearse a single intention, that next time you dream you will realise it, until it sticks as you fall asleep.',
      },
      {
        heading: 'How it works',
        body: 'As you drift off, you repeat a short phrase while picturing yourself back inside a recent dream. You imagine spotting something odd in that dream and recognising it for what it is. The rehearsal links the feeling of a dream with the thought "I am dreaming", so the thought can fire on its own later.',
      },
      {
        heading: 'When to use it',
        body: 'MILD works best when you fall asleep soon after waking in the early morning, when dreams are long and vivid. It pairs well with Wake Back to Bed, and it is the easiest technique to start with.',
      },
    ],
    tips: [
      'Mean the intention. Repeating the words without focus does very little.',
      'Use a dream you actually remember. A fresh dream makes the picture vivid.',
      'Keep your phrase short and in your own words if the standard one feels stiff.',
      'If you fall asleep mid-phrase, that is the technique working.',
    ],
    practice: {
      intro: 'A guided rehearsal. Do this lying down, ready to sleep, ideally after waking in the night.',
      steps: [
        { title: 'Settle in', body: 'Lie down, close your eyes, and let your body go heavy. Take three slow breaths.' },
        { title: 'Recall a dream', body: 'Bring back the most recent dream you remember. Notice who was there and how it felt.' },
        { title: 'Set the intention', body: `Say it slowly in your mind: "${MILD_MANTRA}" Mean each word.` },
        { title: 'Re-enter the dream', body: 'Picture yourself back in that dream. Look around, and let it feel real.' },
        { title: 'Spot the sign', body: 'Notice something strange in the scene. Realise: this is a dream. Imagine what you would do next.' },
        { title: 'Repeat and drift', body: 'Keep repeating the intention and the picture until sleep takes over. Do not wait for a signal.' },
      ],
    },
  },

  wild: {
    id: 'wild',
    name: 'WILD',
    fullName: 'Wake Initiated Lucid Dream',
    tagline: 'Stay aware as your body falls asleep, and slip into a dream.',
    difficulty: 'Advanced',
    timeNeeded: '15 to 45 minutes',
    bestFor: 'Practised dreamers who can lie still and relaxed without drifting off.',
    sections: [
      {
        heading: 'What it is',
        body: 'WILD takes you straight from being awake into a dream with no gap in awareness. Instead of noticing a dream after it starts, you keep your mind alert while your body falls asleep.',
      },
      {
        heading: 'How it works',
        body: 'As you relax, you pass through a stage of shifting shapes, sounds and body sensations. By staying calm and quietly aware through that stage, the imagery builds into a full dream scene around you, and you are already lucid.',
      },
      {
        heading: 'What to expect',
        body: 'You may feel heavy, buzzing or unable to move for a moment. This is sleep paralysis, which is harmless and passes, though it can feel strange the first time. Treat it as a sign you are close, and stay relaxed.',
      },
    ],
    tips: [
      'Choose a position you can hold without moving again. Fidgeting resets the process.',
      'Do not chase the images. Watch them come, and stay soft.',
      'Itches and urges to swallow pass if you leave them alone for a minute.',
      'Lying awake for a long time is normal. It is not a sign you are failing.',
    ],
    practice: {
      intro: 'A guided WILD attempt. Do it after waking in the night, when you fall back asleep quickly.',
      steps: [
        { title: 'Get comfortable', body: 'Pick a position you can hold without moving. Settle fully, and decide not to adjust again.' },
        { title: 'Relax the body', body: 'Move your attention from your feet up to your head, letting each part go loose and heavy.' },
        { title: 'Slow the breath', body: 'Breathe slowly and evenly. Let your mind stay quiet but awake.' },
        { title: 'Watch the darkness', body: 'Rest your attention on the dark behind your eyelids. Let colours, shapes and sounds appear without reacting.' },
        { title: 'Stay aware', body: 'If your body feels heavy or tingly, that is the cue. Stay calm and keep watching.' },
        { title: 'Step in', body: 'When a scene forms, let it grow. Move into it gently, as if stepping through a doorway.' },
      ],
    },
  },

  wbtb: {
    id: 'wbtb',
    name: 'WBTB',
    fullName: 'Wake Back to Bed',
    tagline: 'Wake in the night, stay up briefly, then go back to sleep.',
    difficulty: 'Beginner',
    timeNeeded: `${SLEEP_HOURS} hours of sleep, then 20 to 30 minutes awake`,
    bestFor: 'Boosting any other technique. It is the biggest single upgrade you can make.',
    sections: [
      {
        heading: 'What it is',
        body: 'Wake Back to Bed is a schedule more than a technique. You sleep for several hours, wake on purpose, stay up for a short while, then return to sleep. It does not induce a lucid dream by itself, it sets the stage for one.',
      },
      {
        heading: 'Why it works',
        body: 'REM sleep, where most vivid dreaming happens, gets longer as the night goes on. Waking after about six hours puts you just before a long REM period, with a rested mind that is alert enough to practise a technique and then fall straight back into a dream.',
      },
      {
        heading: 'Making it work',
        body: 'Keep the wake window short and calm. Write down any dream you remember, keep the lights low, then run MILD, WILD or SSILD as you lie back down. Too long awake and you will struggle to sleep again.',
      },
    ],
    tips: [
      `Around ${SLEEP_HOURS} hours of sleep is a good starting point. Adjust by 30 minutes to find your own.`,
      'Keep lights dim and screens away. Bright light wakes your body fully.',
      'Write down any dream before you do anything else, because it fades fast.',
      'Try it two or three nights a week. Doing it every night leaves you tired.',
    ],
    practice: {
      intro: 'A walkthrough of a full Wake Back to Bed night. Read it through before you plan tonight.',
      steps: [
        { title: 'Plan your night', body: `Pick a bedtime and set an alarm for about ${SLEEP_HOURS} hours later. Keep it gentle, not jarring.` },
        { title: 'Go to sleep as usual', body: 'Do not try to stay aware. Your only job is to sleep.' },
        { title: 'Wake and capture', body: 'When the alarm goes, write down anything you remember from your dream, even a fragment.' },
        { title: 'Stay up briefly', body: 'Stay awake for 20 to 30 minutes. Keep the lights low and your mind calm.' },
        { title: 'Choose a technique', body: 'Decide between MILD, WILD or SSILD. Beginners should start with MILD.' },
        { title: 'Return to bed', body: 'Lie back down and practise your technique as you fall asleep. Let sleep come.' },
      ],
    },
  },

  ssild: {
    id: 'ssild',
    name: 'SSILD',
    fullName: 'Senses Initiated Lucid Dream',
    tagline: 'Cycle your attention lightly through sight, sound and touch.',
    difficulty: 'Intermediate',
    timeNeeded: '5 to 10 minutes',
    bestFor: 'People who find MILD hard to keep focused, or who want something short.',
    sections: [
      {
        heading: 'What it is',
        body: 'SSILD asks you to pass your attention, very lightly, through the senses in turn: sight, then sound, then touch. You repeat the loop a few times, then lie still and let sleep arrive.',
      },
      {
        heading: 'How it works',
        body: 'The gentle sensory focus keeps part of your mind switched on while your body settles. Done after waking in the night, the light attention tends to carry through into the next dream, where you notice you are aware.',
      },
      {
        heading: 'Keep it light',
        body: 'The key is a soft touch. You are not trying to see, hear or feel anything specific, just to notice whatever is already there. Forcing it wakes you up.',
      },
    ],
    tips: [
      'Eyes stay closed. Look softly at the dark rather than straining.',
      'Notice, do not hunt. If you hear nothing, notice the quiet.',
      'A sleepy, floaty feeling is a good sign. Let it happen.',
      'If you fall asleep between rounds, that is fine.',
    ],
    practice: {
      intro: `A guided SSILD session. A full session is ${SSILD_ROUNDS} rounds, each of ${SSILD_CYCLES_PER_ROUND} loops, with a short rest between.`,
      steps: [
        { title: 'Settle in', body: 'Lie comfortably with your eyes closed. Breathe slowly and let your body soften.' },
        { title: 'Sight', body: `Spend about ${SSILD_SENSE_SECONDS} seconds softly looking into the darkness ahead of you. Notice any colour or light.` },
        { title: 'Sound', body: `Spend about ${SSILD_SENSE_SECONDS} seconds on whatever you can hear, including the quiet.` },
        { title: 'Touch', body: `Spend about ${SSILD_SENSE_SECONDS} seconds on where your body meets the bed: weight, warmth, texture.` },
        { title: 'Repeat the loop', body: `Go around sight, sound and touch ${SSILD_CYCLES_PER_ROUND} times. That is one round of about ${SSILD_ROUND_SECONDS} seconds.` },
        { title: 'Rest, then go again', body: `Lie still for about ${SSILD_REST_SECONDS} seconds, then start the next round. After round ${SSILD_ROUNDS}, let go and sleep.` },
      ],
    },
  },
};
