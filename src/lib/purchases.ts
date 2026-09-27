import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesError,
} from 'react-native-purchases';
import RevenueCatUI, {
  PAYWALL_RESULT,
  PresentCustomerCenterParams,
  PresentPaywallParams,
} from 'react-native-purchases-ui';

// RevenueCat's native SDK has no purchase support on web without a separate
// "RevenueCat Billing" + Stripe setup (a different product configured entirely in
// their dashboard, out of scope here) — every call in this module is a no-op on
// web, mirroring notificationsSupported in lib/notifications.ts. It also only works
// in a development or production build, never in Expo Go — see AGENTS.md.
export const purchasesSupported = Platform.OS !== 'web';

// The single entitlement this app gates on. Must match the identifier created for
// the "nocturnal_pro" entitlement in the RevenueCat dashboard.
export const PRO_ENTITLEMENT_ID = 'nocturnal_pro';

// RevenueCat issues one API key per platform for a production app (separate Apple
// and Google keys), but a single sandbox/Test Store key works for both during
// development. Falls back to the shared var, so moving to production keys later is
// just adding the two platform-specific env vars — no code change either way.
const API_KEY =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
    android: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
  }) ?? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

let isConfigured = false;

// Call once at app startup, before anything else in this module. Safe to call more
// than once (e.g. Fast Refresh) — configure() itself is idempotent, and the
// isConfigured guard here just skips the redundant setLogLevel call.
export function configurePurchases() {
  if (!purchasesSupported || isConfigured) return;
  if (!API_KEY) {
    console.warn(
      '[purchases] Missing EXPO_PUBLIC_REVENUECAT_API_KEY — subscriptions are disabled until it is set.'
    );
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: API_KEY });
  isConfigured = true;
}

// Ties RevenueCat's app user id to the signed-in Supabase user, so a purchase made
// on one device is recognized on another after signing back in, instead of being
// stuck against a per-install anonymous id. Called from usePurchasesIdentity.
export async function identifyUser(userId: string) {
  if (!purchasesSupported || !isConfigured) return;
  await Purchases.logIn(userId);
}

export async function resetUser() {
  if (!purchasesSupported || !isConfigured) return;
  await Purchases.logOut();
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!purchasesSupported || !isConfigured) return null;
  return Purchases.getCustomerInfo();
}

export function hasProEntitlement(customerInfo: CustomerInfo | null): boolean {
  return customerInfo?.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

// Subscribes to live CustomerInfo changes (a purchase or restore completing,
// a renewal, etc.) and returns an unsubscribe function.
export function addCustomerInfoListener(listener: (info: CustomerInfo) => void) {
  if (!purchasesSupported) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

// Always shows the paywall, regardless of current entitlement — for an explicit
// "Upgrade" tap.
export async function presentPaywall(params?: PresentPaywallParams): Promise<PAYWALL_RESULT> {
  if (!purchasesSupported) return PAYWALL_RESULT.NOT_PRESENTED;
  return RevenueCatUI.presentPaywall(params);
}

// Only shows the paywall if the user doesn't already have nocturnal_pro — for
// gating a feature at the point of use.
export async function presentPaywallIfNeeded(): Promise<PAYWALL_RESULT> {
  if (!purchasesSupported) return PAYWALL_RESULT.NOT_PRESENTED;
  return RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID });
}

// Native self-service UI (manage/cancel subscription, restore, refunds, support).
// Requires Customer Center to be enabled in the RevenueCat dashboard first, and is
// gated on the dashboard's own plan (see the integration notes left in ProfileScreen).
export async function presentCustomerCenter(params?: PresentCustomerCenterParams): Promise<void> {
  if (!purchasesSupported) return;
  return RevenueCatUI.presentCustomerCenter(params);
}

export function isUserCancelledError(error: unknown): boolean {
  return (error as PurchasesError)?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}
