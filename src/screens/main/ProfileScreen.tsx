import { useNavigation } from '@react-navigation/native';
import {
  AlarmClock,
  Bell,
  ChevronRight,
  Crown,
  Eye,
  FileText,
  Flame,
  LogOut,
  LucideIcon,
  Moon,
  RotateCcw,
  Shield,
  Trash,
} from 'lucide-react-native';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Card } from '../../components/Card';
import { DeleteAccountModal } from '../../components/DeleteAccountModal';
import { NightSky } from '../../components/NightSky';
import { Panel } from '../../components/Panel';
import { ScreenContainer } from '../../components/ScreenContainer';
import { StatPill } from '../../components/StatPill';
import { useAuth } from '../../hooks/useAuth';
import { useDreams } from '../../hooks/useDreams';
import { useProfile } from '../../hooks/useProfile';
import { useRealityCheckSettings } from '../../hooks/useRealityCheckSettings';
import { formatDuration, formatTime } from '../../lib/wbtb';
import { colors, spacing, typography } from '../../theme';

// TODO stub URLs — replace with the real hosted pages before App Store/Play submission
const PRIVACY_POLICY_URL = 'https://nocturnal.app/privacy';
const TERMS_OF_SERVICE_URL = 'https://nocturnal.app/terms';

function realityCheckSummary(settings: ReturnType<typeof useRealityCheckSettings>['settings']) {
  if (!settings || !settings.enabled) return 'Off';
  const start = new Date();
  start.setHours(Math.floor(settings.active_start_minutes / 60), settings.active_start_minutes % 60);
  const end = new Date();
  end.setHours(Math.floor(settings.active_end_minutes / 60), settings.active_end_minutes % 60);
  return `Every ${formatDuration(settings.frequency_minutes)} · ${formatTime(start)} to ${formatTime(end)}`;
}

function SettingsRow({
  icon: Icon,
  label,
  caption,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  caption?: string;
  onPress?: () => void;
}) {
  return (
    <AnimatedPressable onPress={onPress}>
      <Card style={styles.rowCard}>
        <View style={styles.rowLeft}>
          <Icon color={colors.accent.primary} size={20} strokeWidth={1.5} />
          <View>
            <Text style={[typography.bodyMedium, styles.email]}>{label}</Text>
            {caption ? <Text style={[typography.label, styles.label]}>{caption}</Text> : null}
          </View>
        </View>
        <ChevronRight color={colors.text.tertiary} size={20} strokeWidth={1.5} />
      </Card>
    </AnimatedPressable>
  );
}

export function ProfileScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const navigation = useNavigation();
  const { settings } = useRealityCheckSettings();
  const { profile } = useProfile();
  const { dreams } = useDreams();

  const lucidDreams = dreams.filter((dream) => dream.is_lucid).length;

  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  // Stub — no RevenueCat entitlements exist yet (see PAYWALL_TODO.md), so there is
  // truly nothing to restore pre-launch. Wire this to the real restore call once
  // the paywall/RevenueCat integration lands.
  const handleRestorePurchases = () => setRestoreMessage('Nothing to restore');

  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openDeleteModal = () => {
    setDeleteError(null);
    setDeleteStep(1);
  };
  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteStep(0);
  };
  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    const { error } = await deleteAccount();
    setDeleting(false);
    // On success, deleteAccount() already signed out — RootNavigator reacts to the
    // cleared session and swaps to Welcome on its own, same as the plain Sign out
    // button below. On failure, stay put and show the error (never navigate away).
    if (error) setDeleteError(error);
  };

  return (
    <ScreenContainer edges={['top']} edgeToEdge>
      <NightSky intensity="subtle" edgeFade>
        <Arrive style={styles.header}>
          <Text style={[typography.heroTitle, styles.title]}>You</Text>
        </Arrive>

        <View style={styles.heroBlock}>
          <Arrive delay={40}>
            <Card style={styles.card}>
              <Text style={[typography.label, styles.label]}>Signed in as</Text>
              <Text style={[typography.bodyMedium, styles.email]}>{user?.email}</Text>
            </Card>
          </Arrive>

          <Arrive delay={80} style={styles.statsRow}>
            <StatPill icon={Moon} value={dreams.length} label="Dreams logged" tint={colors.text.secondary} />
            <StatPill icon={Flame} value={profile?.current_streak ?? 0} label="Day streak" tint={colors.accent.primary} />
            <StatPill icon={Moon} value={lucidDreams} label="Lucid" tint={colors.text.secondary} />
          </Arrive>
        </View>
      </NightSky>

      <Panel>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Arrive delay={120}>
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

          <Arrive delay={160}>
            <SettingsRow icon={Bell} label="Notifications" caption="Coming soon" />
          </Arrive>

          <Arrive delay={200}>
            <SettingsRow icon={AlarmClock} label="WBTB defaults" caption="Coming soon" />
          </Arrive>

          <Arrive delay={240}>
            <SettingsRow icon={Crown} label="Subscription" caption="Coming soon" />
          </Arrive>

          <Arrive delay={260}>
            <SettingsRow
              icon={RotateCcw}
              label="Restore purchases"
              caption={restoreMessage ?? undefined}
              onPress={handleRestorePurchases}
            />
          </Arrive>

          <Arrive delay={300} style={styles.legalGroup}>
            <SettingsRow
              icon={Shield}
              label="Privacy Policy"
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            />
          </Arrive>

          <Arrive delay={320}>
            <SettingsRow
              icon={FileText}
              label="Terms of Service"
              onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
            />
          </Arrive>

          <Arrive delay={360}>
            <AnimatedPressable style={styles.signOutRow} onPress={openDeleteModal}>
              <Trash color={colors.status.danger} size={18} strokeWidth={1.5} />
              <Text style={[typography.bodyMedium, styles.deleteText]}>Delete account</Text>
            </AnimatedPressable>
          </Arrive>

          <Arrive delay={380}>
            <AnimatedPressable style={styles.signOutRow} onPress={signOut}>
              <LogOut color="#F87171" size={18} strokeWidth={1.5} />
              <Text style={[typography.bodyMedium, styles.signOutText]}>Sign out</Text>
            </AnimatedPressable>
          </Arrive>
        </ScrollView>
      </Panel>

      <DeleteAccountModal
        step={deleteStep}
        deleting={deleting}
        error={deleteError}
        onCancel={closeDeleteModal}
        onContinue={() => setDeleteStep(2)}
        onConfirmDelete={handleConfirmDelete}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.tabBarClearance,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  heroBlock: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
  },
  title: {
    color: colors.text.primary,
  },
  card: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  // Extra top margin (on top of rowCard's own marginBottom) is the only thing that
  // separates this pair from the settings rows above — no new box/divider, per the
  // no-new-card-shapes constraint.
  legalGroup: {
    marginTop: spacing.sm,
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
  deleteText: {
    color: colors.status.danger,
  },
});
