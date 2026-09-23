import { StyleSheet, Text, View } from 'react-native';
import { Breathing } from './Breathing';
import { colors, radius, spacing, typography } from '../theme';

export function LoadingView({ label }: { label: string }) {
  return (
    <View style={styles.container}>
      <Breathing minOpacity={0.25} durationMs={1200} style={styles.pulse}>
        <View style={styles.barLong} />
        <View style={styles.barShort} />
      </Breathing>
      <Text style={[typography.label, styles.label]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  pulse: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLong: {
    width: 120,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.cardElevated,
  },
  barShort: {
    width: 72,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.card,
  },
  label: {
    color: colors.text.tertiary,
  },
});
