import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addMinutes, formatClock } from '../lib/wbtb';
import { colors, spacing, typography } from '../theme';

type TimeStepperProps = {
  value: Date;
  onChange: (value: Date) => void;
  min: Date;
  max: Date;
};

type StepButtonProps = {
  direction: 'up' | 'down';
  disabled: boolean;
  onPress: () => void;
  label: string;
};

function StepButton({ direction, disabled, onPress, label }: StepButtonProps) {
  const Icon = direction === 'up' ? ChevronUp : ChevronDown;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
    >
      <Icon
        color={disabled ? colors.border.default : colors.text.secondary}
        size={24}
        strokeWidth={1.5}
      />
    </Pressable>
  );
}

export function TimeStepper({ value, onChange, min, max }: TimeStepperProps) {
  const { hour, minute, period } = formatClock(value);

  const canStep = (minutes: number) => {
    const next = addMinutes(value, minutes);
    return next >= min && next <= max;
  };
  const step = (minutes: number) => onChange(addMinutes(value, minutes));

  return (
    <View style={styles.container}>
      <View style={styles.column}>
        <StepButton direction="up" label="One hour later" disabled={!canStep(60)} onPress={() => step(60)} />
        <Text style={[typography.clock, styles.digits]}>{hour}</Text>
        <StepButton direction="down" label="One hour earlier" disabled={!canStep(-60)} onPress={() => step(-60)} />
      </View>
      <Text style={[typography.clock, styles.separator]}>:</Text>
      <View style={styles.column}>
        <StepButton direction="up" label="15 minutes later" disabled={!canStep(15)} onPress={() => step(15)} />
        <Text style={[typography.clock, styles.digits]}>{minute}</Text>
        <StepButton direction="down" label="15 minutes earlier" disabled={!canStep(-15)} onPress={() => step(-15)} />
      </View>
      <Text style={[typography.heading, styles.period]}>{period}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    alignItems: 'center',
    minWidth: 88,
  },
  stepButton: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  stepButtonPressed: {
    backgroundColor: colors.surface.card,
  },
  digits: {
    color: colors.text.primary,
  },
  separator: {
    color: colors.text.tertiary,
    marginHorizontal: spacing.xs,
  },
  period: {
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
});
