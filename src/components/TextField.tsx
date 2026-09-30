import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { DURATIONS, EASE_IN_OUT } from '../lib/motion';
import { colors, radius, spacing, typography } from '../theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  // 'glass': a frosted fill with a 16px radius, for fields that float directly on the sky
  // (the auth screens, design.md section 3g). The default sits on a flat card surface.
  variant?: 'default' | 'glass';
};

// The Cross token: the fill fades between states instead of snapping — always runs,
// even under reduced motion (DESIGN.md section 10), since it's a plain opacity/color
// crossfade with no slide or scale.
export function TextField({ label, variant = 'default', style, onFocus, onBlur, ...props }: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [focusProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.timing(focusProgress, {
      toValue: isFocused ? 1 : 0,
      duration: DURATIONS.cross,
      easing: EASE_IN_OUT,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [isFocused, focusProgress]);

  // Inputs are borderless (design.md section 4): focus brightens the fill to glass instead.
  const backgroundColor = focusProgress.interpolate({
    inputRange: [0, 1],
    outputRange:
      variant === 'glass'
        ? [colors.surface.glass, colors.surface.glassFocused]
        : [colors.surface.card, colors.surface.glass],
  });

  return (
    <View style={styles.container}>
      {label ? <Text style={[typography.label, styles.label]}>{label}</Text> : null}
      <Animated.View
        style={[styles.inputWrap, variant === 'glass' && styles.inputWrapGlass, { backgroundColor }]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={variant === 'glass' ? colors.text.secondary : colors.text.tertiary}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  inputWrap: {
    borderRadius: radius.button,
    justifyContent: 'center',
  },
  inputWrapGlass: {
    borderRadius: radius.glass,
  },
  input: {
    height: 52,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
});
