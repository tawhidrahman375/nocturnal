import { Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useDreams } from '../../hooks/useDreams';
import { colors, spacing, typography } from '../../theme';

export function InsightsScreen() {
  const { dreams } = useDreams();
  const lucidCount = dreams.filter((d) => d.is_lucid).length;

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.displayMd, styles.title]}>Insights</Text>
      </View>

      {dreams.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Not enough data yet"
          message="Log a few dreams and patterns in your lucidity will show up here."
        />
      ) : (
        <View style={styles.body}>
          <Text style={[typography.body, styles.text]}>
            {lucidCount} of {dreams.length} logged dreams were lucid.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
  },
  body: {
    paddingTop: spacing.lg,
  },
  text: {
    color: colors.text.secondary,
  },
});
