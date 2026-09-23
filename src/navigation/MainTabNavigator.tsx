import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Compass, House, Sparkles, User } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/main/HomeScreen';
import { JournalScreen } from '../screens/main/JournalScreen';
import { InsightsScreen } from '../screens/main/InsightsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { colors, typography } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, typeof House> = {
  Home: House,
  Journal: Compass,
  Insights: Sparkles,
  Profile: User,
};

function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView intensity={40} tint="dark" style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
      <View style={[StyleSheet.absoluteFill, styles.tabBarOverlay]} />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const Icon = TAB_ICONS[route.name as keyof MainTabParamList];
        const label = options.title ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tabItem} hitSlop={8}>
            <Icon
              color={isFocused ? colors.accent.primary : colors.text.tertiary}
              size={24}
              strokeWidth={1.5}
            />
            <Text
              style={[
                typography.caption,
                { color: isFocused ? colors.accent.primary : colors.text.tertiary },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'You' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 12,
    overflow: 'hidden',
  },
  tabBarOverlay: {
    backgroundColor: 'rgba(10, 14, 26, 0.55)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
});
