import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { getSleepAccess, readSleepIntervals, requestSleepAccess } from '../lib/sleepData';
import {
  buildSleepNights,
  computeSleepCorrelationStats,
  DreamForCorrelation,
  hasEnoughSleepData,
  SLEEP_WINDOW_DAYS,
} from '../lib/sleepCorrelation';
import { fetchOrGenerateSleepCorrelation } from '../lib/sleepInsight';

export type SleepInsightState =
  | { kind: 'loading' }
  | { kind: 'unsupported' }
  | { kind: 'health-connect-missing'; needsUpdate: boolean }
  | { kind: 'needs-permission'; alreadyAsked: boolean }
  | { kind: 'not-enough-data' }
  | { kind: 'ready'; content: string }
  | { kind: 'error' };

// Checks the health source, reads the last 30 days of sleep, correlates it with the journal
// on the device, and only then asks the Edge Function to narrate the result. Every step that
// can come up empty ends in a state the card shows inline (no permission, Health Connect
// missing, not enough data); nothing here throws to the caller.
async function resolveSleepInsight(dreams: DreamForCorrelation[]): Promise<SleepInsightState> {
  try {
    const access = await getSleepAccess();
    if (access.status === 'unsupported') return { kind: 'unsupported' };
    if (access.status === 'health-connect-missing') {
      return { kind: 'health-connect-missing', needsUpdate: access.needsUpdate };
    }
    if (access.status === 'needs-permission') return { kind: 'needs-permission', alreadyAsked: access.alreadyAsked };

    const nights = buildSleepNights(await readSleepIntervals(SLEEP_WINDOW_DAYS));
    // iOS never says whether read access was denied; it just returns nothing. So with the
    // prompt already shown and no sleep found, point the user at their Health settings
    // rather than telling them to log more.
    if (nights.length === 0 && Platform.OS === 'ios') return { kind: 'needs-permission', alreadyAsked: true };

    const stats = computeSleepCorrelationStats(nights, dreams);
    if (!hasEnoughSleepData(stats)) return { kind: 'not-enough-data' };

    const result = await fetchOrGenerateSleepCorrelation(stats);
    return result.insight ? { kind: 'ready', content: result.insight.content } : { kind: 'not-enough-data' };
  } catch {
    return { kind: 'error' };
  }
}

// Drives the "Sleep and dreams" card. `dreamsLoading` holds the skeleton up until the
// journal is known, so the correlation never runs against a half-loaded list.
export function useSleepInsight(dreams: DreamForCorrelation[], dreamsLoading: boolean) {
  const [state, setState] = useState<SleepInsightState>({ kind: 'loading' });
  // Bumped to re-run the resolver (after connecting, or coming back from another app).
  const [reloadKey, setReloadKey] = useState(0);

  // Latest values for the effect and the foreground listener, without re-running the
  // resolver every time the journal list is re-fetched into a new array.
  const dreamsRef = useRef(dreams);
  const kindRef = useRef(state.kind);
  useEffect(() => {
    dreamsRef.current = dreams;
    kindRef.current = state.kind;
  });

  useEffect(() => {
    if (dreamsLoading) return;
    let ignore = false;
    (async () => {
      const next = await resolveSleepInsight(dreamsRef.current);
      if (!ignore) setState(next);
    })();
    return () => {
      ignore = true;
    };
  }, [dreamsLoading, reloadKey]);

  // Coming back from the system permission screen, Health, or the Play Store should pick up
  // whatever the user just changed, without leaving and re-entering Insights.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const waiting = kindRef.current === 'needs-permission' || kindRef.current === 'health-connect-missing';
      if (next === 'active' && waiting) setReloadKey((k) => k + 1);
    });
    return () => subscription.remove();
  }, []);

  // The "Connect" button: shows the system prompt, then re-reads whatever it unlocked.
  const connect = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const access = await requestSleepAccess();
      if (access.status === 'needs-permission') {
        setState({ kind: 'needs-permission', alreadyAsked: access.alreadyAsked });
        return;
      }
    } catch {
      // Fall through to a fresh resolve, which reports whatever state we are actually in.
    }
    setReloadKey((k) => k + 1);
  }, []);

  return { state, connect };
}
