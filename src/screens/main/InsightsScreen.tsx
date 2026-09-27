import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Flame, Moon, Sparkles, Trophy, Waves } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { MainTabParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

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

        {totalDreams === 0 ? (
          <EmptyState
            icon={Waves}
            title="Nothing to trace yet."
            message="A pattern needs more than one night. Keep logging, and it will surface."
            tint={colors.text.secondary}
            action={{ label: 'Log a dream', onPress: () => navigation.navigate('Journal') }}
          />
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

            {totalDreams >= MIN_DREAMS_FOR_INSIGHT ? (
              <Arrive delay={100}>
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
});
