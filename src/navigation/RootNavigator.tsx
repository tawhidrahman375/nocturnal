import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { useState } from 'react';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { navigationRef } from './navigationRef';
import { useAuth } from '../hooks/useAuth';
import { useRealityCheckNotificationRouting } from '../hooks/useRealityCheckNotificationRouting';
import { useWbtbNotificationRouting } from '../hooks/useWbtbNotificationRouting';
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

  useWbtbNotificationRouting(!!session && isNavReady);
  useRealityCheckNotificationRouting(!!session);

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} onReady={() => setIsNavReady(true)}>
      {session ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
