import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { useState } from 'react';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { navigationRef } from './navigationRef';
import { useAuth } from '../hooks/useAuth';
import { useMildPromptNotificationRouting } from '../hooks/useMildPromptNotificationRouting';
import { useMildPromptScheduling } from '../hooks/useMildPromptScheduling';
import { useOnboardingGate } from '../hooks/useOnboardingGate';
import { usePurchasesIdentity } from '../hooks/usePurchasesIdentity';
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

export function RootNavigator() {
  const { session } = useAuth();
  const [isNavReady, setIsNavReady] = useState(false);
  const { needsOnboarding, markComplete } = useOnboardingGate(session);

  useWbtbNotificationRouting(!!session && isNavReady);
  useRealityCheckNotificationRouting(!!session);
  useMildPromptNotificationRouting(!!session && isNavReady);
  useMildPromptScheduling(!!session);
  usePurchasesIdentity(session);

  const content = !session ? (
    <AuthNavigator />
  ) : needsOnboarding === null ? null : needsOnboarding ? (
    <OnboardingQuizScreen onComplete={markComplete} />
  ) : (
    <AppNavigator />
  );

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} onReady={() => setIsNavReady(true)}>
      {content}
    </NavigationContainer>
  );
}
