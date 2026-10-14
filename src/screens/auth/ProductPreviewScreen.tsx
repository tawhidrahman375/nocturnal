import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Moon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { GlassBackButton } from '../../components/GlassBackButton';
import { NightSky } from '../../components/NightSky';
import { AuthStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Preview'>;

type ExampleDream = {
  title: string;
  content: string;
  date: string;
  lucid: boolean;
};

// Written to feel like real entries, not lorem-ipsum placeholders, so the preview
// actually demonstrates the journal's value before the signup wall.
const EXAMPLE_DREAMS: ExampleDream[] = [
  {
    title: 'Flying over the coastline',
    content:
      'Realized mid-fall that I was dreaming, so I just... stopped falling and flew instead. The ocean stretched out gold and endless.',
    date: 'Thursday',
    lucid: true,
  },
  {
    title: 'The house with extra rooms',
    content:
      "Found a hallway I'd never noticed before. Every door opened into a different hotel room, and I kept looking for mine.",
    date: 'Tuesday',
    lucid: false,
  },
  {
    title: 'Missed the last train home',
    content:
      'Ran through the station for what felt like an hour. The departure board kept changing the platform number.',
    date: 'Last week',
    lucid: false,
  },
];

export function ProductPreviewScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <NightSky intensity="full" style={styles.sky}>
        <View style={[styles.content, { paddingTop: insets.top }]}>
          {/* A little empty sky for atmosphere; it gives way first on a short screen. */}
          <View style={styles.skySpace} />

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Arrive>
              <Text style={[typography.heroTitle, styles.headline]}>Your dream life, finally organised.</Text>
              <Text style={[typography.body, styles.subheadline]}>Join free. Cancel any time.</Text>

              <View style={styles.cards}>
                {EXAMPLE_DREAMS.map((dream) => (
                  <ExampleDreamCard key={dream.title} dream={dream} />
                ))}
              </View>
            </Arrive>
          </ScrollView>

          {/* Whatever height is left over sits here, between the cards and the pinned actions. */}
          <View style={styles.flexSpacer} />

          <Arrive delay={140} style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
            <Button
              label="Create free account"
              labelColor={colors.text.primary}
              onPress={() => navigation.navigate('SignUp')}
              style={styles.cta}
            />
            <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.footer}>
              <Text style={[typography.body, styles.footerText]}>
                Already have an account? <Text style={styles.footerLink}>Sign in</Text>
              </Text>
            </Pressable>
          </Arrive>
        </View>

        {/* design.md section 3g: back is a glass pill in the top left, below the status bar. */}
        <View style={[styles.backButton, { top: insets.top + spacing.sm }]}>
          <GlassBackButton onPress={() => navigation.goBack()} accessibilityLabel="Back to welcome" />
        </View>
      </NightSky>
    </View>
  );
}

// Mirrors the real journal rows so the preview is an honest look at the feature. Plain
// translucent glass: no border, no shadow, no press handling (it is an example).
function ExampleDreamCard({ dream }: { dream: ExampleDream }) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Moon color={colors.text.secondary} size={18} strokeWidth={1.5} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={[typography.bodyMedium, styles.dreamTitle]} numberOfLines={1}>
            {dream.title}
          </Text>
          {dream.lucid ? (
            <View style={styles.lucidBadge}>
              <Text style={[typography.caption, styles.lucidBadgeText]}>Lucid</Text>
            </View>
          ) : null}
        </View>
        <Text style={[typography.body, styles.dreamContent]} numberOfLines={1}>
          {dream.content}
        </Text>
        <Text style={[typography.caption, styles.dreamDate]}>{dream.date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  sky: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  backButton: {
    position: 'absolute',
    left: spacing.screenPadding,
  },
  skySpace: {
    // Tall enough that the headline clears the back pill (44pt + its top offset).
    height: '12%',
    minHeight: spacing.md,
    flexShrink: 1000,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  headline: {
    color: colors.text.primary,
  },
  subheadline: {
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  cards: {
    marginTop: spacing.lg,
    gap: spacing.sm + spacing.xs / 2,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.sm + spacing.xs,
    padding: spacing.md,
    borderRadius: radius.glass,
    backgroundColor: colors.surface.glassSoft,
    pointerEvents: 'none',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dreamTitle: {
    color: colors.text.primary,
    flex: 1,
  },
  dreamContent: {
    color: colors.text.secondary,
  },
  dreamDate: {
    color: colors.text.tertiary,
  },
  lucidBadge: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  lucidBadgeText: {
    color: colors.text.primary,
  },
  flexSpacer: {
    flex: 1,
    minHeight: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  cta: {
    alignSelf: 'stretch',
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  footerText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.accent.primary,
  },
});
