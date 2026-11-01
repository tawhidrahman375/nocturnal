import { supabase } from './supabase';

export type LucidityStage = 'Waking up' | 'Noticing' | 'Aware' | 'Ready' | 'On the edge';

export type LucidityInputs = {
  // Distinct days with a journal entry in the last 14.
  recallDays14: number;
  // Reality-check reminders actually opened in the last 7 days.
  realityChecks7: number;
  // Completed Wake Back to Bed sessions in the last 14 days.
  wbtbSessions14: number;
  lucidDreamsTotal: number;
};

export type LucidityProgress = {
  // 0 to 1.
  value: number;
  stage: LucidityStage;
  // The single practice that would raise it most, as an invitation.
  nextStep: string;
};

// Progress toward lucidity, as opposed to progress toward a streak. Every part of it is a
// rolling window, so it rises with practice and drifts back down without it: the user is
// always either closing in on a lucid dream or drifting away from one, and the streak is
// just a by-product of the work that moves it.
export function computeLucidity(inputs: LucidityInputs): LucidityProgress {
  const recall = Math.min(inputs.recallDays14 / 7, 1);
  const checks = Math.min(inputs.realityChecks7 / 14, 1);
  const wbtb = Math.min(inputs.wbtbSessions14 / 4, 1);
  const lucid = Math.min(inputs.lucidDreamsTotal / 3, 1);

  const value = recall * 0.3 + checks * 0.25 + wbtb * 0.25 + lucid * 0.2;

  const stage: LucidityStage =
    value < 0.15 ? 'Waking up' : value < 0.4 ? 'Noticing' : value < 0.65 ? 'Aware' : value < 0.85 ? 'Ready' : 'On the edge';

  const gaps: { score: number; text: string }[] = [
    { score: recall / 0.3, text: 'Log a dream every morning. Recall is the base everything else sits on.' },
    { score: checks / 0.25, text: 'Open your reality check reminders today. Each one trains the habit you need inside a dream.' },
    { score: wbtb / 0.25, text: 'Plan a Wake Back to Bed night. It is the single biggest jump toward a lucid dream.' },
  ];
  gaps.sort((a, b) => a.score - b.score);
  const nextStep =
    value >= 0.85
      ? 'Everything is in place. Keep the routine going and set your intention tonight.'
      : gaps[0].text;

  return { value, stage, nextStep };
}

const MS_PER_DAY = 86_400_000;

export async function fetchLucidityInputs(
  userId: string,
  dreams: { dreamed_at: string; is_lucid: boolean }[],
  now: Date = new Date()
): Promise<LucidityInputs> {
  const sevenDaysAgo = new Date(now.getTime() - 7 * MS_PER_DAY).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * MS_PER_DAY).toISOString();

  const [checks, sessions] = await Promise.all([
    supabase
      .from('reality_check_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'opened')
      .gte('created_at', sevenDaysAgo),
    supabase
      .from('wbtb_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', fourteenDaysAgo),
  ]);

  const cutoff = new Date(now.getTime() - 14 * MS_PER_DAY);
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  const recentDays = new Set(dreams.filter((d) => d.dreamed_at >= cutoffStr).map((d) => d.dreamed_at));

  return {
    recallDays14: recentDays.size,
    realityChecks7: checks.count ?? 0,
    wbtbSessions14: sessions.count ?? 0,
    lucidDreamsTotal: dreams.filter((d) => d.is_lucid).length,
  };
}
