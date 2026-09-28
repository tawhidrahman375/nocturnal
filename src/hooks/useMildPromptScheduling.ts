import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { notificationsSupported, requestMildPromptPermission, scheduleMildPrompt } from '../lib/notifications';
import { supabase } from '../lib/supabase';
import { RECOMMENDED_SLEEP_MINUTES } from '../lib/wbtb';

const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_BEDTIME_MINUTES = 22 * 60; // 22:00, per spec, when no bedtime is on file.

// Same derivation WbtbSetupScreen uses to default its own bedtime picker: the user's
// onboarding-recorded natural wake time, minus the recommended sleep duration. This is
// the only "stored sleep schedule" that exists independent of a specific WBTB session.
function bedtimeMinutesFor(naturalWakeTime: number | null) {
  if (naturalWakeTime == null) return DEFAULT_BEDTIME_MINUTES;
  return ((naturalWakeTime - RECOMMENDED_SLEEP_MINUTES) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

// Keeps the nightly MILD-prompt notification scheduled at the user's bedtime. A plain
// DAILY trigger already fires at most once per calendar day, so re-scheduling under the
// same identifier whenever bedtime changes is enough — no separate cancel/reschedule
// dance needed. Queries the profile column directly (not useProfile) since this runs
// outside a navigator screen, where useProfile's useFocusEffect has nothing to attach to.
export function useMildPromptScheduling(enabled: boolean) {
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !notificationsSupported || !user) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('natural_wake_time')
        .eq('id', user.id)
        .single();
      if (cancelled) return;

      const granted = await requestMildPromptPermission();
      if (cancelled || !granted) return;

      const minutes = bedtimeMinutesFor(data?.natural_wake_time ?? null);
      await scheduleMildPrompt(Math.floor(minutes / 60), minutes % 60);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, user]);
}
