import { Session } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { identifyUser, resetUser } from '../lib/purchases';

// Keeps RevenueCat's app user id in sync with the signed-in Supabase user, so
// entitlements follow the account (and survive a reinstall or a new device)
// instead of sticking to a per-install anonymous id. Mirrors the session-driven
// effect pattern already used by useWbtbNotificationRouting /
// useRealityCheckNotificationRouting.
export function usePurchasesIdentity(session: Session | null) {
  useEffect(() => {
    if (session?.user) {
      identifyUser(session.user.id).catch(() => {});
    } else {
      resetUser().catch(() => {});
    }
  }, [session]);
}
