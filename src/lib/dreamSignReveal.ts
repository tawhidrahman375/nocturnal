import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDreamSigns } from './dreamSigns';

const KNOWN_SIGNS_KEY_PREFIX = 'nocturnal:dream-signs:known:';

// The last-known dream sign list, per device — purely a "have we already shown this
// discovery" flag (same category as lib/permissionPrompts.ts and the streak high-water
// mark in lib/milestones.ts), not user data, so it lives in AsyncStorage rather than
// on the profile.
async function getKnownDreamSigns(userId: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KNOWN_SIGNS_KEY_PREFIX + userId);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function setKnownDreamSigns(userId: string, signs: string[]): Promise<void> {
  await AsyncStorage.setItem(KNOWN_SIGNS_KEY_PREFIX + userId, JSON.stringify(signs));
}

// Diffs the current dream signs (extracted from the last 14 entries by fetchDreamSigns)
// against the last-known set persisted on this device, returning only the ones that are
// genuinely new. The very first time this runs for a user on a device there is no
// baseline yet, so it just establishes one without reporting anything as "new" — the
// same first-load case fetchDreamSigns has no concept of, since it just returns whatever
// set exists right now.
export async function checkForNewDreamSigns(userId: string): Promise<string[]> {
  const currentSigns = await fetchDreamSigns(userId);
  const knownSigns = await getKnownDreamSigns(userId);

  await setKnownDreamSigns(userId, currentSigns);

  if (knownSigns.length === 0) return [];

  const knownKeys = new Set(knownSigns.map((sign) => sign.toLowerCase()));
  return currentSigns.filter((sign) => !knownKeys.has(sign.toLowerCase()));
}
