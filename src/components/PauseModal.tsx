import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { PAUSE_OPTIONS_DAYS } from '../lib/pause';
import { colors, radius, spacing, typography } from '../theme';

type PauseModalProps = {
  visible: boolean;
  // The end date of the running pause, formatted for display, or null when none is running.
  activeUntil: string | null;
  busy: boolean;
  onPause: (days: number) => void;
  onResume: () => void;
  onClose: () => void;
};

// Vacation mode. Framed as rest, not as an exception: nothing is lost by taking it.
export function PauseModal({ visible, activeUntil, busy, onPause, onResume, onClose }: PauseModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <Text style={[typography.heading, styles.title]}>
            {activeUntil ? 'You are on a break' : 'Take a break'}
          </Text>
          <Text style={[typography.body, styles.body]}>
            {activeUntil
              ? `Reminders are off and your streak is safe until ${activeUntil}. Pick up whenever you like.`
              : 'Travelling, ill, or just tired? Pause for a few days. Reminders go quiet and your streak waits for you.'}
          </Text>

          {activeUntil ? (
            <Button label="Resume now" onPress={onResume} loading={busy} style={styles.fullWidth} />
          ) : (
            <View style={styles.options}>
              {PAUSE_OPTIONS_DAYS.map((days) => (
                <Button
                  key={days}
                  label={`${days} days`}
                  variant="secondary"
                  onPress={() => onPause(days)}
                  disabled={busy}
                  style={styles.option}
                />
              ))}
            </View>
          )}
          <Button label="Close" variant="ghost" onPress={onClose} style={styles.fullWidth} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 12, 0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.sheet,
    backgroundColor: colors.surface.cardElevated,
  },
  title: {
    color: colors.text.primary,
  },
  body: {
    color: colors.text.secondary,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
});
