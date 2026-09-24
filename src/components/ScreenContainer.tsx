import { PropsWithChildren, useId } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors, spacing } from '../theme';

type ScreenContainerProps = PropsWithChildren<{
  style?: ViewStyle;
  edges?: Edge[];
  glow?: boolean;
}>;

const GLOW_HEIGHT = 520;

function TopGlow() {
  // Gradient ids must be unique per mounted screen, or web resolves every url() to the first one.
  const id = `glow${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width="100%" height={GLOW_HEIGHT} style={styles.glow} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="0%" rx="85%" ry="75%" fx="50%" fy="0%">
          <Stop offset="0" stopColor={colors.accent.primary} stopOpacity={0.16} />
          <Stop offset="0.55" stopColor={colors.accent.primary} stopOpacity={0.04} />
          <Stop offset="1" stopColor={colors.accent.primary} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export function ScreenContainer({
  children,
  style,
  edges = ['top', 'bottom'],
  glow = true,
}: ScreenContainerProps) {
  return (
    <View style={styles.root}>
      {glow ? <TopGlow /> : null}
      <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
});
