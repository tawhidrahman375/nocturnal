import { Flame, Moon, PenLine } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BeginnerTrackCard } from '../../components/BeginnerTrackCard';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { WbtbCard } from '../../components/WbtbCard';
import { useAuth } from '../../hooks/useAuth';
import { useDreams } from '../../hooks/useDreams';
import { useProfile } from '../../hooks/useProfile';
import { colors, radius, spacing, typography } from '../../theme';

export function HomeScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { dreams } = useDreams();

  const greetingName = profile?.display_name || user?.email?.split('@')[0] || 'dreamer';
  const recentDreams = dreams.slice(0, 3);

  return (
    <ScreenContainer edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[typography.label, styles.eyebrow]}>Welcome back</Text>
          <Text style={[typography.displayMd, styles.name]}>{greetingName}</Text>
        </View>

        <WbtbCard />

        <BeginnerTrackCard />

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Flame color={colors.status.lucid} size={20} strokeWidth={1.5} />
            <Text style={[typography.displayMd, styles.statValue]}>
              {profile?.current_streak ?? 0}
            </Text>
            <Text style={[typography.caption, styles.statLabel]}>Day streak</Text>
          </Card>
          <Card style={styles.statCard}>
            <Moon color={colors.accent.primary} size={20} strokeWidth={1.5} />
            <Text style={[typography.displayMd, styles.statValue]}>{dreams.length}</Text>
            <Text style={[typography.caption, styles.statLabel]}>Dreams logged</Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[typography.heading, styles.sectionTitle]}>Recent dreams</Text>
          {recentDreams.length === 0 ? (
            <Card>
              <View style={styles.emptyRow}>
                <PenLine color={colors.text.tertiary} size={18} strokeWidth={1.5} />
                <Text style={[typography.body, styles.emptyText]}>
                  Nothing logged yet. Head to Journal to record tonight&apos;s dream.
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
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
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
