import { useCallback, useEffect, useRef, useState } from 'react';
import { DreamInsight, fetchOrGenerateInsight, MIN_DREAMS_FOR_INSIGHT } from '../lib/aiInsight';

export { MIN_DREAMS_FOR_INSIGHT };

type DreamInsightState = {
  insight: DreamInsight | null;
  isLoading: boolean;
  error: string | null;
  isFirst: boolean;
};

const INITIAL_STATE: DreamInsightState = { insight: null, isLoading: false, error: null, isFirst: false };

// Fetches (or, server-side, generates a fresh one once/day) the signed-in user's AI
// dream insight. Both HomeScreen (which owns firing the firstInsight milestone) and
// InsightsScreen (which displays the text) call this same hook — the Edge Function's
// own 24h cache means only the first call in a given day actually reaches Claude;
// every call after that just re-reads the cached row, so calling it from two screens
// costs nothing extra.
export function useDreamInsight(totalDreams: number) {
  const [state, setState] = useState<DreamInsightState>(INITIAL_STATE);
  // Re-requests when the dream count changes (a fresh journal entry may unlock the
  // minimum, or just be worth re-checking) but not on every re-render.
  const requestedForRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const result = await fetchOrGenerateInsight();
      setState({
        insight: result.insight,
        isLoading: false,
        error: null,
        isFirst: result.insight !== null && result.isFirst,
      });
    } catch (e) {
      setState({ insight: null, isLoading: false, error: (e as Error).message, isFirst: false });
    }
  }, []);

  useEffect(() => {
    if (totalDreams < MIN_DREAMS_FOR_INSIGHT) return;
    if (requestedForRef.current === totalDreams) return;
    requestedForRef.current = totalDreams;
    load();
  }, [totalDreams, load]);

  return { ...state, reload: load };
}
