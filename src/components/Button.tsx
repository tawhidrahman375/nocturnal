import { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, radius, typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'sm';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const LABEL_COLOR: Record<ButtonVariant, string> = {
  primary: colors.text.onAccent,
  secondary: colors.accent.primary,
  ghost: colors.text.secondary,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled,
  loading,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  // A dimmed accent fill reads as muddy on navy, so disabled buttons drop to a neutral surface.
  const labelColor = disabled ? colors.text.tertiary : LABEL_COLOR[variant];

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        styles[variant],
        disabled && (variant === 'primary' ? styles.primaryDisabled : styles.outlineDisabled),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <>
          {Icon ? <Icon color={labelColor} size={size === 'sm' ? 16 : 20} strokeWidth={1.75} /> : null}
          <Text
            style={[size === 'sm' ? typography.label : typography.bodyMedium, { color: labelColor }]}
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.pill,
    // Buttons hug their label by default — a parent opts a row back into equal-width
    // pairing with an explicit `flex: 1` override, but nothing stretches edge-to-edge.
    alignSelf: 'flex-start',
  },
  md: {
    height: 52,
    paddingHorizontal: 24,
  },
  sm: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  primary: {
    backgroundColor: colors.accent.primary,
  },
  secondary: {
    backgroundColor: colors.accent.primaryMuted,
    borderWidth: 1,
    borderColor: colors.accent.primaryBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  primaryDisabled: {
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  outlineDisabled: {
    backgroundColor: 'transparent',
    borderColor: colors.border.default,
  },
});
