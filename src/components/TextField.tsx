import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { DURATIONS, EASE_IN_OUT } from '../lib/motion';
import { colors, radius, spacing, typography } from '../theme';

type TextFieldProps = TextInputProps & {
  label?: string;
};

// The Cross token: border color fades between states instead of snapping — always runs,
// even under reduced motion (DESIGN.md section 10), since it's a plain opacity/color
// crossfade with no slide or scale.
export function TextField({ label, style, onFocus, onBlur, ...props }: TextFieldProps) {
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

  const borderColor = focusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border.default, colors.accent.primary],
  });

  return (
    <View style={styles.container}>
      {label ? <Text style={[typography.label, styles.label]}>{label}</Text> : null}
      <Animated.View style={[styles.inputWrap, { borderColor }]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.text.tertiary}
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
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    justifyContent: 'center',
  },
  input: {
    height: 52,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
});
