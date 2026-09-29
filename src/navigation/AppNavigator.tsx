import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { AppStackParamList } from './types';
import { BeginnerTrackScreen } from '../screens/beginner-track/BeginnerTrackScreen';
import { CoachChatScreen } from '../screens/coach/CoachChatScreen';
import { LegalDocumentScreen } from '../screens/legal/LegalDocumentScreen';
import { MildPromptScreen } from '../screens/mild-prompt/MildPromptScreen';
import { NotificationSettingsScreen } from '../screens/notifications/NotificationSettingsScreen';
import { RecordDreamScreen } from '../screens/record/RecordDreamScreen';
import { RealityCheckSetupScreen } from '../screens/reality-check/RealityCheckSetupScreen';
import { WbtbDefaultsScreen } from '../screens/wbtb/WbtbDefaultsScreen';
import { WbtbSessionScreen } from '../screens/wbtb/WbtbSessionScreen';
import { WbtbSetupScreen } from '../screens/wbtb/WbtbSetupScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabNavigator} />
      <Stack.Screen name="WbtbSetup" component={WbtbSetupScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="RealityCheckSetup"
        component={RealityCheckSetupScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="WbtbSession"
        component={WbtbSessionScreen}
        options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="RecordDream"
        component={RecordDreamScreen}
        options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen name="BeginnerTrack" component={BeginnerTrackScreen} />
      <Stack.Screen name="MildPrompt" component={MildPromptScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CoachChat" component={CoachChatScreen} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="WbtbDefaults" component={WbtbDefaultsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
