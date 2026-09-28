import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Compass, Flame, MessageCircle, Moon, Sparkles, Trophy, Waves } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { NightSky } from '../../components/NightSky';
import { ProgressRing } from '../../components/ProgressRing';
import { ScreenContainer } from '../../components/ScreenContainer';
import { StatPill } from '../../components/StatPill';
import { MIN_DREAMS_FOR_INSIGHT, useDreamInsight } from '../../hooks/useDreamInsight';
import { useDreams } from '../../hooks/useDreams';
import { useProfile } from '../../hooks/useProfile';
import { useTechniqueRecommendation } from '../../hooks/useTechniqueRecommendation';
import { MainTabParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

function CoachChatEntry() {
  // Untyped useNavigation (not the tab-scoped hook InsightsScreen itself uses below) so
  // this can reach CoachChat, a root AppStackParamList screen rather than a sibling tab
  // — same pattern WbtbCard and BeginnerTrackCard use to reach their own root screens.
  const navigation = useNavigation();

  return (
    <AnimatedPressable
      onPress={() => navigation.navigate('CoachChat')}
      accessibilityRole="button"
      accessibilityLabel="Open coach chat"
    >
      <Card style={styles.coachCard} elevated>
        <View style={styles.coachIconWrap}>
          <MessageCircle color={colors.accent.primary} size={20} strokeWidth={1.75} />
        </View>
        <View style={styles.coachCopy}>
          <Text style={[typography.bodyMedium, styles.coachTitle]}>Talk to your coach</Text>
          <Text style={[typography.label, styles.coachSubtitle]}>
            Techniques, sleep science, your own dream signs.
          </Text>
        </View>
        <ChevronRight color={colors.text.tertiary} size={20} strokeWidth={1.5} />
      </Card>
    </AnimatedPressable>
  );
}

// Reuses the same card chrome as the "Insight" card below (insightCard/insightHeader/
// insightLabel/insightBody styles) — same card style, same NightSky background behind
// it, per spec. Renders in both the populated and empty-account branches below so the
// no-history fallback (lib/techniqueRecommendation.ts) is reachable on a fresh account
// too, not just once there's enough data for the rest of the screen to unlock.
function TechniqueRecommendationCard() {
  const { recommendation, isLoading } = useTechniqueRecommendation();

  return (
    <Card style={styles.insightCard} elevated>
      <View style={styles.insightHeader}>
        <Compass color={colors.accent.primary} size={16} strokeWidth={1.75} />
        <Text style={[typography.label, styles.insightLabel]}>Your technique</Text>
      </View>
      {isLoading ? (
        <Text style={[typography.body, styles.insightPending]}>Finding your focus...</Text>
      ) : (
        <Text style={[typography.body, styles.insightBody]}>{recommendation}</Text>
      )}
    </Card>
  );
}

export function InsightsScreen() {
  const { dreams } = useDreams();
  const { profile } = useProfile();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const totalDreams = dreams.length;
  const { insight, isLoading: insightLoading } = useDreamInsight(totalDreams);
  const lucidDreams = dreams.filter((dream) => dream.is_lucid).length;
  const lucidRate = totalDreams > 0 ? Math.round((lucidDreams / totalDreams) * 100) : 0;
  const currentStreak = profile?.current_streak ?? 0;
  const longestStreak = profile?.longest_streak ?? 0;

  return (
    <ScreenContainer edges={['top']} edgeToEdge>
      <NightSky intensity="subtle" style={styles.sky}>
        <View style={styles.header}>
          <Text style={[typography.heroTitle, styles.title]}>Insights</Text>
        </View>

        <Arrive style={styles.coachEntryWrap}>
          <CoachChatEntry />
        </Arrive>

        {totalDreams === 0 ? (
          <>
            <EmptyState
              icon={Waves}
              title="Nothing to trace yet."
              message="A pattern needs more than one night. Keep logging, and it will surface."
              tint={colors.text.secondary}
              action={{ label: 'Log a dream', onPress: () => navigation.navigate('Journal') }}
            />
            <Arrive delay={80} style={styles.emptyTechniqueWrap}>
              <TechniqueRecommendationCard />
            </Arrive>
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Arrive>
              <Card style={styles.heroCard} elevated>
                <ProgressRing size={140} strokeWidth={12} progress={lucidRate / 100} color={colors.status.lucid}>
                  <Text style={[typography.displayLg, styles.heroValue]}>{lucidRate}%</Text>
                </ProgressRing>
                <Text style={[typography.bodyMedium, styles.heroCaption]}>Lucid dream rate</Text>
                <Text style={[typography.body, styles.heroBody]}>
                  {lucidDreams} of {totalDreams} logged dreams were lucid.
                </Text>
              </Card>
            </Arrive>

            <Arrive delay={60} style={styles.statsRow}>
              <StatPill icon={Flame} value={currentStreak} label="Day streak" tint={colors.accent.primary} />
              <StatPill icon={Trophy} value={longestStreak} label="Best streak" tint={colors.text.secondary} />
              <StatPill icon={Moon} value={totalDreams} label="Logged" tint={colors.text.secondary} />
            </Arrive>

            <Arrive delay={90}>
              <TechniqueRecommendationCard />
            </Arrive>

            {totalDreams >= MIN_DREAMS_FOR_INSIGHT ? (
              <Arrive delay={130}>
                <Card style={styles.insightCard} elevated>
                  <View style={styles.insightHeader}>
                    <Sparkles color={colors.accent.primary} size={16} strokeWidth={1.75} />
                    <Text style={[typography.label, styles.insightLabel]}>Insight</Text>
                  </View>
                  {insight ? (
                    <Text style={[typography.body, styles.insightBody]}>{insight.content}</Text>
                  ) : insightLoading ? (
                    <Text style={[typography.body, styles.insightPending]}>Reading your patterns...</Text>
                  ) : (
                    <Text style={[typography.body, styles.insightPending]}>
                      Check back after tonight&apos;s entry.
                    </Text>
                  )}
                </Card>
              </Arrive>
            ) : null}
          </ScrollView>
        )}
      </NightSky>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sky: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  title: {
    color: colors.text.primary,
  },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.tabBarClearance,
    gap: spacing.md,
  },
  heroCard: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xs,
  },
  heroValue: {
    color: colors.text.primary,
  },
  heroCaption: {
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  heroBody: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightCard: {
    gap: spacing.xs,
  },
  emptyTechniqueWrap: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  insightLabel: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightBody: {
    color: colors.text.primary,
  },
  insightPending: {
    color: colors.text.tertiary,
  },
  coachEntryWrap: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  coachIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  coachTitle: {
    color: colors.text.primary,
  },
  coachSubtitle: {
    color: colors.text.secondary,
  },
});
