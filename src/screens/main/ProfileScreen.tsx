import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Eye, LogOut } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { useRealityCheckSettings } from '../../hooks/useRealityCheckSettings';
import { formatDuration, formatTime } from '../../lib/wbtb';
import { colors, spacing, typography } from '../../theme';

function realityCheckSummary(settings: ReturnType<typeof useRealityCheckSettings>['settings']) {
  if (!settings || !settings.enabled) return 'Off';
  const start = new Date();
  start.setHours(Math.floor(settings.active_start_minutes / 60), settings.active_start_minutes % 60);
  const end = new Date();
  end.setHours(Math.floor(settings.active_end_minutes / 60), settings.active_end_minutes % 60);
  return `Every ${formatDuration(settings.frequency_minutes)} · ${formatTime(start)} to ${formatTime(end)}`;
}

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const { settings } = useRealityCheckSettings();

  return (
    <ScreenContainer edges={['top']}>
      <Arrive style={styles.header}>
        <Text style={[typography.heroTitle, styles.title]}>You</Text>
      </Arrive>

      <Arrive delay={40}>
        <Card style={styles.card}>
          <Text style={[typography.label, styles.label]}>Signed in as</Text>
          <Text style={[typography.bodyMedium, styles.email]}>{user?.email}</Text>
        </Card>
      </Arrive>

      <Arrive delay={80}>
        <AnimatedPressable onPress={() => navigation.navigate('RealityCheckSetup')}>
          <Card style={styles.rowCard}>
            <View style={styles.rowLeft}>
              <Eye color={colors.accent.primary} size={20} strokeWidth={1.5} />
              <View>
                <Text style={[typography.bodyMedium, styles.email]}>Reality checks</Text>
                <Text style={[typography.label, styles.label]}>{realityCheckSummary(settings)}</Text>
              </View>
            </View>
            <ChevronRight color={colors.text.tertiary} size={20} strokeWidth={1.5} />
          </Card>
        </AnimatedPressable>
      </Arrive>

      <Arrive delay={120}>
        <AnimatedPressable style={styles.signOutRow} onPress={signOut}>
          <LogOut color="#F87171" size={18} strokeWidth={1.5} />
          <Text style={[typography.bodyMedium, styles.signOutText]}>Sign out</Text>
        </AnimatedPressable>
      </Arrive>
    </ScreenContainer>
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
  card: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  rowCard: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.text.tertiary,
  },
  email: {
    color: colors.text.primary,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  signOutText: {
    color: '#F87171',
  },
});
