import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Eye, LogOut } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  return `Every ${formatDuration(settings.frequency_minutes)} · ${formatTime(start)}–${formatTime(end)}`;
}

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const { settings } = useRealityCheckSettings();

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.displayMd, styles.title]}>You</Text>
      </View>

      <Card style={styles.card}>
        <Text style={[typography.label, styles.label]}>Signed in as</Text>
        <Text style={[typography.bodyMedium, styles.email]}>{user?.email}</Text>
      </Card>

      <Pressable onPress={() => navigation.navigate('RealityCheckSetup')}>
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
      </Pressable>

      <Pressable style={styles.signOutRow} onPress={signOut}>
        <LogOut color="#F87171" size={18} strokeWidth={1.5} />
        <Text style={[typography.bodyMedium, styles.signOutText]}>Sign out</Text>
      </Pressable>
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
