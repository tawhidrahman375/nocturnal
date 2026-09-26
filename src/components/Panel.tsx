import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

type PanelProps = PropsWithChildren<{
  style?: ViewStyle;
}>;

// DESIGN.md §4: the one full-bleed content panel per screen — a flat color shift off
// the background (never a border/shadow), rounded top corners only, bleeding to the
// screen's bottom edge. Holds everything below the screen title; the title itself and
// any floating glass-pill controls stay outside it, directly on the background.
export function Panel({ children, style }: PanelProps) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
});
