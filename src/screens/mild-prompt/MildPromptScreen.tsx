import { useNavigation } from '@react-navigation/native';
import { Check, Moon, X } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Breathing } from '../../components/Breathing';
import { Button } from '../../components/Button';
import { CrossFade } from '../../components/CrossFade';
import { EmptyState } from '../../components/EmptyState';
import { LoadingView } from '../../components/LoadingView';
import { NightSky } from '../../components/NightSky';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { useMildMantra } from '../../hooks/useMildMantra';
import { useProfile } from '../../hooks/useProfile';
import { isMildIntentionSetTonight, markMildIntentionSet } from '../../lib/tonightRoutine';
import { colors, spacing, typography } from '../../theme';

// A standalone, lightweight bedtime touchpoint — one screen, not a guided session.
// Reached by tapping the nightly MILD-prompt notification (useMildPromptNotificationRouting)
// or the "Set intention" row in Tonight's Routine (TonightRoutineCard) while it's pending.
export function MildPromptScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, refresh } = useProfile();
  const { mantra, isLoading: mantraLoading } = useMildMantra();
  const [saving, setSaving] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const alreadyDone = justCompleted || isMildIntentionSetTonight(profile?.mild_intention_set_at ?? null);

  const handleConfirm = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await markMildIntentionSet(user.id);
      setJustCompleted(true);
      refresh();
    } catch {
      // Best-effort — the user still read their intention tonight either way, and
      // Tonight's Routine will just show this step pending until it succeeds on retry.
    } finally {
      setSaving(false);
    }
  };

  const stateKey = profileLoading ? 'loading' : alreadyDone ? 'done' : mantraLoading ? 'generating' : 'ready';

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <NightSky intensity="subtle" style={styles.sky}>
        <View style={styles.header}>
          <Text style={[typography.label, styles.eyebrow]}>Tonight</Text>
          <AnimatedPressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X color={colors.text.secondary} size={24} strokeWidth={1.5} />
          </AnimatedPressable>
        </View>

        <CrossFade contentKey={stateKey} style={styles.center}>
          {stateKey === 'loading' || stateKey === 'generating' ? (
            <LoadingView label={stateKey === 'loading' ? 'Checking tonight' : "Writing tonight's mantra"} />
          ) : stateKey === 'done' ? (
            <EmptyState
              icon={Check}
              tint={colors.status.lucid}
              title="Intention set for tonight"
              message="Sleep well. A fresh prompt will be ready tomorrow night."
            />
          ) : (
            <Arrive style={styles.promptBody}>
              <View style={styles.mantraIconWrap}>
                <Moon color={colors.accent.primary} size={20} strokeWidth={1.75} />
              </View>
              <Breathing minOpacity={0.7} maxOpacity={1} durationMs={5000}>
                <Text style={[typography.subheading, styles.mantra]}>{mantra}</Text>
              </Breathing>
              <Button label="Set my intention" onPress={handleConfirm} loading={saving} style={styles.confirmButton} />
            </Arrive>
          )}
        </CrossFade>
      </NightSky>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sky: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  promptBody: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  mantraIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mantra: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  confirmButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
});
