import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Lock, LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, radius, spacing, typography } from '../theme';

type ProUpsellProps = {
  icon: LucideIcon;
  label: string;
  text: string;
};

// What a Pro-only card shows to a free user in place of its content: the same glass row as
// AccordionItem, with a lock and a line on what it does. The whole row opens the paywall.
export function ProUpsell({ icon: Icon, label, text }: ProUpsellProps) {
  const navigation = useNavigation();

  return (
    <AnimatedPressable
      onPress={() => navigation.navigate('Paywall', { source: 'feature_gate' })}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Unlock with Pro`}
      style={styles.container}
    >
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Icon color={colors.text.secondary} size={16} strokeWidth={1.5} />
        <Text style={[typography.overline, styles.label]}>{label}</Text>
        <Lock color={colors.accent.primary} size={16} strokeWidth={1.75} />
      </View>
      <Text style={[typography.body, styles.text]}>{text}</Text>
      <Text style={[typography.label, styles.cta]}>Unlock with Pro</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: radius.glass,
    backgroundColor: colors.surface.glass,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { flex: 1, fontSize: 13, color: colors.text.secondary },
  text: { color: colors.text.secondary },
  cta: { color: colors.accent.primary },
});
