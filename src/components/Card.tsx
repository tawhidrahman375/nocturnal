import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

type CardProps = PropsWithChildren<{
  style?: ViewStyle;
  elevated?: boolean;
}>;

export function Card({ children, style, elevated }: CardProps) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    // Depth comes from a flat color shift off the background, not a stroke. Rule of
    // thumb for when to use this component at all: a single floating action/headline
    // prompt (WBTB/Track on Home) stays a bare View and doesn't use Card; a module
    // presenting multiple discrete list-like items (a checklist, a settings list, a
    // journal list) uses Card so the group reads as one contained unit. Full-screen
    // empty states also stay bare on purpose.
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.card,
    padding: spacing.cardPadding,
  },
  elevated: {
    backgroundColor: colors.surface.cardElevated,
  },
});
