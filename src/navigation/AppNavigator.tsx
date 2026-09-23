import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { AppStackParamList } from './types';
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
        name="WbtbSession"
        component={WbtbSessionScreen}
        options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}
