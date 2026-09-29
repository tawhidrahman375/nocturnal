import { Eye } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { DREAM_CATEGORY_LABELS, DreamCategory } from '../lib/dreamCategories';
import { colors, radius, spacing, typography } from '../theme';

type DreamCategoryPillProps = {
  category: DreamCategory;
};

// One small pill per dream card. Most categories are a tinted tag; two are meant to be
// noticed: sleep paralysis is the loudest thing on the card (a larger solid red tag, all
// caps, bold white text, an eye, and a red glow), and astral projection carries a soft
// violet glow. Both glows are a single static boxShadow, no animation.
export function DreamCategoryPill({ category }: DreamCategoryPillProps) {
  const palette = colors.dreamCategory[category];
  const isSleepParalysis = category === 'sleep paralysis';
  const isAstral = category === 'astral projection';

  return (
    <View
      accessibilityLabel={`Category: ${DREAM_CATEGORY_LABELS[category]}`}
      style={[
        styles.pill,
        { backgroundColor: palette.fill },
        isSleepParalysis && styles.alertPill,
        isSleepParalysis && { boxShadow: `0 0 14px ${colors.dreamCategory.sleepParalysisGlow}` },
        isAstral && { boxShadow: `0 0 10px ${colors.dreamCategory.astralGlow}` },
      ]}
    >
      {isSleepParalysis ? <Eye color={palette.text} size={15} strokeWidth={2.5} /> : null}
      <Text
        style={[
          isSleepParalysis ? typography.label : typography.caption,
          { color: palette.text },
          isSleepParalysis && styles.alertText,
        ]}
      >
        {DREAM_CATEGORY_LABELS[category]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  alertPill: {
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs,
    // Keeps the glow from touching the row above and below.
    marginVertical: 2,
  },
  alertText: {
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
