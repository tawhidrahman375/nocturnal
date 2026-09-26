import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Moon, Sparkles } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
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
      "Realized mid-fall that I was dreaming, so I just... stopped falling and flew instead. The ocean stretched out gold and endless.",
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
  return (
    <ScreenContainer glow>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Arrive style={styles.hero}>
          <Text style={[typography.displayLg, styles.headline]}>
            Your dream life, finally organised
          </Text>
          <Text style={[typography.body, styles.subheadline]}>
            Join free to start your own journal
          </Text>
        </Arrive>

        <Arrive delay={80} style={styles.previewSection}>
          <Text style={[typography.overline, styles.previewLabel]}>Example</Text>
          <View style={styles.previewList} pointerEvents="none">
            {EXAMPLE_DREAMS.map((dream) => (
              <ExampleDreamCard key={dream.title} dream={dream} />
            ))}
          </View>
        </Arrive>
      </ScrollView>

      <Arrive delay={140} style={styles.actions}>
        <Button
          label="Create free account"
          onPress={() => navigation.navigate('SignUp')}
          style={styles.cta}
        />
        <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.footer}>
          <Text style={[typography.body, styles.footerText]}>
            Already have an account? <Text style={styles.footerLink}>Sign in</Text>
          </Text>
        </Pressable>
      </Arrive>
    </ScreenContainer>
  );
}

// Mirrors JournalScreen's real DreamRow styling so the preview reads as an honest
// look at the journal, not a mocked-up stand-in. Muted opacity + no press handling
// signal "example" without hiding the copy that's meant to sell the feature.
function ExampleDreamCard({ dream }: { dream: ExampleDream }) {
  const tint = dream.lucid ? colors.status.lucid : colors.accent.primary;
  return (
    <Card style={styles.dreamCard}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: dream.lucid ? colors.status.lucidMuted : colors.accent.primaryMuted },
        ]}
      >
        {dream.lucid ? (
          <Sparkles color={tint} size={18} strokeWidth={1.75} />
        ) : (
          <Moon color={tint} size={18} strokeWidth={1.75} />
        )}
      </View>
      <View style={styles.dreamBody}>
        <View style={styles.dreamCardHeader}>
          <Text style={[typography.bodyMedium, styles.dreamTitle]} numberOfLines={1}>
            {dream.title}
          </Text>
          {dream.lucid ? (
            <View style={styles.lucidBadge}>
              <Text style={[typography.caption, styles.lucidBadgeText]}>Lucid</Text>
            </View>
          ) : null}
        </View>
        <Text style={[typography.body, styles.dreamContent]} numberOfLines={2}>
          {dream.content}
        </Text>
        <Text style={[typography.caption, styles.dreamDate]}>{dream.date}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  hero: {
    gap: spacing.sm,
  },
  headline: {
    color: colors.text.primary,
  },
  subheadline: {
    color: colors.text.secondary,
  },
  previewSection: {
    gap: spacing.sm,
  },
  previewLabel: {
    color: colors.text.tertiary,
  },
  previewList: {
    gap: spacing.sm,
    opacity: 0.82,
  },
  dreamCard: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dreamBody: {
    flex: 1,
    gap: spacing.xs,
  },
  dreamCardHeader: {
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
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  lucidBadgeText: {
    color: colors.status.lucid,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  cta: {
    alignSelf: 'stretch',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: colors.text.secondary,
  },
  footerLink: {
    color: colors.accent.primary,
  },
});
