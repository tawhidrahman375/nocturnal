import { Figtree_400Regular, Figtree_500Medium } from '@expo-google-fonts/figtree';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { useFonts } from 'expo-font';
import { PostHogProvider } from 'posthog-react-native';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { posthog } from './src/lib/analytics';
import { configureNotifications } from './src/lib/notifications';
import { configurePurchases } from './src/lib/purchases';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync();
configureNotifications();
configurePurchases();

function AppShell() {
  const { isLoading: isAuthLoading } = useAuth();
  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Fraunces_600SemiBold,
  });

  const ready = fontsLoaded && !isAuthLoading;

  const onLayout = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={styles.root} onLayout={onLayout}>
      <StatusBar style="light" />
      <RootNavigator />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* Autocapture is off: touch capture records the text of what was tapped, which
            can be a user's own dream. Only the explicit events in lib/analytics.ts are sent. */}
        <PostHogProvider client={posthog} autocapture={false}>
          <AppShell />
        </PostHogProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // This is a phone app, full stop — on a wide desktop browser (web preview only;
    // native screens are never this wide) the content locks to a phone-width column
    // instead of stretching edge to edge.
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: colors.background.primary,
  },
});
