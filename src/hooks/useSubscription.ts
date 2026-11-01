import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import {
  addCustomerInfoListener,
  getCustomerInfo,
  hasProEntitlement,
  presentCustomerCenter,
  purchasesSupported,
  restorePurchases,
} from '../lib/purchases';

// Owns the signed-in user's subscription state for whichever screen calls it, and
// the actions a settings screen needs: open Customer Center and restore purchases (the
// paywall itself is the Paywall screen). Refreshes on the live CustomerInfo listener so a
// purchase made inside the paywall (or a renewal) is reflected without a manual
// reload.
export function useSubscription() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(purchasesSupported);

  const refresh = useCallback(async () => {
    if (!purchasesSupported) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const info = await getCustomerInfo();
    setCustomerInfo(info);
    setIsLoading(false);
  }, []);

  // Re-checks whenever the screen gains focus (matches useDreams/useProfile), plus a
  // live listener below for changes that happen while it's already on screen (a
  // purchase or restore completing, a renewal). useFocusEffect's callback can't be
  // the async refresh itself — React Navigation treats a returned Promise as a
  // (mis-typed) cleanup function — so it's called fire-and-forget from a plain one.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => addCustomerInfoListener(setCustomerInfo), []);

  const openCustomerCenter = useCallback(async () => {
    if (!purchasesSupported) return;
    await presentCustomerCenter();
    await refresh();
  }, [refresh]);

  const restore = useCallback(async (): Promise<{ error: string | null }> => {
    if (!purchasesSupported) {
      return { error: 'Subscriptions are only available in the iOS and Android apps.' };
    }
    try {
      const info = await restorePurchases();
      setCustomerInfo(info);
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, []);

  return {
    customerInfo,
    isPro: hasProEntitlement(customerInfo),
    isLoading,
    // False only until the first CustomerInfo arrives. Gated screens wait on this before
    // showing an upsell, so a paying user never sees "locked" flash while it loads (isLoading
    // alone goes true again on every refresh).
    isResolved: !purchasesSupported || customerInfo !== null || !isLoading,
    refresh,
    openCustomerCenter,
    restore,
  };
}
