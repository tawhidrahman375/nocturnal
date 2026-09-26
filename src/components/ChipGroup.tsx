import { useEffect, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, EASE_IN_OUT, SETTLE_SPRING } from '../lib/motion';
import { colors, radius, spacing, typography } from '../theme';

type ChipGroupProps<T extends string | number> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format: (value: T) => string;
};

type ItemLayout = { x: number; width: number };

// The Settle token: a single fill slides behind whichever chip is selected instead of
// each chip owning its own static highlight — the same mechanism as the tab bar's
// active-tab bubble, for a consistent selection language across the app.
export function ChipGroup<T extends string | number>({ options, value, onChange, format }: ChipGroupProps<T>) {
  const reducedMotion = useReducedMotion();
  const [itemLayouts, setItemLayouts] = useState<Record<number, ItemLayout>>({});
  const [fillX] = useState(() => new Animated.Value(0));
  const [fillWidth] = useState(() => new Animated.Value(0));
  const [fillOpacity] = useState(() => new Animated.Value(0));

  const selectedIndex = options.indexOf(value);
  const activeLayout = itemLayouts[selectedIndex];

  useEffect(() => {
    if (!activeLayout) return;
    if (reducedMotion) {
      fillX.setValue(activeLayout.x);
      fillWidth.setValue(activeLayout.width);
      fillOpacity.setValue(1);
      return;
    }
    Animated.spring(fillX, { toValue: activeLayout.x, ...SETTLE_SPRING, useNativeDriver: true }).start();
    Animated.timing(fillWidth, {
      toValue: activeLayout.width,
      duration: DURATIONS.cross,
      easing: EASE_IN_OUT,
      useNativeDriver: false,
    }).start();
    Animated.timing(fillOpacity, { toValue: 1, duration: DURATIONS.cross, useNativeDriver: true }).start();
  }, [activeLayout, reducedMotion, fillX, fillWidth, fillOpacity]);

  const handleItemLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setItemLayouts((prev) => {
      const existing = prev[index];
      if (existing && existing.x === x && existing.width === width) return prev;
      return { ...prev, [index]: { x, width } };
    });
  };

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      <Animated.View
        pointerEvents="none"
        style={[
          styles.fill,
          { opacity: fillOpacity, width: fillWidth, transform: [{ translateX: fillX }] },
        ]}
      />
      {options.map((option, index) => {
        const selected = option === value;
        return (
          <AnimatedPressable
            key={option}
            onPress={() => onChange(option)}
            onLayout={handleItemLayout(index)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.chip, selected && styles.chipSelectedBorder]}
          >
            <Text style={[typography.bodyMedium, selected ? styles.labelSelected : styles.label]}>
              {format(option)}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(108, 142, 255, 0.14)',
  },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelectedBorder: {
    borderColor: colors.accent.primary,
  },
  label: {
    color: colors.text.secondary,
  },
  labelSelected: {
    color: colors.text.primary,
  },
});
