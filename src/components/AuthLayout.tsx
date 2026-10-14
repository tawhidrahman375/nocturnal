import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Arrive } from './Arrive';
import { GlassBackButton } from './GlassBackButton';
import { NightSky } from './NightSky';
import { colors, spacing } from '../theme';

type AuthLayoutProps = PropsWithChildren<{
  onBack: () => void;
  backLabel?: string;
}>;

// The shared frame for the sign in / sign up screens (design.md section 3g): content floats
// straight on the NightSky, with no panel or card. The top 35% is left as empty sky, a glass
// back pill sits in the top left below the status bar, and the content scrolls so it still
// fits on a short screen or with the keyboard open.
export function AuthLayout({ onBack, backLabel = 'Back', children }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <NightSky intensity="full" style={styles.sky}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Empty sky: gives way on a short screen rather than pushing the form off the bottom. */}
          <View style={styles.skySpace} />
          <Arrive>{children}</Arrive>
        </ScrollView>

        <View style={[styles.backButton, { top: insets.top + spacing.screenPadding }]}>
          <GlassBackButton onPress={onBack} accessibilityLabel={backLabel} />
        </View>
      </NightSky>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  sky: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  skySpace: {
    height: '35%',
    minHeight: spacing.xxl,
    flexShrink: 1,
  },
  backButton: {
    position: 'absolute',
    left: spacing.screenPadding,
  },
});
