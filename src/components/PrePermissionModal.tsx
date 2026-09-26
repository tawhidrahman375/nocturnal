import { LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Arrive } from './Arrive';
import { Button } from './Button';
import { colors, radius, spacing, typography } from '../theme';

type PrePermissionModalProps = {
  visible: boolean;
  icon: LucideIcon;
  headline: string;
  body: string;
  ctaLabel: string;
  onAllow: () => void;
  onDismiss: () => void;
};

// A custom explanation overlay shown once, before the OS permission prompt, so the
// ask has context instead of arriving cold. Tapping outside the card or the Android
// back button dismisses without touching the real permission request.
export function PrePermissionModal({
  visible,
  icon: Icon,
  headline,
  body,
  ctaLabel,
  onAllow,
  onDismiss,
}: PrePermissionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        {/* A sibling full-bleed layer, not a wrapper around the card, so a tap on the
            card can never also reach this press handler through event propagation
            (nested Pressables don't reliably stop that on every platform). */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <Arrive style={styles.card}>
          <View style={styles.iconHalo}>
            <Icon color={colors.accent.primary} size={32} strokeWidth={1.5} />
          </View>
          <Text style={[typography.displayMd, styles.headline]}>{headline}</Text>
          <Text style={[typography.body, styles.body]}>{body}</Text>
          <Button label={ctaLabel} onPress={onAllow} style={styles.cta} />
          <Text style={[typography.label, styles.footnote]}>
            You can change this anytime in Settings
          </Text>
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
    // An absolutely positioned sibling (the dismiss Pressable) paints above normal-flow
    // content by default regardless of DOM order, so this needs an explicit stacking
    // position and a higher zIndex or every tap on the card would hit the backdrop.
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.sheet,
    padding: spacing.xl,
  },
  iconHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent.primaryMuted,
    borderWidth: 1,
    borderColor: colors.accent.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  headline: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  body: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  footnote: {
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
