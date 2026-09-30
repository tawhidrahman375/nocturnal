import PostHog from 'posthog-react-native';
import { DreamCategory } from './dreamCategories';

// PostHog EU cloud. Analytics is switched off entirely (no network, no storage) in
// development builds and when the project token is missing, so local testing never pollutes
// real data and a fresh checkout without the env var still runs.
const API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

// One client for the whole app, created at module load so code outside React (AuthProvider,
// lib helpers) can use it and PostHogProvider gets the same instance via its `client` prop.
export const posthog = new PostHog(API_KEY ?? 'analytics-disabled', {
  host: HOST,
  disabled: __DEV__ || !API_KEY,
});

// The complete list of events the app sends, and the only properties each may carry. Keep
// this closed on purpose: dream text, transcripts, recall notes, sleep or health data and
// anything else a user wrote or that describes their body never goes into an event, so
// every property here is a boolean, a number or a value from a fixed list.
type AnalyticsEvents = {
  dream_logged: { is_lucid: boolean; category: DreamCategory | null };
  voice_recording_saved: { duration_seconds: number };
  wbtb_session_started: { technique: string };
  wbtb_session_completed: { technique: string };
  reality_check_completed: undefined;
  coach_chat_opened: undefined;
  paywall_shown: undefined;
  paywall_converted: undefined;
  onboarding_completed: undefined;
  dream_profile_viewed: undefined;
};

export function track<E extends keyof AnalyticsEvents>(
  event: E,
  ...properties: AnalyticsEvents[E] extends undefined ? [] : [AnalyticsEvents[E]]
) {
  posthog.capture(event, properties[0]);
}

// Screen name only, never route params (they can hold ids and free text).
export function trackScreen(name: string) {
  posthog.screen(name).catch(() => {});
}

// The Supabase user id is the only identity sent: no email, no name, no traits.
export function identifyAnalyticsUser(userId: string) {
  posthog.identify(userId);
}

export function resetAnalyticsUser() {
  posthog.reset();
}
