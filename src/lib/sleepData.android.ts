import { Linking } from 'react-native';
import type { SleepInterval } from './sleepCorrelation';
import type { SleepAccess, SleepDataApi } from './sleepData';

type HealthConnect = typeof import('react-native-health-connect');

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';
const DAY_MS = 24 * 60 * 60 * 1000;
const SLEEP_PERMISSION = { accessType: 'read', recordType: 'SleepSession' } as const;

// Health Connect sleep stage types that mean "not asleep" (awake, out of bed). Anything
// else, including "unknown", counts as sleep.
const STAGE_AWAKE = 1;
const STAGE_OUT_OF_BED = 3;
// The page size Health Connect returns per read; more than 30 days of sessions in one go
// is not expected, but the loop below follows page tokens anyway.
const PAGE_SIZE = 200;

// Loaded lazily and guarded: the native module is missing in Expo Go, and a failed import
// at startup would take the whole app down instead of just hiding this card.
let healthConnect: HealthConnect | null | undefined;
function loadHealthConnect(): HealthConnect | null {
  if (healthConnect === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      healthConnect = require('react-native-health-connect') as HealthConnect;
    } catch {
      healthConnect = null;
    }
  }
  return healthConnect;
}

async function hasSleepPermission(hc: HealthConnect): Promise<boolean> {
  const granted = await hc.getGrantedPermissions();
  return granted.some((p) => p.accessType === 'read' && p.recordType === 'SleepSession');
}

export const getSleepAccess: SleepDataApi['getSleepAccess'] = async (): Promise<SleepAccess> => {
  const hc = loadHealthConnect();
  if (!hc) return { status: 'unsupported' };

  try {
    const sdkStatus = await hc.getSdkStatus();
    if (sdkStatus === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE) {
      return { status: 'health-connect-missing', needsUpdate: false };
    }
    if (sdkStatus === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      return { status: 'health-connect-missing', needsUpdate: true };
    }
    if (!(await hc.initialize())) return { status: 'health-connect-missing', needsUpdate: false };
    return (await hasSleepPermission(hc))
      ? { status: 'ready' }
      : { status: 'needs-permission', alreadyAsked: false };
  } catch {
    return { status: 'unsupported' };
  }
};

// Health Connect only shows its permission dialog a couple of times before Android stops
// showing it at all, so a request that comes back without the grant is reported as
// "already asked": the card then sends the user to Health Connect's own settings instead.
export const requestSleepAccess: SleepDataApi['requestSleepAccess'] = async (): Promise<SleepAccess> => {
  const hc = loadHealthConnect();
  if (!hc) return { status: 'unsupported' };
  const access = await getSleepAccess();
  if (access.status !== 'needs-permission') return access;

  await hc.requestPermission([SLEEP_PERMISSION]);
  return (await hasSleepPermission(hc)) ? { status: 'ready' } : { status: 'needs-permission', alreadyAsked: true };
};

export const readSleepIntervals: SleepDataApi['readSleepIntervals'] = async (days): Promise<SleepInterval[]> => {
  const hc = loadHealthConnect();
  if (!hc) return [];

  const now = new Date();
  const timeRangeFilter = {
    operator: 'between',
    startTime: new Date(now.getTime() - days * DAY_MS).toISOString(),
    endTime: now.toISOString(),
  } as const;

  const intervals: SleepInterval[] = [];
  let pageToken: string | undefined;
  do {
    const page = await hc.readRecords('SleepSession', { timeRangeFilter, pageSize: PAGE_SIZE, pageToken });
    for (const session of page.records) {
      const stages = session.stages ?? [];
      if (stages.length === 0) {
        intervals.push({ start: new Date(session.startTime), end: new Date(session.endTime) });
        continue;
      }
      // With stages, only the asleep stretches count, so awake time in bed is left out.
      for (const stage of stages) {
        if (stage.stage === STAGE_AWAKE || stage.stage === STAGE_OUT_OF_BED) continue;
        intervals.push({ start: new Date(stage.startTime), end: new Date(stage.endTime) });
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);

  return intervals;
};

// Health Connect's own settings, where the user can allow Nocturnal to read sleep again.
export const openHealthSettings: SleepDataApi['openHealthSettings'] = async () => {
  loadHealthConnect()?.openHealthConnectSettings();
};

export const openHealthConnectInstall: SleepDataApi['openHealthConnectInstall'] = async () => {
  try {
    await Linking.openURL(`market://details?id=${HEALTH_CONNECT_PACKAGE}`);
  } catch {
    await Linking.openURL(`https://play.google.com/store/apps/details?id=${HEALTH_CONNECT_PACKAGE}`);
  }
};
