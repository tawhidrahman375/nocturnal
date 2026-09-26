import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Flame, LucideIcon, Moon, PenLine, Sparkles } from 'lucide-react-native';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Arrive } from '../../components/Arrive';
import { BeginnerTrackCard } from '../../components/BeginnerTrackCard';
import { Card } from '../../components/Card';
import { MilestoneOverlay } from '../../components/MilestoneOverlay';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TonightRoutineCard } from '../../components/TonightRoutineCard';
import { WbtbCard } from '../../components/WbtbCard';
import { useAuth } from '../../hooks/useAuth';
import { useDreams } from '../../hooks/useDreams';
import { useMilestoneCheck } from '../../hooks/useMilestoneCheck';
import { useProfile } from '../../hooks/useProfile';
import { MainTabParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

export function HomeScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { dreams } = useDreams();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  // Also owns milestone 3 (first AI insight) — see lib/aiInsight.ts for why nothing
  // calls `triggerFirstInsightMilestone` yet. Whatever eventually displays the first
  // real insight should grab it from this same hook instance and call it, so the
  // dismiss-and-navigate handling below already works for it unchanged.
  const { milestone, checkStreakMilestone, dismissMilestone } = useMilestoneCheck();

  const greetingName = profile?.display_name || user?.email?.split('@')[0] || 'dreamer';
  const recentDreams = dreams.slice(0, 3);
  const lucidDreams = dreams.filter((dream) => dream.is_lucid).length;
  const currentStreak = profile?.current_streak;

  useEffect(() => {
    if (user && currentStreak) checkStreakMilestone(user.id, currentStreak);
  }, [user, currentStreak, checkStreakMilestone]);

  const handleMilestoneDismiss = () => {
    const wasInsight = milestone === 'firstInsight';
    dismissMilestone();
    if (wasInsight) navigation.navigate('Insights');
  };

  return (
    <ScreenContainer edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Arrive style={styles.header}>
          <Text style={[typography.label, styles.eyebrow]}>Welcome back</Text>
          <Text style={[typography.heroTitle, styles.name]}>{greetingName}</Text>
        </Arrive>

        <Arrive delay={40}>
          <WbtbCard />
        </Arrive>

        <Arrive delay={80}>
          <BeginnerTrackCard />
        </Arrive>

        <Arrive delay={120} style={styles.statsRow}>
          <BareStat
            icon={Flame}
            value={profile?.current_streak ?? 0}
            label="Day streak"
            tint={colors.status.lucid}
          />
          <BareStat icon={Moon} value={dreams.length} label="Dreams logged" tint={colors.accent.primary} />
          <BareStat icon={Sparkles} value={lucidDreams} label="Lucid" tint={colors.accent.secondary} />
        </Arrive>

        <Arrive delay={160}>
          <TonightRoutineCard dreams={dreams} mildIntentionSetAt={profile?.mild_intention_set_at ?? null} />
        </Arrive>

        <Arrive delay={200} style={styles.section}>
          <Text style={[typography.heading, styles.sectionTitle]}>Recent dreams</Text>
          {recentDreams.length === 0 ? (
            <Card>
              <View style={styles.emptyRow}>
                <PenLine color={colors.text.tertiary} size={18} strokeWidth={1.5} />
                <Text style={[typography.body, styles.emptyText]}>
                  Nothing logged yet. Tonight&apos;s dream is still unwritten.
                </Text>
              </View>
            </Card>
          ) : (
            recentDreams.map((dream) => (
              <Card key={dream.id} style={styles.dreamCard}>
                <View style={styles.dreamCardHeader}>
                  <Text style={[typography.bodyMedium, styles.dreamTitle]} numberOfLines={1}>
                    {dream.title}
                  </Text>
                  {dream.is_lucid ? (
                    <View style={styles.lucidBadge}>
                      <Text style={[typography.caption, styles.lucidBadgeText]}>Lucid</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[typography.caption, styles.dreamDate]}>{dream.dreamed_at}</Text>
              </Card>
            ))
          )}
        </Arrive>
      </ScrollView>

      <MilestoneOverlay milestone={milestone} visible={milestone !== null} onDismiss={handleMilestoneDismiss} />
    </ScreenContainer>
  );
}

// No pill, no border — a bare numeral is the whole point here, per Opal's profile stats.
function BareStat({
  icon: Icon,
  value,
  label,
  tint,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  tint: string;
}) {
  return (
    <View style={styles.bareStat}>
      <Icon color={tint} size={16} strokeWidth={1.75} />
      <Text style={[typography.stat, styles.bareStatValue]}>{value}</Text>
      <Text style={[typography.caption, styles.bareStatLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: spacing.tabBarClearance,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs / 2,
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  bareStat: {
    alignItems: 'center',
    gap: 2,
  },
  bareStatValue: {
    color: colors.text.primary,
  },
  bareStatLabel: {
    color: colors.text.tertiary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text.primary,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.text.secondary,
    flex: 1,
  },
  dreamCard: {
    gap: spacing.xs,
  },
  dreamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dreamTitle: {
    color: colors.text.primary,
    flex: 1,
  },
  dreamDate: {
    color: colors.text.tertiary,
  },
  lucidBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  lucidBadgeText: {
    color: colors.status.lucid,
  },
});
