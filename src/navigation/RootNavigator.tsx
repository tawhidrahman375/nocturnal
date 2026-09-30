import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { useState } from 'react';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { navigationRef } from './navigationRef';
import { PendingRecordingSheet } from '../components/PendingRecordingSheet';
import { QuickRecordSetup } from '../components/QuickRecordSetup';
import { trackScreen } from '../lib/analytics';
import { useAuth } from '../hooks/useAuth';
import { useMildPromptNotificationRouting } from '../hooks/useMildPromptNotificationRouting';
import { useMildPromptScheduling } from '../hooks/useMildPromptScheduling';
import { useOnboardingGate } from '../hooks/useOnboardingGate';
import { usePurchasesIdentity } from '../hooks/usePurchasesIdentity';
import { useQuickRecordNotificationRouting } from '../hooks/useQuickRecordNotificationRouting';
import { useRealityCheckNotificationRouting } from '../hooks/useRealityCheckNotificationRouting';
import { useWbtbNotificationRouting } from '../hooks/useWbtbNotificationRouting';
import { OnboardingQuizScreen } from '../screens/onboarding/OnboardingQuizScreen';
import { colors } from '../theme';

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background.primary,
    card: colors.background.secondary,
    border: colors.border.default,
    primary: colors.accent.primary,
    text: colors.text.primary,
  },
};

// Sends a screen event when the focused route changes. getCurrentRoute() resolves through
// the nested tab and stack navigators to the leaf screen; only its name is sent, never the
// params. Skips a repeat of the same screen (a param-only change or a re-render).
let lastTrackedScreen: string | undefined;
function trackCurrentScreen() {
  const name = navigationRef.getCurrentRoute()?.name;
  if (!name || name === lastTrackedScreen) return;
  lastTrackedScreen = name;
  trackScreen(name);
}

export function RootNavigator() {
  const { session } = useAuth();
  const [isNavReady, setIsNavReady] = useState(false);
  const { needsOnboarding, markComplete } = useOnboardingGate(session);

  useWbtbNotificationRouting(!!session && isNavReady);
  useRealityCheckNotificationRouting(!!session);
  useMildPromptNotificationRouting(!!session && isNavReady);
  // The recording screen lives in the signed-in app stack, so only route to it once that
  // stack (and not the onboarding quiz) is what is on screen.
  useQuickRecordNotificationRouting(!!session && isNavReady && needsOnboarding === false);
  useMildPromptScheduling(!!session);
  usePurchasesIdentity(session);

  const content = !session ? (
    <AuthNavigator />
  ) : needsOnboarding === null ? null : needsOnboarding ? (
    <OnboardingQuizScreen onComplete={markComplete} />
  ) : (
    <>
      <AppNavigator />
      <QuickRecordSetup />
      <PendingRecordingSheet />
    </>
  );

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={() => {
        setIsNavReady(true);
        trackCurrentScreen();
      }}
      onStateChange={trackCurrentScreen}
    >
      {content}
    </NavigationContainer>
  );
}
