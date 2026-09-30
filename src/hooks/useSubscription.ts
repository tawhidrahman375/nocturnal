import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { track } from '../lib/analytics';
import {
  addCustomerInfoListener,
  getCustomerInfo,
  hasProEntitlement,
  presentCustomerCenter,
  presentPaywall,
  purchasesSupported,
  restorePurchases,
} from '../lib/purchases';

// Owns the signed-in user's subscription state for whichever screen calls it, and
// the three actions a settings screen needs: open the paywall, open Customer
// Center, and restore purchases. Refreshes on the live CustomerInfo listener so a
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

  const openPaywall = useCallback(async () => {
    if (!purchasesSupported) return PAYWALL_RESULT.NOT_PRESENTED;
    track('paywall_shown');
    const result = await presentPaywall();
    // A restore is an existing subscriber getting access back, not a new conversion.
    if (result === PAYWALL_RESULT.PURCHASED) track('paywall_converted');
    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) await refresh();
    return result;
  }, [refresh]);

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
    refresh,
    openPaywall,
    openCustomerCenter,
    restore,
  };
}
