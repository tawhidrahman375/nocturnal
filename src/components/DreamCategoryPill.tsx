import { Eye } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { DREAM_CATEGORY_LABELS, DreamCategory } from '../lib/dreamCategories';
import { colors, radius, spacing, typography } from '../theme';

type DreamCategoryPillProps = {
  category: DreamCategory;
};

// One small pill per dream card. Most categories are a quiet tinted tag; two are meant
// to be noticed: sleep paralysis is a solid crimson warning tag with bold white text and
// an eye, and astral projection carries a soft violet glow (a single static boxShadow,
// no animation).
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
        isAstral && { boxShadow: `0 0 10px ${colors.dreamCategory.astralGlow}` },
      ]}
    >
      {isSleepParalysis ? <Eye color={palette.text} size={12} strokeWidth={2.25} /> : null}
      <Text style={[typography.caption, { color: palette.text }, isSleepParalysis && styles.boldText]}>
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
  boldText: {
    fontWeight: '700',
  },
});
