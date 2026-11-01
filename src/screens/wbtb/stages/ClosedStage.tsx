import { StackActions, useNavigation } from '@react-navigation/native';
import { AlarmClockOff } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Breathing } from '../../../components/Breathing';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { TECHNIQUE_CLOSING_LINES, WbtbSession, WbtbStatus, WbtbTechnique } from '../../../lib/wbtb';
import { colors, spacing, typography } from '../../../theme';

// A session that did not happen is not a failure, and the screen says so. Each one points at
// the same two ways forward: try again tonight, or log whatever you do remember.
const ENDED_MESSAGES: Partial<Record<WbtbStatus, string>> = {
  skipped: 'You skipped this one, and that is fine. If you woke with a dream, log it anyway. It counts.',
  missed:
    'Sleeping through the alarm happens to everyone. If you woke up naturally with a dream, log it anyway. Tonight is a fresh chance.',
  cancelled: 'This alarm was cancelled. Plan another whenever you are ready.',
};

type ClosedStageProps = {
  session: WbtbSession;
  onClose: () => void;
};

export function ClosedStage({ session, onClose }: ClosedStageProps) {
  const navigation = useNavigation();

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
        <Button
          label="Plan tonight's alarm"
          onPress={() => navigation.dispatch(StackActions.replace('WbtbSetup'))}
          style={styles.action}
        />
        <Button label="Back to home" variant="ghost" onPress={onClose} style={styles.action} />
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
        <Text style={[typography.footnote, styles.nextStep]}>
          When you wake, stay still and write down whatever you remember before anything else.
        </Text>
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
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  sleepTitle: {
    color: colors.text.tertiary,
  },
  mantra: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  nextStep: {
    color: colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 260,
  },
  closeLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  closeText: {
    color: colors.text.tertiary,
  },
});
