import { Linking } from 'react-native';
import type { SleepInterval } from './sleepCorrelation';
import type { SleepAccess, SleepDataApi } from './sleepData';

type HealthKit = typeof import('@kingstinct/react-native-healthkit');

const SLEEP_ANALYSIS = 'HKCategoryTypeIdentifierSleepAnalysis' as const;
const DAY_MS = 24 * 60 * 60 * 1000;

// HKCategoryValueSleepAnalysis. Newer watches split "asleep" into core, deep and REM;
// older data and some apps use plain "asleep" (1). "In bed" (0) is only a fallback, for
// people whose iPhone logs bedtime but nothing tracks actual sleep.
const IN_BED = 0;
const ASLEEP_VALUES = new Set([1, 3, 4, 5]);

// Loaded lazily and guarded: HealthKit's native module is missing in Expo Go, and a failed
// import at startup would take the whole app down instead of just hiding this card.
let healthKit: HealthKit | null | undefined;
function loadHealthKit(): HealthKit | null {
  if (healthKit === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      healthKit = require('@kingstinct/react-native-healthkit') as HealthKit;
    } catch {
      healthKit = null;
    }
  }
  return healthKit;
}

const READ_SLEEP = { toRead: [SLEEP_ANALYSIS] } as const;

// iOS deliberately never says whether READ access was granted or denied, so the best this
// can tell is whether the system prompt has been shown yet. After that, "ready" means
// "go ahead and read": a denial just comes back as no samples, which the card handles.
export const getSleepAccess: SleepDataApi['getSleepAccess'] = async (): Promise<SleepAccess> => {
  const hk = loadHealthKit();
  if (!hk || !(await hk.isHealthDataAvailableAsync())) return { status: 'unsupported' };
  try {
    const request = await hk.getRequestStatusForAuthorization(READ_SLEEP);
    return request === hk.AuthorizationRequestStatus.shouldRequest
      ? { status: 'needs-permission', alreadyAsked: false }
      : { status: 'ready' };
  } catch {
    return { status: 'needs-permission', alreadyAsked: false };
  }
};

export const requestSleepAccess: SleepDataApi['requestSleepAccess'] = async (): Promise<SleepAccess> => {
  const hk = loadHealthKit();
  if (!hk) return { status: 'unsupported' };
  await hk.requestAuthorization(READ_SLEEP);
  return { status: 'ready' };
};

export const readSleepIntervals: SleepDataApi['readSleepIntervals'] = async (days): Promise<SleepInterval[]> => {
  const hk = loadHealthKit();
  if (!hk) return [];

  const now = new Date();
  const samples = await hk.queryCategorySamples(SLEEP_ANALYSIS, {
    limit: -1,
    ascending: true,
    filter: { date: { startDate: new Date(now.getTime() - days * DAY_MS), endDate: now } },
  });

  const toInterval = (s: { startDate: Date; endDate: Date }): SleepInterval => ({ start: s.startDate, end: s.endDate });
  const asleep = samples.filter((s) => ASLEEP_VALUES.has(Number(s.value))).map(toInterval);
  return asleep.length > 0 ? asleep : samples.filter((s) => Number(s.value) === IN_BED).map(toInterval);
};

// iOS has no deep link to one app's Health permissions, so send the user to the Health
// app itself (Sharing, Apps, Nocturnal), falling back to Nocturnal's own Settings page.
export const openHealthSettings: SleepDataApi['openHealthSettings'] = async () => {
  try {
    await Linking.openURL('x-apple-health://');
  } catch {
    await Linking.openSettings();
  }
};

export const openHealthConnectInstall: SleepDataApi['openHealthConnectInstall'] = async () => {};
