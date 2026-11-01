import { useNavigation } from '@react-navigation/native';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, radius, spacing, typography } from '../theme';

// Home's entry into the Technique Library: a single glass row, quieter than the WBTB and
// 30-day track cards above it.
export function TechniqueLibraryCard() {
  const navigation = useNavigation();

  return (
    <AnimatedPressable
      onPress={() => navigation.navigate('TechniqueLibrary')}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel="Technique Library"
      style={styles.card}
    >
      <BookOpen color={colors.accent.primary} size={22} strokeWidth={1.5} />
      <View style={styles.text}>
        <Text style={[typography.bodyMedium, styles.title]}>Technique Library</Text>
        <Text style={[typography.label, styles.subtitle]}>MILD, WILD, WBTB and SSILD explained</Text>
      </View>
      <ChevronRight color={colors.text.tertiary} size={20} strokeWidth={1.5} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
    borderRadius: radius.glass,
    backgroundColor: colors.surface.glass,
    padding: spacing.md,
  },
  text: { flex: 1, gap: 2 },
  title: { color: colors.text.primary },
  subtitle: { color: colors.text.secondary },
});
