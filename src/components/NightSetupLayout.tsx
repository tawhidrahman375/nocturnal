import { X } from 'lucide-react-native';
import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from './AnimatedPressable';
import { NightSky } from './NightSky';
import { ScreenContainer } from './ScreenContainer';
import { colors, spacing, typography } from '../theme';

type NightSetupLayoutProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  onClose: () => void;
  // Pinned under the scrolling form, above the bottom safe area.
  footer: ReactNode;
  // Rendered outside the scroll area, e.g. a permission modal.
  overlay?: ReactNode;
}>;

// The shared frame for the WBTB setup screens: the night sky behind a centred eyebrow with a
// close button, a hero title, a scrolling form, and a footer pinned above the safe area.
// ScreenContainer only reserves the top inset, so the sky bleeds to the literal screen
// bottom and the bottom inset is added to the footer by hand.
export function NightSetupLayout({ eyebrow, title, onClose, footer, overlay, children }: NightSetupLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScreenContainer edges={['top']} edgeToEdge>
      <NightSky intensity="subtle" style={styles.sky}>
        <View style={styles.topBar}>
          <Text style={[typography.overline, styles.eyebrow]}>{eyebrow}</Text>
          <AnimatedPressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.close}
          >
            <X color={colors.text.secondary} size={24} strokeWidth={1.5} />
          </AnimatedPressable>
        </View>

        <Text style={[typography.heroTitle, styles.title]}>{title}</Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>{footer}</View>
      </NightSky>
      {overlay}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sky: {
    flex: 1,
  },
  // 24px below the safe-area top, one 24px row for the centred eyebrow and the close button.
  topBar: {
    marginTop: spacing.lg,
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  eyebrow: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  close: {
    position: 'absolute',
    top: 0,
    right: spacing.screenPadding,
  },
  title: {
    color: '#FFFFFF',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
  },
});
