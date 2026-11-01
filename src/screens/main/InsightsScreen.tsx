import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import {
  BedDouble,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Compass,
  Flame,
  MessageCircle,
  Moon,
  Sparkles,
  Trophy,
  Waves,
} from 'lucide-react-native';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AccordionItem } from '../../components/AccordionItem';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { NightSky } from '../../components/NightSky';
import { ProgressRing } from '../../components/ProgressRing';
import { ProUpsell } from '../../components/ProUpsell';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SkeletonLines } from '../../components/SkeletonLines';
import { StatPill } from '../../components/StatPill';
import { MIN_DREAMS_FOR_INSIGHT, useDreamInsight } from '../../hooks/useDreamInsight';
import { useDreams } from '../../hooks/useDreams';
import { useProfile } from '../../hooks/useProfile';
import { useProgressNarratives } from '../../hooks/useProgressNarratives';
import { SleepInsightState, useSleepInsight } from '../../hooks/useSleepInsight';
import { useSubscription } from '../../hooks/useSubscription';
import { useTechniqueRecommendation } from '../../hooks/useTechniqueRecommendation';
import { openHealthConnectInstall, openHealthSettings } from '../../lib/sleepData';
import {
  SLEEP_INSIGHT_CONNECT,
  SLEEP_INSIGHT_ERROR,
  SLEEP_INSIGHT_HEALTH_CONNECT_MISSING,
  SLEEP_INSIGHT_HEALTH_CONNECT_UPDATE,
  SLEEP_INSIGHT_NOT_ENOUGH_DATA,
  SLEEP_INSIGHT_UNSUPPORTED,
} from '../../lib/sleepInsight';
import { MainTabParamList } from '../../navigation/types';
import { colors, fontFamily, radius, spacing, typography } from '../../theme';

function CoachChatEntry() {
  // Untyped useNavigation (not the tab-scoped hook InsightsScreen itself uses below) so
  // this can reach CoachChat, a root AppStackParamList screen rather than a sibling tab
  // — same pattern WbtbCard and BeginnerTrackCard use to reach their own root screens.
  const navigation = useNavigation();

  return (
    <AnimatedPressable
      onPress={() => navigation.navigate('CoachChat')}
      accessibilityRole="button"
      accessibilityLabel="Talk to Cleo"
    >
      <Card style={styles.coachCard} elevated>
        <MessageCircle color={colors.accent.primary} size={32} strokeWidth={1.5} />
        <View style={styles.coachCopy}>
          <Text style={styles.coachTitle}>Talk to Cleo</Text>
          <Text style={[typography.label, styles.coachSubtitle]}>
            Ask about your dreams, techniques, or how to go lucid tonight.
          </Text>
        </View>
        <ChevronRight color={colors.text.tertiary} size={20} strokeWidth={1.5} />
      </Card>
    </AnimatedPressable>
  );
}

// The technique recommendation as an accordion row. Renders in both the populated and
// empty-account branches below so the no-history fallback (lib/techniqueRecommendation.ts)
// is reachable on a fresh account too, not just once there's enough data for the rest of
// the screen to unlock.
function TechniqueAccordion({ isPro, locked }: { isPro: boolean; locked: boolean }) {
  const { recommendation, isLoading } = useTechniqueRecommendation(isPro);

  if (locked) {
    return (
      <ProUpsell
        icon={Compass}
        label="YOUR TECHNIQUE"
        text="A technique picked for you, based on how your own sessions go."
      />
    );
  }

  return (
    <AccordionItem
      icon={Compass}
      label="YOUR TECHNIQUE"
      text={isLoading ? 'Finding your focus...' : recommendation}
      muted={isLoading}
    />
  );
}

// The weekly and monthly progress narratives. No retry affordance on purpose: any failure,
// or a period the function had nothing for, just shows the plain fallback line. With fewer
// than two dreams logged the hook makes no API call and both rows show the fallback line.
function ProgressNarrativeAccordions({
  narratives,
  locked,
}: {
  narratives: ReturnType<typeof useProgressNarratives>;
  locked: boolean;
}) {
  const { weekly, monthly, isLoading, fallback } = narratives;

  if (locked) {
    return (
      <ProUpsell
        icon={CalendarDays}
        label="YOUR PROGRESS"
        text="Weekly and monthly summaries of how your dreams are changing."
      />
    );
  }

  return (
    <>
      <AccordionItem
        icon={CalendarDays}
        label="THIS WEEK"
        text={weekly ?? fallback}
        muted={!weekly}
        loading={isLoading}
      />
      <AccordionItem
        icon={CalendarRange}
        label="THIS MONTH"
        text={monthly ?? fallback}
        muted={!monthly}
        loading={isLoading}
      />
    </>
  );
}

// Where the health data cannot simply be read yet, the card says why and offers the one
// action that helps, all inline. Health Connect being absent gets the Play Store; a
// permission that was already asked for (and either denied or, on iOS, unreadable) gets the
// place to change it, since asking again would not show a prompt.
function SleepInsightCard({ state, onConnect }: { state: SleepInsightState; onConnect: () => void }) {
  const alreadyAskedHint =
    Platform.OS === 'ios'
      ? 'If you turned this off, allow Sleep for Nocturnal in Health, under Sharing, then Apps.'
      : 'If you turned this off, allow Nocturnal to read Sleep in Health Connect.';

  let body: React.ReactNode;
  switch (state.kind) {
    case 'loading':
      body = <SkeletonLines accessibilityLabel="Loading sleep insight" />;
      break;
    case 'ready':
      body = <Text style={[typography.body, styles.insightBody]}>{state.content}</Text>;
      break;
    case 'needs-permission':
      body = (
        <>
          <Text style={[typography.body, styles.insightPending]}>{SLEEP_INSIGHT_CONNECT}</Text>
          {state.alreadyAsked ? <Text style={[typography.label, styles.insightPending]}>{alreadyAskedHint}</Text> : null}
          <Button
            size="sm"
            style={styles.sleepAction}
            label={state.alreadyAsked ? (Platform.OS === 'ios' ? 'Open Health' : 'Open Health Connect') : 'Connect'}
            onPress={state.alreadyAsked ? () => openHealthSettings() : onConnect}
          />
        </>
      );
      break;
    case 'health-connect-missing':
      body = (
        <>
          <Text style={[typography.body, styles.insightPending]}>
            {state.needsUpdate ? SLEEP_INSIGHT_HEALTH_CONNECT_UPDATE : SLEEP_INSIGHT_HEALTH_CONNECT_MISSING}
          </Text>
          <Button
            size="sm"
            style={styles.sleepAction}
            label={state.needsUpdate ? 'Update Health Connect' : 'Get Health Connect'}
            onPress={() => openHealthConnectInstall()}
          />
        </>
      );
      break;
    case 'not-enough-data':
      body = <Text style={[typography.body, styles.insightPending]}>{SLEEP_INSIGHT_NOT_ENOUGH_DATA}</Text>;
      break;
    case 'unsupported':
      body = <Text style={[typography.body, styles.insightPending]}>{SLEEP_INSIGHT_UNSUPPORTED}</Text>;
      break;
    case 'error':
      body = <Text style={[typography.body, styles.insightPending]}>{SLEEP_INSIGHT_ERROR}</Text>;
      break;
  }

  return (
    <Card style={styles.insightCard} elevated>
      <View style={styles.insightHeader}>
        <BedDouble color={colors.accent.primary} size={16} strokeWidth={1.75} />
        <Text style={[typography.label, styles.insightLabel]}>Sleep and dreams</Text>
      </View>
      {body}
    </Card>
  );
}

function SleepCard({
  locked,
  state,
  onConnect,
}: {
  locked: boolean;
  state: SleepInsightState;
  onConnect: () => void;
}) {
  if (locked) {
    return (
      <ProUpsell icon={BedDouble} label="SLEEP AND DREAMS" text="See how your sleep shapes the dreams you remember." />
    );
  }
  return <SleepInsightCard state={state} onConnect={onConnect} />;
}

export function InsightsScreen() {
  const { dreams, isLoading: dreamsLoading } = useDreams();
  const { profile } = useProfile();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const totalDreams = dreams.length;
  // Pattern analysis, progress narratives, the sleep correlation and the technique
  // recommendation are Pro. The hooks are switched off for a free user so none of them reach
  // an Edge Function; `locked` waits for the first CustomerInfo so a subscriber never sees
  // the upsell flash while it loads.
  const { isPro, isResolved } = useSubscription();
  const locked = isResolved && !isPro;
  const narratives = useProgressNarratives(totalDreams, dreamsLoading, isPro);
  const sleep = useSleepInsight(dreams, dreamsLoading, isPro);
  const { insight, isLoading: insightLoading } = useDreamInsight(totalDreams, isPro);
  const lucidDreams = dreams.filter((dream) => dream.is_lucid).length;
  const lucidRate = totalDreams > 0 ? Math.round((lucidDreams / totalDreams) * 100) : 0;
  const currentStreak = profile?.current_streak ?? 0;
  const longestStreak = profile?.longest_streak ?? 0;

  return (
    <ScreenContainer edges={['top']} edgeToEdge>
      <NightSky intensity="subtle" style={styles.sky}>
        <View style={styles.header}>
          <Text style={[typography.heroTitle, styles.title]}>Insights</Text>
        </View>

        {totalDreams === 0 ? (
          // Scrollable, unlike before: the technique recommendation is a full paragraph and
          // the two narrative cards follow it, so together they no longer fit above the
          // tab bar on a phone.
          <ScrollView contentContainerStyle={styles.emptyScroll} showsVerticalScrollIndicator={false}>
            <Arrive>
              <CoachChatEntry />
            </Arrive>
            <EmptyState
              icon={Waves}
              title="Nothing to trace yet."
              message="A pattern needs more than one night. Keep logging, and it will surface."
              tint={colors.text.secondary}
              action={{ label: 'Log a dream', onPress: () => navigation.navigate('Journal') }}
            />
            <Arrive delay={80} style={styles.accordionStack}>
              <TechniqueAccordion isPro={isPro} locked={locked} />
              <ProgressNarrativeAccordions narratives={narratives} locked={locked} />
              {Platform.OS !== 'web' ? (
                <SleepCard locked={locked} state={sleep.state} onConnect={sleep.connect} />
              ) : null}
            </Arrive>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Arrive>
              <CoachChatEntry />
            </Arrive>

            <Arrive delay={30}>
              <Card style={styles.heroCard} elevated>
                <ProgressRing size={140} strokeWidth={12} progress={lucidRate / 100} color={colors.status.lucid}>
                  <Text style={[typography.displayLg, styles.heroValue]}>{lucidRate}%</Text>
                </ProgressRing>
                <Text style={[typography.bodyMedium, styles.heroCaption]}>Lucid dream rate</Text>
                <Text style={[typography.body, styles.heroBody]}>
                  {lucidDreams} of {totalDreams} logged dreams were lucid.
                </Text>
              </Card>
            </Arrive>

            <Arrive delay={60} style={styles.statsRow}>
              <StatPill icon={Flame} value={currentStreak} label="Day streak" tint={colors.accent.primary} />
              <StatPill icon={Trophy} value={longestStreak} label="Best streak" tint={colors.text.secondary} />
              <StatPill icon={Moon} value={totalDreams} label="Logged" tint={colors.text.secondary} />
            </Arrive>

            <Arrive delay={90} style={styles.accordionStack}>
              {totalDreams >= MIN_DREAMS_FOR_INSIGHT ? (
                locked ? (
                  <ProUpsell
                    icon={Sparkles}
                    label="INSIGHT"
                    text="The patterns that keep showing up across your dreams."
                  />
                ) : (
                  <AccordionItem
                    icon={Sparkles}
                    label="INSIGHT"
                    text={
                      insight
                        ? insight.content
                        : insightLoading || !isResolved
                          ? 'Reading your patterns...'
                          : "Check back after tonight's entry."
                    }
                    muted={!insight}
                  />
                )
              ) : null}
              <TechniqueAccordion isPro={isPro} locked={locked} />
              <ProgressNarrativeAccordions narratives={narratives} locked={locked} />
              {Platform.OS !== 'web' ? (
                <SleepCard locked={locked} state={sleep.state} onConnect={sleep.connect} />
              ) : null}
            </Arrive>
          </ScrollView>
        )}
      </NightSky>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sky: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  title: {
    color: colors.text.primary,
  },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.tabBarClearance,
    gap: spacing.md,
  },
  heroCard: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xs,
  },
  heroValue: {
    color: colors.text.primary,
  },
  heroCaption: {
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  heroBody: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightCard: {
    gap: spacing.xs,
  },
  emptyScroll: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.tabBarClearance,
    gap: spacing.md,
  },
  // 12px between rows. The scroll container's own 16px gap sits above this, so the extra
  // top margin brings the stat pills to the first row up to 24px.
  accordionStack: {
    gap: spacing.sm + spacing.xs,
    marginTop: spacing.lg - spacing.md,
  },
  sleepAction: {
    marginTop: spacing.xs,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  insightLabel: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightBody: {
    color: colors.text.primary,
  },
  insightPending: {
    color: colors.text.tertiary,
  },
  // The hero action on this screen: taller than a list row, on the 10% glass, no border.
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: radius.glass,
    backgroundColor: colors.surface.glass,
  },
  coachCopy: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  coachTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.primary,
  },
  coachSubtitle: {
    color: colors.text.secondary,
  },
});
