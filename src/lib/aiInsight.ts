// STUB — there is no AI insight layer in the app yet. This file is the placeholder
// integration point for milestone 3 ("first AI insight"): whatever code eventually
// generates and displays a dream insight should, the first time it does so for a given
// user, call useMilestoneCheck().triggerFirstInsightMilestone() instead of (or right
// before) rendering the insight itself.
//
// hasGeneratedFirstInsight always returns false so nothing fires from real usage today.
// Replace its body with a real check once the AI layer ships — e.g. a
// `first_insight_shown_at` timestamp column on profiles, mirroring the pattern used for
// mild_intention_set_at in lib/tonightRoutine.ts.
export async function hasGeneratedFirstInsight(_userId: string): Promise<boolean> {
  return false;
}
