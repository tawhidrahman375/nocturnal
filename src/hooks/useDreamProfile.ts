import { useEffect, useState } from 'react';
import { DREAM_PROFILE_FALLBACK, fetchOrGenerateDreamProfile, MIN_DREAMS_FOR_PROFILE } from '../lib/dreamProfile';

type DreamProfileState = {
  content: string | null;
  isLoading: boolean;
  error: string | null;
};

const LOADING_STATE: DreamProfileState = { content: null, isLoading: true, error: null };

// Fetches (or, server-side, generates once a week) the signed-in user's long-term dream
// profile. `dreamsLoading` holds the skeleton up until the journal count is known. With
// fewer than MIN_DREAMS_FOR_PROFILE dreams the Edge Function is never called and the
// static fallback is returned directly. On a request error `content` is null and `error`
// is set, so the screen can leave the card out rather than show "keep logging" copy to
// someone who already has a full journal.
export function useDreamProfile(totalDreams: number, dreamsLoading: boolean) {
  const [state, setState] = useState<DreamProfileState>(LOADING_STATE);

  const hasEnoughData = totalDreams >= MIN_DREAMS_FOR_PROFILE;

  useEffect(() => {
    if (dreamsLoading || !hasEnoughData) return;

    let ignore = false;
    (async () => {
      try {
        const result = await fetchOrGenerateDreamProfile();
        if (ignore) return;
        setState({ content: result.profile?.content ?? DREAM_PROFILE_FALLBACK, isLoading: false, error: null });
      } catch (e) {
        if (ignore) return;
        setState({ content: null, isLoading: false, error: (e as Error).message });
      }
    })();

    return () => {
      ignore = true;
    };
  }, [dreamsLoading, hasEnoughData]);

  if (!dreamsLoading && !hasEnoughData) {
    return { content: DREAM_PROFILE_FALLBACK, isLoading: false, error: null };
  }
  return state;
}
