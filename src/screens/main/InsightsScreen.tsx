import { Flame, LucideIcon, Moon, Sparkles, Trophy } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ProgressRing } from '../../components/ProgressRing';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useDreams } from '../../hooks/useDreams';
import { useProfile } from '../../hooks/useProfile';
import { colors, spacing, typography } from '../../theme';

export function InsightsScreen() {
  const { dreams } = useDreams();
  const { profile } = useProfile();

  const totalDreams = dreams.length;
  const lucidDreams = dreams.filter((dream) => dream.is_lucid).length;
  const lucidRate = totalDreams > 0 ? Math.round((lucidDreams / totalDreams) * 100) : 0;
  const currentStreak = profile?.current_streak ?? 0;
  const longestStreak = profile?.longest_streak ?? 0;

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.displayMd, styles.title]}>Insights</Text>
      </View>

      {totalDreams === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Not enough data yet"
          message="Log a few dreams and patterns in your lucidity will show up here."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Card style={styles.heroCard} elevated>
            <ProgressRing size={140} strokeWidth={12} progress={lucidRate / 100} color={colors.status.lucid}>
              <Text style={[typography.displayLg, styles.heroValue]}>{lucidRate}%</Text>
            </ProgressRing>
            <Text style={[typography.bodyMedium, styles.heroTitle]}>Lucid dream rate</Text>
            <Text style={[typography.body, styles.heroBody]}>
              {lucidDreams} of {totalDreams} logged dreams were lucid.
            </Text>
          </Card>

          <View style={styles.statsRow}>
            <StatCard icon={Flame} iconColor={colors.status.lucid} value={currentStreak} label="Day streak" />
            <StatCard icon={Trophy} iconColor={colors.accent.secondary} value={longestStreak} label="Best streak" />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon={Moon} iconColor={colors.accent.primary} value={totalDreams} label="Dreams logged" />
            <StatCard icon={Sparkles} iconColor={colors.status.lucid} value={lucidDreams} label="Lucid dreams" />
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

function StatCard({
  icon: Icon,
  iconColor,
  value,
  label,
}: {
  icon: LucideIcon;
  iconColor: string;
  value: number;
  label: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Icon color={iconColor} size={20} strokeWidth={1.5} />
      <Text style={[typography.displayMd, styles.statValue]}>{value}</Text>
      <Text style={[typography.caption, styles.statLabel]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
  },
  scroll: {
    paddingBottom: spacing.xxl,
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
  heroTitle: {
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  heroBody: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    gap: spacing.xs,
  },
  statValue: {
    color: colors.text.primary,
  },
  statLabel: {
    color: colors.text.secondary,
  },
});
