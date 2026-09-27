import { useNavigation } from '@react-navigation/native';
import { GraduationCap } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { LoadingView } from './LoadingView';
import { ProgressBar } from './ProgressBar';
import { useBeginnerTrack } from '../hooks/useBeginnerTrack';
import { getTrackDay, TRACK_LENGTH } from '../lib/beginnerTrack';
import { colors, spacing, typography } from '../theme';

function Eyebrow({ label }: { label: string }) {
  return (
    <View style={styles.eyebrowRow}>
      <GraduationCap color={colors.accent.secondary} size={16} strokeWidth={1.75} />
      <Text style={[typography.label, styles.eyebrow]}>{label}</Text>
    </View>
  );
}

export function BeginnerTrackCard() {
  const navigation = useNavigation();
  const { startedAt, currentDay, completedDays, isLoading } = useBeginnerTrack();

  if (isLoading) {
    return (
      <View style={styles.loadingCard}>
        <LoadingView label="Checking your progress" />
      </View>
    );
  }

  const open = () => navigation.navigate('BeginnerTrack');

  if (!startedAt) {
    return (
      <View style={styles.card}>
        <Eyebrow label="30-Day Track" />
        <View style={styles.copy}>
          <Text style={[typography.heading, styles.title]}>30 days to your first lucid dream</Text>
          <Text style={[typography.body, styles.body]}>One new habit each night.</Text>
        </View>
        <Button label="Start the track" onPress={open} />
        <View style={styles.bottomBar} />
      </View>
    );
  }

  if (completedDays.size >= TRACK_LENGTH) {
    return (
      <View style={styles.card}>
        <Eyebrow label="30-Day Track" />
        <Text style={[typography.heading, styles.title]}>You completed the track</Text>
        <Button label="Review" variant="secondary" onPress={open} />
        <View style={styles.bottomBar} />
      </View>
    );
  }

  const task = currentDay ? getTrackDay(currentDay) : null;
  const progress = completedDays.size / TRACK_LENGTH;

  return (
    <View style={styles.card}>
      <Eyebrow label={`Day ${currentDay} of ${TRACK_LENGTH}`} />
      <Text style={[typography.heading, styles.title]}>{task?.title}</Text>
      <ProgressBar progress={progress} color={colors.accent.secondary} trackColor={colors.background.primary} />
      <Button label="Continue" onPress={open} />
      <View style={styles.bottomBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.cardPadding,
  },
  loadingCard: {
    height: 164,
    padding: spacing.cardPadding,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 1.5,
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
  // Full-bleed signature line at the card's floor — negative margins cancel the card's
  // own padding so it reaches edge to edge, `overflow: hidden` on the card clips it.
  bottomBar: {
    height: 2,
    backgroundColor: '#2A3A5C',
    marginTop: spacing.md,
    marginHorizontal: -spacing.cardPadding,
    marginBottom: -spacing.cardPadding,
  },
});
