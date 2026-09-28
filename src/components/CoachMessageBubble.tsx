import { Moon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { CoachMessage } from '../lib/coachChat';
import { colors, radius, spacing, typography } from '../theme';

// User right, coach left, with a small moon avatar on the coach's side — DESIGN.md's
// "no borders" rule applies here too, so both bubbles are flat color fills.
export function CoachMessageBubble({ message }: { message: CoachMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={[styles.row, styles.rowUser]}>
        <View style={[styles.bubble, styles.bubbleUser]}>
          <Text style={[typography.body, styles.textUser]}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.rowCoach]}>
      <View style={styles.avatar}>
        <Moon color={colors.accent.primary} size={14} strokeWidth={1.75} />
      </View>
      <View style={[styles.bubble, styles.bubbleCoach]}>
        <Text style={[typography.body, styles.textCoach]}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowCoach: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
  },
  bubbleUser: {
    backgroundColor: colors.accent.primary,
  },
  bubbleCoach: {
    backgroundColor: colors.surface.cardElevated,
  },
  textUser: {
    color: colors.text.onAccent,
  },
  textCoach: {
    color: colors.text.primary,
  },
});
