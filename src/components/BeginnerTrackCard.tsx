import { useNavigation } from '@react-navigation/native';
import { GraduationCap } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { LoadingView } from './LoadingView';
import { useBeginnerTrack } from '../hooks/useBeginnerTrack';
import { getTrackDay, TRACK_LENGTH } from '../lib/beginnerTrack';
import { colors, radius, spacing, typography } from '../theme';

function Eyebrow({ label }: { label: string }) {
  return (
    <View style={styles.eyebrowRow}>
      <GraduationCap color={colors.accent.primary} size={18} strokeWidth={1.5} />
      <Text style={[typography.label, styles.eyebrow]}>{label}</Text>
    </View>
  );
}

export function BeginnerTrackCard() {
  const navigation = useNavigation();
  const { startedAt, currentDay, completedDays, isLoading } = useBeginnerTrack();

  if (isLoading) {
    return (
      <Card style={styles.loadingCard}>
        <LoadingView label="Checking your progress" />
      </Card>
    );
  }

  const open = () => navigation.navigate('BeginnerTrack');

  if (!startedAt) {
    return (
      <Card style={styles.card}>
        <Eyebrow label="30-Day Track" />
        <View style={styles.copy}>
          <Text style={[typography.heading, styles.title]}>30 days to your first lucid dream</Text>
          <Text style={[typography.body, styles.body]}>
            A guided daily program — reality checks, journaling, Wake Back to Bed, then MILD.
          </Text>
        </View>
        <Button label="Start the track" onPress={open} />
      </Card>
    );
  }

  if (completedDays.size >= TRACK_LENGTH) {
    return (
      <Card style={styles.card}>
        <Eyebrow label="30-Day Track" />
        <Text style={[typography.heading, styles.title]}>You completed the track</Text>
        <Button label="Review" variant="secondary" onPress={open} />
      </Card>
    );
  }

  const task = currentDay ? getTrackDay(currentDay) : null;
  const progress = completedDays.size / TRACK_LENGTH;

  return (
    <Card style={styles.card}>
      <Eyebrow label={`Day ${currentDay} of ${TRACK_LENGTH}`} />
      <Text style={[typography.heading, styles.title]}>{task?.title}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Button label="Continue" onPress={open} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  loadingCard: {
    height: 164,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copy: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text.primary,
  },
  body: {
    color: colors.text.secondary,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.card,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primary,
  },
});
