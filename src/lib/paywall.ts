import AsyncStorage from '@react-native-async-storage/async-storage';
import { PACKAGE_TYPE, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { PaywallPlan } from './analytics';

// What the paywall screen renders for one plan. Built from a RevenueCat package so every
// price, per-week figure and trial length shown is what the store will actually charge,
// in the user's currency. `pkg` is null only for the web preview, which has no store.
export type PlanOption = {
  plan: PaywallPlan;
  pkg: PurchasesPackage | null;
  title: string;
  // What the store actually charges per period. Used for the charge line, not the row.
  priceString: string;
  // "week" | "month" | "year", for "£6.99 / month".
  periodUnit: string;
  // What the row shows as its main price. The same as priceString / periodUnit except on
  // annual, which leads with the monthly equivalent (total ÷ 12).
  displayPrice: string;
  displayUnit: string;
  // The quieter line under the title: per-week cost, or "Billed annually at ..." on annual.
  subtext: string | null;
  trialDays: number | null;
  // e.g. "Save 17%". Annual only.
  badge: string | null;
};

// The screen's default selection.
export const DEFAULT_PLAN: PaywallPlan = 'annual';

const PLAN_TITLE: Record<PaywallPlan, string> = { weekly: 'Weekly', monthly: 'Monthly', annual: 'Annual' };
const PLAN_PERIOD: Record<PaywallPlan, string> = { weekly: 'week', monthly: 'month', annual: 'year' };
const DAYS_PER_UNIT: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

export function planOfPackage(pkg: PurchasesPackage): PaywallPlan | null {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.WEEKLY:
      return 'weekly';
    case PACKAGE_TYPE.MONTHLY:
      return 'monthly';
    case PACKAGE_TYPE.ANNUAL:
      return 'annual';
    default:
      return null;
  }
}

// Free-trial length in days, or null when the package has no free introductory phase.
// A paid intro price is a discount, not a trial, so it does not count.
export function trialDaysOf(pkg: PurchasesPackage): number | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const perUnit = DAYS_PER_UNIT[intro.periodUnit];
  return perUnit ? perUnit * intro.periodNumberOfUnits : null;
}

function optionFrom(plan: PaywallPlan, pkg: PurchasesPackage, badge: string | null): PlanOption {
  const { product } = pkg;
  const perWeek = product.pricePerWeekString ? `${product.pricePerWeekString} / week` : null;
  // Annual leads with its monthly equivalent; if the store gives none, fall back to the total.
  const annualAsMonthly = plan === 'annual' ? product.pricePerMonthString : null;

  return {
    plan,
    pkg,
    title: PLAN_TITLE[plan],
    priceString: product.priceString,
    periodUnit: PLAN_PERIOD[plan],
    displayPrice: annualAsMonthly ?? product.priceString,
    displayUnit: annualAsMonthly ? 'month' : PLAN_PERIOD[plan],
    subtext: annualAsMonthly
      ? `Billed annually at ${product.priceString}`
      : plan === 'weekly'
        ? null
        : perWeek,
    trialDays: trialDaysOf(pkg),
    badge,
  };
}

// The three plans of an offering, in display order (lowest commitment first). A plan the
// offering does not carry is simply left out.
export function planOptionsFrom(offering: PurchasesOffering): PlanOption[] {
  const { weekly, monthly, annual } = offering;

  // Annual is priced at ten months, so it saves ~17% against paying monthly. Computed from
  // the real prices rather than hard-coded, so it stays true if the price test changes.
  let annualBadge: string | null = null;
  if (annual && monthly && monthly.product.price > 0) {
    const saving = Math.round((1 - annual.product.price / (monthly.product.price * 12)) * 100);
    if (saving > 0) annualBadge = `Save ${saving}%`;
  }

  const options: PlanOption[] = [];
  if (weekly) options.push(optionFrom('weekly', weekly, null));
  if (monthly) options.push(optionFrom('monthly', monthly, null));
  if (annual) options.push(optionFrom('annual', annual, annualBadge));
  return options;
}

// Web preview only: fixed prices so the layout can be checked in a browser, where there
// is no store. Purchasing is disabled for these (pkg is null).
export const PREVIEW_PLAN_OPTIONS: PlanOption[] = [
  { plan: 'weekly', pkg: null, title: 'Weekly', priceString: '$2.99', periodUnit: 'week', displayPrice: '$2.99', displayUnit: 'week', subtext: null, trialDays: 7, badge: null },
  { plan: 'monthly', pkg: null, title: 'Monthly', priceString: '$7.99', periodUnit: 'month', displayPrice: '$7.99', displayUnit: 'month', subtext: '$1.84 / week', trialDays: 7, badge: null },
  { plan: 'annual', pkg: null, title: 'Annual', priceString: '$79.90', periodUnit: 'year', displayPrice: '$6.66', displayUnit: 'month', subtext: 'Billed annually at $79.90', trialDays: 7, badge: 'Save 17%' },
];

export function trialEndDate(trialDays: number, from = new Date()): Date {
  const end = new Date(from);
  end.setDate(end.getDate() + trialDays);
  return end;
}

export function formatChargeDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

// --- Pending flag --------------------------------------------------------------------
//
// Set the moment onboarding completes, cleared when the user converts or finishes the
// fallback offer. Persisted so that quitting the app mid-paywall does not let someone skip
// it: the next launch shows it again. Only users who finish onboarding get the flag, so
// accounts that predate the paywall are never interrupted by it.

const PENDING_KEY_PREFIX = 'nocturnal:paywall:pending:';

export async function markPaywallPending(userId: string) {
  try {
    await AsyncStorage.setItem(PENDING_KEY_PREFIX + userId, '1');
  } catch {
    // Worst case the paywall is not re-shown after a relaunch; this launch still shows it.
  }
}

export async function isPaywallPending(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PENDING_KEY_PREFIX + userId)) === '1';
  } catch {
    return false;
  }
}

export async function clearPaywallPending(userId: string) {
  try {
    await AsyncStorage.removeItem(PENDING_KEY_PREFIX + userId);
  } catch {
    // Nothing useful to do; a stale flag only re-shows the paywall once.
  }
}
