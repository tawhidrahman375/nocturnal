import { AlarmClockOff } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Breathing } from '../../../components/Breathing';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { TECHNIQUE_CLOSING_LINES, WbtbSession, WbtbStatus, WbtbTechnique } from '../../../lib/wbtb';
import { colors, spacing, typography } from '../../../theme';

const ENDED_MESSAGES: Partial<Record<WbtbStatus, string>> = {
  skipped: 'You skipped this session. Plan another whenever you are ready.',
  missed: 'The alarm passed without a session. Tonight is a fresh chance.',
  cancelled: 'This alarm was cancelled.',
};

type ClosedStageProps = {
  session: WbtbSession;
  onClose: () => void;
};

export function ClosedStage({ session, onClose }: ClosedStageProps) {
  if (session.status !== 'completed') {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <EmptyState
            icon={AlarmClockOff}
            title="This session has ended"
            message={ENDED_MESSAGES[session.status as WbtbStatus] ?? ''}
          />
        </View>
        <Button label="Back to home" variant="secondary" onPress={onClose} style={styles.action} />
      </View>
    );
  }

  // Deliberately dim: the user is drifting off and the screen may stay on.
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={[typography.heading, styles.sleepTitle]}>Sleep well</Text>
        <Breathing minOpacity={0.2} maxOpacity={0.6} durationMs={6000}>
          <Text style={[typography.subheading, styles.mantra]}>
            {TECHNIQUE_CLOSING_LINES[session.technique as WbtbTechnique]}
          </Text>
        </Breathing>
      </View>
      <Pressable onPress={onClose} hitSlop={12} style={styles.closeLink} accessibilityRole="button">
        <Text style={[typography.label, styles.closeText]}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  action: {
    marginTop: spacing.md,
  },
  sleepTitle: {
    color: colors.text.tertiary,
  },
  mantra: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  closeLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  closeText: {
    color: colors.text.tertiary,
  },
});
