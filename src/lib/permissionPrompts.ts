import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrePermissionKind = 'reality-check' | 'wbtb-alarm';

const STORAGE_KEYS: Record<PrePermissionKind, string> = {
  'reality-check': 'nocturnal:pre-permission:reality-check',
  'wbtb-alarm': 'nocturnal:pre-permission:wbtb-alarm',
};

// Tracks, per device, whether the custom explanation screen for a permission has
// already led to the system prompt firing at least once, regardless of whether the
// user allowed or denied it. Local to the device on purpose, since it is a "don't
// nag again" UI flag, not user data, and the OS permission itself is device-specific.
export async function hasBeenPrompted(kind: PrePermissionKind): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS[kind]);
  return value === 'true';
}

export async function markPrompted(kind: PrePermissionKind): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS[kind], 'true');
}
