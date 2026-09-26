import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Arrive } from './Arrive';
import { Button } from './Button';
import { CrossFade } from './CrossFade';
import { colors, radius, spacing, typography } from '../theme';

type DeleteAccountModalProps = {
  // 0 = hidden. 1/2 pick which step's copy + buttons CrossFade shows.
  step: 0 | 1 | 2;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onContinue: () => void;
  onConfirmDelete: () => void;
};

// Same structural shape as PrePermissionModal (Modal + backdrop-press-to-dismiss +
// Arrive card, radius.sheet) but with two steps and a Cancel/Confirm row instead of
// one CTA — the app's only destructive, irreversible action, so it gets an extra
// step permission-asks don't need.
export function DeleteAccountModal({
  step,
  deleting,
  error,
  onCancel,
  onContinue,
  onConfirmDelete,
}: DeleteAccountModalProps) {
  return (
    <Modal visible={step !== 0} transparent animationType="none" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={deleting ? undefined : onCancel} />
        <Arrive style={styles.card}>
          <CrossFade contentKey={step}>
            {step === 2 ? (
              <>
                <Text style={[typography.displayMd, styles.headline]}>Delete everything?</Text>
                <Text style={[typography.body, styles.body]}>
                  This will permanently delete your account and all your dreams. This cannot be
                  undone.
                </Text>
              </>
            ) : (
              <>
                <Text style={[typography.displayMd, styles.headline]}>Are you sure?</Text>
                <Text style={[typography.body, styles.body]}>
                  You&apos;re about to start deleting your Nocturnal account.
                </Text>
              </>
            )}
          </CrossFade>
          {error ? <Text style={[typography.label, styles.error]}>{error}</Text> : null}
          <View style={styles.actionsRow}>
            <Button
              label="Cancel"
              variant="secondary"
              onPress={onCancel}
              disabled={deleting}
              style={styles.flex}
            />
            <Button
              label={step === 2 ? 'Delete account' : 'Continue'}
              onPress={step === 2 ? onConfirmDelete : onContinue}
              loading={deleting}
              style={[styles.flex, styles.dangerButton]}
            />
          </View>
        </Arrive>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 12, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 360,
    gap: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.sheet,
    padding: spacing.xl,
  },
  headline: {
    color: colors.text.primary,
  },
  body: {
    color: colors.text.secondary,
  },
  error: {
    color: colors.status.danger,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  dangerButton: {
    backgroundColor: colors.status.danger,
  },
});
