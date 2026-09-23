import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

const STEPS = [1, 2, 3] as const;

type SessionHeaderProps = {
  label: string;
  step?: (typeof STEPS)[number];
  onClose: () => void;
};

export function SessionHeader({ label, step, onClose }: SessionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.meta}>
        {step ? (
          <View style={styles.segments}>
            {STEPS.map((s) => (
              <View key={s} style={[styles.segment, s <= step && styles.segmentActive]} />
            ))}
          </View>
        ) : null}
        <Text style={[typography.label, styles.label]}>{label}</Text>
      </View>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close session"
      >
        <X color={colors.text.tertiary} size={24} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  meta: {
    flex: 1,
    gap: spacing.sm,
  },
  segments: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    maxWidth: 40,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.border.default,
  },
  segmentActive: {
    backgroundColor: colors.accent.primary,
  },
  label: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
