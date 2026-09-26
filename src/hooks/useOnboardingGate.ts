import { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type GateState = { userId: string; needsOnboarding: boolean };

// Whether the signed-in user still needs the onboarding quiz, derived from the
// profile's experience_level: all five quiz answers are written together in one
// update at the end of the quiz, so this single column is an accurate completion
// signal without a dedicated "completed" flag.
export function useOnboardingGate(session: Session | null) {
  const [state, setState] = useState<GateState | null>(null);

  useEffect(() => {
    if (!session) return;
    let ignore = false;
    supabase
      .from('profiles')
      .select('experience_level')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (ignore) return;
        // Fail open on a fetch error rather than trap the user behind a broken gate.
        setState({ userId: session.user.id, needsOnboarding: error ? false : data.experience_level === null });
      });
    return () => {
      ignore = true;
    };
  }, [session]);

  const markComplete = useCallback(() => {
    setState((prev) => (prev ? { ...prev, needsOnboarding: false } : prev));
  }, []);

  // null covers both "signed out" and "fetch for this session hasn't resolved yet"
  // (including a stale result left over from a previous user), both read as unknown.
  const needsOnboarding =
    session && state && state.userId === session.user.id ? state.needsOnboarding : null;

  return { needsOnboarding, markComplete };
}
