import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Compass, House, User, Waves } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/main/HomeScreen';
import { JournalScreen } from '../screens/main/JournalScreen';
import { InsightsScreen } from '../screens/main/InsightsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { colors, radius, spacing, typography } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, typeof House> = {
  Home: House,
  Journal: Compass,
  Insights: Waves,
  Profile: User,
};

const ICON_SIZE = 22;
const LABEL_GAP = 6;
const PILL_PAD_H = 14;
const PILL_BORDER = 1;
const ROW_PAD_H = 8;
// Small amount of slack added to the locally revealed label so numberOfLines={1} never
// clips into an ellipsis over a stray sub-pixel rounding difference between the
// invisible measuring text and the animated, real one.
const LABEL_WIDTH_BUFFER = 4;
// A tab's hit target when it's just an icon — matches tabPill's own natural icon-only
// width exactly (padding*2 + icon), so there's zero slack for alignItems:center to
// center into.
const INACTIVE_ITEM_WIDTH = ICON_SIZE + PILL_PAD_H * 2;

type ItemLayout = { x: number; width: number };

// Floating capsule bar, not a docked full-width strip — the active tab gets its own
// pill so the bar reads as a single object, not a row of five separate hit targets.
function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [itemLayouts, setItemLayouts] = useState<Record<number, ItemLayout>>({});
  // Each tab's true rendered content width (icon + gap + label), measured directly
  // from an invisible fully-revealed clone rather than predicted from a formula — a
  // predicted width drifted a few px off the real one and threw the bubble's padding
  // around the icon/label out of balance.
  const [contentWidths, setContentWidths] = useState<Record<number, number>>({});

  // One shared bubble that slides/resizes to the active tab instead of each tab
  // owning its own static highlight.
  const [pillX] = useState(() => new Animated.Value(0));
  const [pillWidth] = useState(() => new Animated.Value(0));
  const [pillOpacity] = useState(() => new Animated.Value(0));

  const activeItem = itemLayouts[state.index];
  const contentWidth = contentWidths[state.index];

  useEffect(() => {
    if (!activeItem || contentWidth === undefined) return;
    // activeItem.x/width already describe the tab's true position in the row (its
    // onLayout box, now sized to match contentWidth exactly when focused — see
    // INACTIVE_ITEM_WIDTH / TabBarItem's width below), so no extra offset is needed.
    const targetX = activeItem.x + (activeItem.width - contentWidth) / 2;
    Animated.spring(pillX, {
      toValue: targetX,
      useNativeDriver: true,
      friction: 9,
      tension: 80,
    }).start();
    Animated.timing(pillWidth, {
      toValue: contentWidth,
      duration: 260,
      useNativeDriver: false,
    }).start();
    Animated.timing(pillOpacity, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [activeItem, contentWidth, pillX, pillWidth, pillOpacity]);

  const handleItemLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setItemLayouts((prev) => {
      const existing = prev[index];
      if (existing && existing.x === x && existing.width === width) return prev;
      return { ...prev, [index]: { x, width } };
    });
  };

  const handleContentWidth = (index: number) => (width: number) => {
    setContentWidths((prev) => (prev[index] === width ? prev : { ...prev, [index]: width }));
  };

  return (
    <View style={[styles.wrap, { bottom: (insets.bottom || 12) + 8 }]} pointerEvents="box-none">
      <View style={styles.capsule}>
        {/* A plain View owns the pill clip — BlurView doesn't reliably honor its own
            borderRadius/overflow for nested children on web, which was the hard rectangle. */}
        <View style={styles.tabBarClip}>
          {/* Stronger than a typical frosted overlay on purpose — at low intensity,
              scroll content behind the bar (e.g. a card's square corners) reads through
              as a mismatched shape against the pill's rounded silhouette. */}
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.tabBarTint]} />
        </View>
        {/* Icons and the active bubble render as a sibling of the blurred glass layer,
            not nested inside it — a crisp, bordered pill inside a backdrop-filter +
            overflow:hidden container is a known source of halo/glow bleed on WebKit. */}
        <View style={styles.tabBarRow} pointerEvents="box-none">
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activePill,
              {
                opacity: pillOpacity,
                width: pillWidth,
                transform: [{ translateX: pillX }],
              },
            ]}
          />
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
              <TabBarItem
                key={route.key}
                isFocused={isFocused}
                label={label}
                Icon={Icon}
                onPress={onPress}
                onLayout={handleItemLayout(index)}
                onContentWidth={handleContentWidth(index)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TabBarItem({
  isFocused,
  label,
  Icon,
  onPress,
  onLayout,
  onContentWidth,
}: {
  isFocused: boolean;
  label: string;
  Icon: typeof House;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  onContentWidth: (width: number) => void;
}) {
  // Drives the label "opening" out from beside the icon once its tab becomes active.
  const [reveal] = useState(() => new Animated.Value(isFocused ? 1 : 0));
  // Measured once from an invisible copy of the label so the local reveal hugs the
  // label's real width instead of a guessed constant.
  const [labelWidth, setLabelWidth] = useState<number>();
  // The pill's true fully-revealed width (icon + gap + label), from the invisible
  // clone below. Used both to size this tab's own hit target when focused (so it never
  // has to center content wider than itself — the root cause of the pill and icon/label
  // drifting out of alignment) and, via onContentWidth, to size the shared bubble.
  const [contentWidth, setContentWidth] = useState<number>();

  useEffect(() => {
    Animated.spring(reveal, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 100,
    }).start();
  }, [isFocused, reveal]);

  const handleMeasureLabel = (event: LayoutChangeEvent) => {
    setLabelWidth(event.nativeEvent.layout.width);
  };

  const handleMeasureContent = (event: LayoutChangeEvent) => {
    // + LABEL_WIDTH_BUFFER to match the real, visible pill's fully-revealed width,
    // which (unlike this clone) pads its label reveal box by that same amount.
    const width = event.nativeEvent.layout.width + LABEL_WIDTH_BUFFER;
    setContentWidth(width);
    onContentWidth(width);
  };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabItem, { width: isFocused ? contentWidth : INACTIVE_ITEM_WIDTH }]}
      hitSlop={8}
      onLayout={onLayout}
    >
      <View style={styles.tabPill}>
        <Icon
          color={isFocused ? colors.accent.primary : colors.text.secondary}
          size={ICON_SIZE}
          strokeWidth={1.75}
        />
        <Animated.View
          style={{
            overflow: 'hidden',
            marginLeft: reveal.interpolate({ inputRange: [0, 1], outputRange: [0, LABEL_GAP] }),
            width: reveal.interpolate({
              inputRange: [0, 1],
              outputRange: [0, labelWidth === undefined ? 0 : labelWidth + LABEL_WIDTH_BUFFER],
            }),
            opacity: reveal,
            transform: [
              { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
            ],
          }}
        >
          <Text style={[typography.label, styles.tabLabel]} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
        {/* Invisible twin used only to measure the label's natural width. */}
        <Text
          style={[typography.label, styles.tabLabel, styles.labelMeasure]}
          numberOfLines={1}
          onLayout={handleMeasureLabel}
          pointerEvents="none"
        >
          {label}
        </Text>
      </View>
      {/* Invisible, fully-revealed clone of the pill above — its rendered width is what
          the shared bubble in the parent is sized to, so the icon/label padding inside
          the bubble matches this pill's own exactly instead of a predicted number. */}
      <View
        style={[styles.tabPill, styles.contentMeasure]}
        onLayout={handleMeasureContent}
        pointerEvents="none"
      >
        <Icon color={colors.accent.primary} size={ICON_SIZE} strokeWidth={1.75} />
        <View style={{ marginLeft: LABEL_GAP }}>
          <Text style={[typography.label, styles.tabLabel]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
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
  wrap: {
    position: 'absolute',
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    alignItems: 'center',
  },
  // Fixed-height stage both the blurred glass layer and the (unblurred) icon row
  // overlay to fill, so they line up exactly despite being drawn as siblings.
  capsule: {
    alignSelf: 'stretch',
    height: 56,
  },
  // Owns the pill shape and clips BlurView + the tint to it — see the comment at the
  // call site for why this can't be the BlurView's own style prop on web.
  tabBarClip: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
    // Elevation so the capsule reads as floating above scroll content on both platforms.
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  // DESIGN.md section 4: frosted-glass fill for floating controls. Dark, not white,
  // and substantially opaque — a light/low-alpha tint doesn't add enough coverage to
  // fully hide scroll content (e.g. a card's edge) behind the bar at 375x812; matching
  // the app's own near-black background at higher alpha does.
  tabBarTint: {
    backgroundColor: 'rgba(10, 13, 24, 0.55)',
  },
  tabBarRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: ROW_PAD_H,
    // Tabs are sized to their own content (see INACTIVE_ITEM_WIDTH / TabBarItem's
    // width), not an equal flex:1 share — the active tab's revealed label needs more
    // room than an even four-way split gives it. space-between distributes whatever
    // room is left between the four differently-sized tabs instead.
    justifyContent: 'space-between',
    // Clips the icons + active bubble to the capsule's own pill silhouette. This is a
    // separate, un-blurred clip from tabBarClip's (which owns the backdrop-filter) —
    // without it, a bubble mid-animation has nothing stopping it from painting past
    // the capsule's rounded corner.
    overflow: 'hidden',
    borderRadius: radius.pill,
  },
  activePill: {
    position: 'absolute',
    top: 8,
    left: 0,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primaryMuted,
    borderWidth: PILL_BORDER,
    borderColor: colors.accent.primaryBorder,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: PILL_PAD_H,
    borderRadius: radius.pill,
  },
  tabLabel: {
    color: colors.accent.primary,
  },
  labelMeasure: {
    position: 'absolute',
    opacity: 0,
  },
  contentMeasure: {
    position: 'absolute',
    opacity: 0,
  },
});
