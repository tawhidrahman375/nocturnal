import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { useCallback } from 'react';

const HAS_SHOWN_KEY = 'nocturnal:review-prompt:shown';

// Whether the App Store/Play Store review sheet has ever been requested on this
// device — not per-user, since the OS's own review throttling (and the "don't ask
// again" intent behind this flag) is tied to the app installation, not whichever
// Nocturnal account happens to be signed in.
export function useReviewPrompt() {
  const triggerReviewPrompt = useCallback(async () => {
    const alreadyShown = await AsyncStorage.getItem(HAS_SHOWN_KEY);
    if (alreadyShown === 'true') return;

    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    // Marked before the call, not after: the OS can silently no-op this (Apple's own
    // yearly rate limit isn't visible to the app either way), so "we decided to ask"
    // is the only thing this code can actually observe and commit to.
    await AsyncStorage.setItem(HAS_SHOWN_KEY, 'true');
    try {
      await StoreReview.requestReview();
    } catch {
      // Nothing to recover from — the native prompt failing to appear isn't something
      // the app can retry or work around.
    }
  }, []);

  return { triggerReviewPrompt };
}
