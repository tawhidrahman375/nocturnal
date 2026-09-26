import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Breathing } from './Breathing';
import { Button } from './Button';
import { colors, spacing, typography } from '../theme';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  message: string;
  tint?: string;
  // Optional so the other two call sites (WbtbSessionScreen, ClosedStage) render exactly
  // as before — every empty state that's a genuine dead end should still pass one.
  action?: { label: string; onPress: () => void };
};

// A flat grey icon-in-a-circle reads as an unfinished screen. A soft breathing glow
// behind the icon gives the same real estate some presence instead.
export function EmptyState({
  icon: Icon,
  title,
  message,
  tint = colors.accent.primary,
  action,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badgeStack}>
        <Breathing style={styles.glow} minOpacity={0.5} maxOpacity={1} durationMs={3200}>
          <View style={[styles.glowFill, { backgroundColor: tint }]} />
        </Breathing>
        <View style={[styles.iconWrap, { borderColor: withAlpha(tint, 0.32) }]}>
          <Icon color={tint} size={26} strokeWidth={1.5} />
        </View>
      </View>
      <Text style={[typography.heading, styles.title]}>{title}</Text>
      <Text style={[typography.body, styles.message]}>{message}</Text>
      {action ? (
        <Button label={action.label} onPress={action.onPress} style={styles.action} />
      ) : null}
    </View>
  );
}

function withAlpha(hex: string, alpha: number) {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  badgeStack: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  glow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  glowFill: {
    flex: 1,
    borderRadius: 36,
    opacity: 0.16,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface.cardElevated,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.sm,
    // Button defaults to alignSelf:'flex-start'; this container centers everything else.
    alignSelf: 'center',
  },
  message: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
