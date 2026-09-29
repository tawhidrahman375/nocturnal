import type { SleepInterval } from './sleepCorrelation';

// Where the user's sleep is read from, and whether we can read it right now.
//  - unsupported: no health source on this platform (web), or the native module is not in
//    this build (Expo Go). The card just says so.
//  - health-connect-missing: Android only. Health Connect is not installed (Android 13 and
//    below) or needs an update from the Play Store.
//  - needs-permission: not connected yet, or the user said no. `alreadyAsked` is true when
//    the system prompt has been shown before, so asking again may do nothing.
//  - ready: sleep can be read.
export type SleepAccess =
  | { status: 'unsupported' }
  | { status: 'health-connect-missing'; needsUpdate: boolean }
  | { status: 'needs-permission'; alreadyAsked: boolean }
  | { status: 'ready' };

// The shape every platform's sleep module exports. This file is the fallback Metro picks
// for web; sleepData.ios.ts and sleepData.android.ts replace it in the native builds (the
// only places the HealthKit and Health Connect libraries are imported, so web never
// bundles them). Each of those checks itself against this type with `satisfies`.
export type SleepDataApi = {
  // Checks availability and, where the OS allows it, whether permission is granted.
  getSleepAccess: () => Promise<SleepAccess>;
  // Shows the system permission prompt, then reports the new state.
  requestSleepAccess: () => Promise<SleepAccess>;
  // Asleep intervals from the last `days` days, oldest first is not guaranteed.
  readSleepIntervals: (days: number) => Promise<SleepInterval[]>;
  // Sends the user to fix things themselves: the Play Store page for Health Connect on
  // Android, the Health app on iOS. Used when asking again in-app cannot work.
  openHealthSettings: () => Promise<void>;
  openHealthConnectInstall: () => Promise<void>;
};

const unsupported: SleepAccess = { status: 'unsupported' };

export const getSleepAccess: SleepDataApi['getSleepAccess'] = async () => unsupported;
export const requestSleepAccess: SleepDataApi['requestSleepAccess'] = async () => unsupported;
export const readSleepIntervals: SleepDataApi['readSleepIntervals'] = async () => [];
export const openHealthSettings: SleepDataApi['openHealthSettings'] = async () => {};
export const openHealthConnectInstall: SleepDataApi['openHealthConnectInstall'] = async () => {};
