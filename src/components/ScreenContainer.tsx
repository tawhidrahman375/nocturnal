import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

type ScreenContainerProps = PropsWithChildren<{
  style?: ViewStyle;
  scroll?: boolean;
  edges?: Edge[];
}>;

export function ScreenContainer({
  children,
  style,
  edges = ['top', 'bottom'],
}: ScreenContainerProps) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.background.secondary, colors.background.primary]}
        style={StyleSheet.absoluteFill}
      />
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
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
});
