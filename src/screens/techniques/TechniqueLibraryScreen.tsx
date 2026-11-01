import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronRight } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { GlassBackButton } from '../../components/GlassBackButton';
import { NightSky } from '../../components/NightSky';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TECHNIQUE_IDS, TECHNIQUES } from '../../lib/techniqueLibrary';
import { AppStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TechniqueLibrary'>;

export function TechniqueLibraryScreen({ navigation }: Props) {
  return (
    <ScreenContainer edges={['top', 'bottom']} edgeToEdge>
      <NightSky intensity="subtle" style={styles.sky}>
        <View style={styles.header}>
          <GlassBackButton onPress={() => navigation.goBack()} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Arrive>
            <Text style={[typography.heroTitle, styles.title]}>Techniques</Text>
            <Text style={[typography.body, styles.subtitle]}>
              Four ways to become aware inside a dream. Read how each works, then practise it.
            </Text>
          </Arrive>

          {TECHNIQUE_IDS.map((id, index) => {
            const technique = TECHNIQUES[id];
            return (
              <Arrive key={id} delay={60 + index * 40}>
                <AnimatedPressable
                  onPress={() => navigation.navigate('TechniqueDetail', { technique: id })}
                  scaleTo={0.985}
                  accessibilityRole="button"
                  accessibilityLabel={`${technique.name}, ${technique.fullName}`}
                  style={styles.card}
                >
                  <View style={styles.cardText}>
                    <View style={styles.nameRow}>
                      <Text style={[typography.heading, styles.name]}>{technique.name}</Text>
                      <View style={styles.chip}>
                        <Text style={[typography.caption, styles.chipText]}>{technique.difficulty}</Text>
                      </View>
                    </View>
                    <Text style={[typography.label, styles.fullName]}>{technique.fullName}</Text>
                    <Text style={[typography.body, styles.tagline]}>{technique.tagline}</Text>
                  </View>
                  <ChevronRight color={colors.text.tertiary} size={20} strokeWidth={1.5} />
                </AnimatedPressable>
              </Arrive>
            );
          })}
        </ScrollView>
      </NightSky>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sky: { flex: 1 },
  header: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.md },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: { color: colors.text.primary },
  subtitle: { color: colors.text.secondary, marginTop: spacing.sm, marginBottom: spacing.sm },
  // Same glass row as the Insights accordions: no border, overflow clips to the radius.
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
    borderRadius: radius.glass,
    backgroundColor: colors.surface.glass,
    padding: spacing.md,
  },
  cardText: { flex: 1, gap: spacing.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { color: colors.text.primary },
  chip: {
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipText: { color: colors.accent.primary },
  fullName: { color: colors.text.secondary },
  tagline: { fontFamily: fontFamily.regular, color: colors.text.primary },
});
