import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchOrGenerateMildMantra } from '../lib/mildMantra';
import { MILD_MANTRA } from '../lib/wbtb';

type MildMantraState = {
  mantra: string;
  isLoading: boolean;
  error: string | null;
  // True when `mantra` is the static fallback line rather than a generated one —
  // either generation failed, or there wasn't enough journal data to ground one.
  isFallback: boolean;
};

const INITIAL_STATE: MildMantraState = { mantra: MILD_MANTRA, isLoading: true, error: null, isFallback: true };

// Fetches (or, server-side, generates a fresh one once/day) the signed-in user's
// personalized MILD mantra. Falls back to the classic static mantra (lib/wbtb.ts)
// on any error or thin data, so the screen always has something to show.
export function useMildMantra() {
  const [state, setState] = useState<MildMantraState>(INITIAL_STATE);
  const requestedRef = useRef(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const result = await fetchOrGenerateMildMantra();
      setState({
        mantra: result.mantra?.content ?? MILD_MANTRA,
        isLoading: false,
        error: null,
        isFallback: result.mantra === null,
      });
    } catch (e) {
      setState({ mantra: MILD_MANTRA, isLoading: false, error: (e as Error).message, isFallback: true });
    }
  }, []);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    load();
  }, [load]);

  return { ...state, reload: load };
}
