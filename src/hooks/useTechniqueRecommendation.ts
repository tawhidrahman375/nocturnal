import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_TECHNIQUE_RECOMMENDATION, fetchOrGenerateTechniqueRecommendation } from '../lib/techniqueRecommendation';

type TechniqueRecommendationState = {
  recommendation: string;
  isLoading: boolean;
  error: string | null;
};

const INITIAL_STATE: TechniqueRecommendationState = {
  recommendation: DEFAULT_TECHNIQUE_RECOMMENDATION,
  isLoading: true,
  error: null,
};

// Fetches (or, server-side, generates a fresh one once/day) the signed-in user's
// technique recommendation. Falls back to the static no-history line (lib/
// techniqueRecommendation.ts) on any error or when the user has no WBTB session
// history yet, so the card always has something to show.
export function useTechniqueRecommendation() {
  const [state, setState] = useState<TechniqueRecommendationState>(INITIAL_STATE);
  const requestedRef = useRef(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const result = await fetchOrGenerateTechniqueRecommendation();
      setState({
        recommendation: result.recommendation?.content ?? DEFAULT_TECHNIQUE_RECOMMENDATION,
        isLoading: false,
        error: null,
      });
    } catch (e) {
      setState({ recommendation: DEFAULT_TECHNIQUE_RECOMMENDATION, isLoading: false, error: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    load();
  }, [load]);

  return { ...state, reload: load };
}
