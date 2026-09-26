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
    // A real fill + hairline, not a flat opaque block — reads as glass sitting a step
    // above the atmosphere behind it, distinct from the deliberately card-less WBTB/Track
    // components and the full-screen empty states, which stay bare on purpose.
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.card,
    padding: spacing.cardPadding,
  },
  elevated: {
    backgroundColor: colors.surface.cardElevated,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
  },
});
