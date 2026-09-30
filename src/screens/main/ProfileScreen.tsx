import { useNavigation } from '@react-navigation/native';
import {
  AlarmClock,
  Bell,
  ChevronRight,
  Crown,
  Download,
  Eye,
  FileText,
  Flame,
  LogOut,
  LucideIcon,
  Moon,
  Plus,
  RotateCcw,
  Shield,
  Trash,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Avatar } from '../../components/Avatar';
import { Card } from '../../components/Card';
import { DeleteAccountModal } from '../../components/DeleteAccountModal';
import { NightSky } from '../../components/NightSky';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SkeletonLines } from '../../components/SkeletonLines';
import { StatPill } from '../../components/StatPill';
import { useAuth } from '../../hooks/useAuth';
import { useDreamProfile } from '../../hooks/useDreamProfile';
import { useDreams } from '../../hooks/useDreams';
import { useNotificationSettings } from '../../hooks/useNotificationSettings';
import { useProfile } from '../../hooks/useProfile';
import { useRealityCheckSettings } from '../../hooks/useRealityCheckSettings';
import { useSubscription } from '../../hooks/useSubscription';
import { useWbtbDefaults } from '../../hooks/useWbtbDefaults';
import { pickAvatarImage, uploadAvatar } from '../../lib/avatar';
import { track } from '../../lib/analytics';
import { exportAndDeliverData } from '../../lib/dataExport';
import { purchasesSupported } from '../../lib/purchases';
import {
  DEFAULT_WAKE_WINDOW_MINUTES,
  formatDuration,
  formatTime,
  WBTB_DEFAULTS_SLEEP_MINUTES,
} from '../../lib/wbtb';
import { colors, spacing, typography } from '../../theme';

function realityCheckSummary(settings: ReturnType<typeof useRealityCheckSettings>['settings']) {
  if (!settings || !settings.enabled) return 'Off';
  const start = new Date();
  start.setHours(Math.floor(settings.active_start_minutes / 60), settings.active_start_minutes % 60);
  const end = new Date();
  end.setHours(Math.floor(settings.active_end_minutes / 60), settings.active_end_minutes % 60);
  return `Every ${formatDuration(settings.frequency_minutes)} · ${formatTime(start)} to ${formatTime(end)}`;
}

function notificationsSummary(
  notificationSettings: ReturnType<typeof useNotificationSettings>['settings'],
  realityCheckEnabled: boolean
) {
  const mildOn = notificationSettings?.mild_prompt_enabled ?? true;
  const alarmOn = notificationSettings?.wbtb_alarm_enabled ?? true;
  const onCount = [mildOn, realityCheckEnabled, alarmOn].filter(Boolean).length;
  if (onCount === 3) return 'All on';
  if (onCount === 0) return 'All off';
  return `${onCount} of 3 on`;
}

function wbtbDefaultsSummary(defaults: ReturnType<typeof useWbtbDefaults>['defaults']) {
  const sleepMinutes = defaults?.sleep_duration_minutes ?? WBTB_DEFAULTS_SLEEP_MINUTES;
  const wakeWindowMinutes = defaults?.wake_window_minutes ?? DEFAULT_WAKE_WINDOW_MINUTES;
  return `${formatDuration(sleepMinutes)} sleep · ${wakeWindowMinutes} min window`;
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
  const { settings: notificationSettings } = useNotificationSettings();
  const { defaults: wbtbDefaults } = useWbtbDefaults();
  const { profile, refresh: refreshProfile } = useProfile();
  const { dreams, isLoading: dreamsLoading } = useDreams();
  const dreamProfile = useDreamProfile(dreams.length, dreamsLoading);
  // Once the card actually has text on screen (not while loading, not when it failed).
  const dreamProfileShown = !dreamProfile.isLoading && !dreamProfile.error;
  useEffect(() => {
    if (dreamProfileShown) track('dream_profile_viewed');
  }, [dreamProfileShown]);
  const { isPro, isLoading: subscriptionLoading, openPaywall, openCustomerCenter, restore } =
    useSubscription();

  const lucidDreams = dreams.filter((dream) => dream.is_lucid).length;

  const subscriptionCaption = !purchasesSupported
    ? 'iOS & Android only'
    : subscriptionLoading
      ? undefined
      : isPro
        ? 'Pro'
        : 'Free';
  // Already subscribed: open the native self-service UI to manage or cancel.
  // Not subscribed: open the paywall to upgrade.
  const handleSubscriptionPress = () => (isPro ? openCustomerCenter() : openPaywall());

  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const handleRestorePurchases = async () => {
    setRestoring(true);
    const { error } = await restore();
    setRestoring(false);
    setRestoreMessage(error ?? 'Restored');
  };

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const handleAvatarPress = async () => {
    if (!user) return;
    setAvatarError(null);
    const picked = await pickAvatarImage();
    if (picked.cancelled) return;
    setAvatarUploading(true);
    try {
      await uploadAvatar(user.id, picked.uri, picked.mimeType);
      await refreshProfile();
    } catch (e) {
      setAvatarError((e as Error).message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const handleExportData = async () => {
    if (!user) return;
    setExportError(null);
    setExporting(true);
    try {
      await exportAndDeliverData(user.id);
    } catch (e) {
      setExportError((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <NightSky intensity="subtle" style={styles.sky}>
          <Arrive style={styles.header}>
            <Text style={[typography.heroTitle, styles.title]}>You</Text>
          </Arrive>

          <View style={styles.heroBlock}>
            <Arrive delay={40}>
              <Card style={styles.card}>
                <View style={styles.identityRow}>
                  <AnimatedPressable
                    onPress={handleAvatarPress}
                    accessibilityRole="button"
                    accessibilityLabel="Change profile picture"
                  >
                    <View>
                      <Avatar
                        url={profile?.avatar_url ?? null}
                        label={profile?.display_name || user?.email || ''}
                        size={64}
                      />
                      {avatarUploading ? (
                        <View style={styles.avatarOverlay}>
                          <ActivityIndicator color={colors.text.primary} size="small" />
                        </View>
                      ) : (
                        <View style={styles.avatarBadge}>
                          <Plus color={colors.text.onAccent} size={14} strokeWidth={2.5} />
                        </View>
                      )}
                    </View>
                  </AnimatedPressable>
                  <View style={styles.identityCopy}>
                    <Text style={[typography.label, styles.label]}>Signed in as</Text>
                    <Text style={[typography.bodyMedium, styles.email]}>{user?.email}</Text>
                  </View>
                </View>
                {avatarError ? (
                  <Text style={[typography.label, styles.avatarError]}>{avatarError}</Text>
                ) : null}
              </Card>
            </Arrive>

            <Arrive delay={80} style={styles.statsRow}>
              <StatPill icon={Moon} value={dreams.length} label="Dreams logged" tint={colors.text.secondary} />
              <StatPill icon={Flame} value={profile?.current_streak ?? 0} label="Day streak" tint={colors.accent.primary} />
              <StatPill icon={Moon} value={lucidDreams} label="Lucid" tint={colors.text.secondary} />
            </Arrive>

            {/* No label on purpose: the text is the card. Left out entirely if the request
                fails, since the "keep logging" fallback would be wrong for a full journal. */}
            {dreamProfile.error ? null : (
              <Arrive delay={100}>
                <Card style={styles.card}>
                  {dreamProfile.isLoading ? (
                    <SkeletonLines lines={2} accessibilityLabel="Loading your dream profile" />
                  ) : (
                    <Text style={[typography.body, styles.email]}>{dreamProfile.content}</Text>
                  )}
                </Card>
              </Arrive>
            )}
          </View>

          <View style={styles.settingsGroup}>
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
              <SettingsRow
                icon={Bell}
                label="Notifications"
                caption={notificationsSummary(notificationSettings, settings?.enabled ?? true)}
                onPress={() => navigation.navigate('NotificationSettings')}
              />
            </Arrive>

            <Arrive delay={200}>
              <SettingsRow
                icon={AlarmClock}
                label="WBTB defaults"
                caption={wbtbDefaultsSummary(wbtbDefaults)}
                onPress={() => navigation.navigate('WbtbDefaults')}
              />
            </Arrive>

            <Arrive delay={240}>
              <SettingsRow
                icon={Crown}
                label="Subscription"
                caption={subscriptionCaption}
                onPress={purchasesSupported ? handleSubscriptionPress : undefined}
              />
            </Arrive>

            <Arrive delay={260}>
              <SettingsRow
                icon={RotateCcw}
                label="Restore purchases"
                caption={restoring ? 'Restoring…' : (restoreMessage ?? undefined)}
                onPress={purchasesSupported ? handleRestorePurchases : undefined}
              />
            </Arrive>

            <Arrive delay={300} style={styles.legalGroup}>
              <SettingsRow
                icon={Shield}
                label="Privacy Policy"
                onPress={() => navigation.navigate('LegalDocument', { doc: 'privacy' })}
              />
            </Arrive>

            <Arrive delay={320}>
              <SettingsRow
                icon={FileText}
                label="Terms of Service"
                onPress={() => navigation.navigate('LegalDocument', { doc: 'terms' })}
              />
            </Arrive>

            <Arrive delay={340} style={styles.legalGroup}>
              <SettingsRow
                icon={Download}
                label="Export my data"
                caption={exporting ? 'Preparing export…' : (exportError ?? undefined)}
                onPress={exporting ? undefined : handleExportData}
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
          </View>
        </NightSky>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  sky: {
    flex: 1,
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
  settingsGroup: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.tabBarClearance,
  },
  title: {
    color: colors.text.primary,
  },
  card: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  identityCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    backgroundColor: 'rgba(10, 13, 24, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A visible affordance that the avatar is tappable — no border, per DESIGN.md; the
  // accent fill alone (same as a primary Button) reads as the actionable spot.
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarError: {
    color: colors.status.danger,
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
