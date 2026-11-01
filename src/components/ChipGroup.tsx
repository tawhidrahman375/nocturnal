import { useEffect, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { DURATIONS, SETTLE_SPRING } from '../lib/motion';
import { colors, radius, spacing, typography } from '../theme';

type ChipGroupProps<T extends string | number> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format: (value: T) => string;
  // 'solid': 16px-radius glass chips with a solid accent fill behind the selected one, for
  // the screens that sit on the night sky. The default is the quieter pill used elsewhere.
  variant?: 'pill' | 'solid';
};

type ItemLayout = { x: number; width: number };

// The Settle token: a single fill slides behind whichever chip is selected instead of
// each chip owning its own static highlight — the same mechanism as the tab bar's
// active-tab bubble, for a consistent selection language across the app.
export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  format,
  variant = 'pill',
}: ChipGroupProps<T>) {
  const solid = variant === 'solid';
  const reducedMotion = useReducedMotion();
  const [itemLayouts, setItemLayouts] = useState<Record<number, ItemLayout>>({});
  const [fillX] = useState(() => new Animated.Value(0));
  const [fillOpacity] = useState(() => new Animated.Value(0));

  const selectedIndex = options.indexOf(value);
  const activeLayout = itemLayouts[selectedIndex];

  useEffect(() => {
    if (!activeLayout) return;
    if (reducedMotion) {
      fillX.setValue(activeLayout.x);
      fillOpacity.setValue(1);
      return;
    }
    // Chips are flex: 1, so every chip has the same width and only the position animates.
    // The fill's width follows the layout directly, which keeps both values native-driven.
    Animated.spring(fillX, { toValue: activeLayout.x, ...SETTLE_SPRING, useNativeDriver: true }).start();
    Animated.timing(fillOpacity, { toValue: 1, duration: DURATIONS.cross, useNativeDriver: true }).start();
  }, [activeLayout, reducedMotion, fillX, fillOpacity]);

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
          solid && styles.fillSolid,
          { opacity: fillOpacity, width: activeLayout?.width ?? 0, transform: [{ translateX: fillX }] },
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
            style={[styles.chip, solid && styles.chipSolid, selected && styles.chipSelected]}
          >
            <Text
              style={[
                typography.bodyMedium,
                selected ? styles.labelSelected : styles.label,
                solid && selected && styles.labelSolidSelected,
              ]}
            >
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
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillSolid: {
    borderRadius: radius.glass,
    backgroundColor: colors.accent.primary,
  },
  chipSolid: {
    borderRadius: radius.glass,
    backgroundColor: colors.surface.glassSoft,
  },
  // The sliding fill sits behind the selected chip, so the chip itself goes clear to let it show.
  chipSelected: {
    backgroundColor: 'transparent',
  },
  label: {
    color: colors.text.secondary,
  },
  labelSelected: {
    color: colors.text.primary,
  },
  labelSolidSelected: {
    color: '#FFFFFF',
  },
});
