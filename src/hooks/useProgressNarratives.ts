import { useEffect, useState } from 'react';
import {
  fetchOrGenerateProgressNarratives,
  MIN_DREAMS_FOR_NARRATIVE,
  PROGRESS_NARRATIVE_FALLBACK,
} from '../lib/progressNarrative';

type NarrativeState = {
  // null means "show the fallback line" (error, or the period had nothing to return).
  weekly: string | null;
  monthly: string | null;
  isLoading: boolean;
};

const LOADING_STATE: NarrativeState = { weekly: null, monthly: null, isLoading: true };

// Fetches (or, server-side, generates) the signed-in user's weekly and monthly progress
// narratives. `dreamsLoading` holds the skeleton up until the journal count is known, so
// a brand-new account never flashes a skeleton for a call that is not going to happen.
// With fewer than MIN_DREAMS_FOR_NARRATIVE dreams in total the Edge Function is never
// called at all, and both periods show `fallback`.
export function useProgressNarratives(totalDreams: number, dreamsLoading: boolean) {
  const [state, setState] = useState<NarrativeState>(LOADING_STATE);

  const hasEnoughData = totalDreams >= MIN_DREAMS_FOR_NARRATIVE;

  useEffect(() => {
    if (dreamsLoading || !hasEnoughData) return;

    let ignore = false;
    (async () => {
      try {
        const result = await fetchOrGenerateProgressNarratives();
        if (ignore) return;
        setState({
          weekly: result.weekly?.narrative?.content ?? null,
          monthly: result.monthly?.narrative?.content ?? null,
          isLoading: false,
        });
      } catch {
        if (ignore) return;
        setState({ weekly: null, monthly: null, isLoading: false });
      }
    })();

    return () => {
      ignore = true;
    };
  }, [dreamsLoading, hasEnoughData]);

  if (!dreamsLoading && !hasEnoughData) {
    return { weekly: null, monthly: null, isLoading: false, fallback: PROGRESS_NARRATIVE_FALLBACK };
  }
  return { ...state, fallback: PROGRESS_NARRATIVE_FALLBACK };
}
