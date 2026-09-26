import { Tables } from '../types/database';

export type WbtbSession = Tables<'wbtb_sessions'>;
export type WbtbStatus = 'scheduled' | 'active' | 'completed' | 'skipped' | 'missed' | 'cancelled';
export type WbtbStage = 'alarm' | 'recall' | 'window' | 'technique' | 'closed';

export type WbtbTechnique = 'mild' | 'wild' | 'ssild';

export const TECHNIQUE_OPTIONS: readonly WbtbTechnique[] = ['mild', 'wild', 'ssild'];

export const TECHNIQUE_LABELS: Record<WbtbTechnique, string> = {
  mild: 'MILD',
  wild: 'WILD',
  ssild: 'SSILD',
};

export const TECHNIQUE_DESCRIPTIONS: Record<WbtbTechnique, string> = {
  mild: 'Repeat an intention while picturing yourself back in a dream.',
  wild: 'Stay still and let awareness carry through into a dream.',
  ssild: 'Cycle attention through sight, sound, and touch.',
};

export const SLEEP_DURATION_OPTIONS = [300, 330, 360] as const;
// Six hours lands late in the fourth ~90 min cycle, where REM periods are longest.
export const RECOMMENDED_SLEEP_MINUTES = 360;

export const WAKE_WINDOW_OPTIONS = [20, 25, 30] as const;
export const DEFAULT_WAKE_WINDOW_MINUTES = 20;

export const MILD_MANTRA = "Next time I'm dreaming, I will remember I'm dreaming.";

// Closing copy for ClosedStage — technique-aware since MILD_MANTRA only fits MILD.
export const TECHNIQUE_CLOSING_LINES: Record<WbtbTechnique, string> = {
  mild: MILD_MANTRA,
  wild: 'Let the images come. Stay soft, stay aware.',
  ssild: 'Cycles complete. Let go, and let sleep take over.',
};

// WILD: if this many minutes pass in the passive phase with no interaction, a quiet
// reassurance line appears — lying awake this long is normal, not a stall.
export const WILD_REASSURANCE_MINUTES = 15;

// SSILD: seconds spent on each sense per cycle, cycles per round, seconds of rest
// between rounds, and how many rounds make up a full session.
export const SSILD_SENSE_SECONDS = 15;
export const SSILD_CYCLES_PER_ROUND = 3;
export const SSILD_REST_SECONDS = 45;
export const SSILD_ROUNDS = 3;

export const MINUTE_MS = 60_000;
export const SECOND_MS = 1000;
const SLEEP_TIME_STEP_MINUTES = 15;

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * MINUTE_MS);
}

export function defaultSleepTime(now: Date) {
  const rounded = new Date(now);
  rounded.setSeconds(0, 0);
  rounded.setMinutes(
    Math.ceil(rounded.getMinutes() / SLEEP_TIME_STEP_MINUTES) * SLEEP_TIME_STEP_MINUTES
  );
  return rounded;
}

export function calculateWakeTime(sleepAt: Date, sleepMinutes: number) {
  return addMinutes(sleepAt, sleepMinutes);
}

export function wakeWindowEndsAt(session: WbtbSession) {
  return session.woke_at ? addMinutes(new Date(session.woke_at), session.wake_window_minutes) : null;
}

export function stageForSession(session: WbtbSession): WbtbStage {
  const status = session.status as WbtbStatus;
  if (status === 'scheduled') return 'alarm';
  if (status === 'active') return session.wake_window_ended_at ? 'technique' : 'window';
  return 'closed';
}

export function formatClock(date: Date) {
  const hours = date.getHours();
  return {
    hour: String(hours % 12 || 12),
    minute: String(date.getMinutes()).padStart(2, '0'),
    period: hours < 12 ? 'AM' : 'PM',
  };
}

export function formatTime(date: Date) {
  const { hour, minute, period } = formatClock(date);
  return `${hour}:${minute} ${period}`;
}

export function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
