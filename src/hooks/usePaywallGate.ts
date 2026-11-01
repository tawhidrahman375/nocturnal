import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { isPaywallPending } from '../lib/paywall';
import { isProNow } from '../lib/purchases';

type GateState = { userId: string; showPaywall: boolean };

// Whether the signed-in user still owes the hard paywall that follows onboarding. Only
// checked once onboarding is done (`needsOnboarding === false`), and it reads the flag
// OnboardingQuiz's completion handler persisted, so a relaunch mid-paywall shows it again.
// Someone who already has Pro (a restore, or a subscription from another device) is let
// straight through. Returns null while unknown, like useOnboardingGate.
export function usePaywallGate(session: Session | null, needsOnboarding: boolean | null) {
  const [state, setState] = useState<GateState | null>(null);

  useEffect(() => {
    if (!session || needsOnboarding !== false) return;
    let ignore = false;
    (async () => {
      const pending = await isPaywallPending(session.user.id);
      const showPaywall = pending && !(await isProNow());
      if (!ignore) setState({ userId: session.user.id, showPaywall });
    })();
    return () => {
      ignore = true;
    };
  }, [session, needsOnboarding]);

  if (!session || needsOnboarding !== false) return null;
  return state && state.userId === session.user.id ? state.showPaywall : null;
}
