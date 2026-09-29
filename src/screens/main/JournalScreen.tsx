import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Mic, Moon, Plus, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Platform, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { DreamCategoryPill } from '../../components/DreamCategoryPill';
import { DreamSignRevealOverlay } from '../../components/DreamSignRevealOverlay';
import { MilestoneOverlay } from '../../components/MilestoneOverlay';
import { NewDreamSheet } from '../../components/NewDreamSheet';
import { NightSky } from '../../components/NightSky';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { Dream, useDreams } from '../../hooks/useDreams';
import { useDreamSignReveal } from '../../hooks/useDreamSignReveal';
import { useMilestoneCheck } from '../../hooks/useMilestoneCheck';
import { useReviewPrompt } from '../../hooks/useReviewPrompt';
import { parseDreamCategory } from '../../lib/dreamCategories';
import { deleteRecording, notifyRecordingsChanged } from '../../lib/dreamRecordings';
import { MainTabParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

// dreamed_at is stored as a local "YYYY-MM-DD" day (see lib/streaks.ts), so it's parsed
// as local components rather than handed to `new Date()`, which treats it as UTC.
function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function sectionLabel(dateStr: string, today: Date) {
  const date = parseLocalDate(dateStr);
  const dayMs = 86_400_000;
  const diffDays = Math.round((today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / dayMs);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

// Dreams already arrive newest-first, so grouping is a single pass rather than a re-sort.
function groupDreamsByDate(dreams: Dream[]) {
  const today = new Date();
  const sections: { title: string; data: Dream[] }[] = [];
  for (const dream of dreams) {
    const label = sectionLabel(dream.dreamed_at, today);
    const current = sections[sections.length - 1];
    if (current?.title === label) current.data.push(dream);
    else sections.push({ title: label, data: [dream] });
  }
  return sections;
}

export function JournalScreen() {
  const { user } = useAuth();
  const { dreams, addDream } = useDreams();
  const [sheetVisible, setSheetVisible] = useState(false);
  const route = useRoute<RouteProp<MainTabParamList, 'Journal'>>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList, 'Journal'>>();
  // Untyped, like CoachChatEntry on Insights: RecordDream is a root stack screen, not a tab.
  const stackNavigation = useNavigation();
  // Set by the voice-recording review sheet ("Save to journal"): opens the new-entry sheet
  // already filled with the transcript, and remembers which recording it came from.
  const newDream = route.params?.newDream;
  const sections = useMemo(() => groupDreamsByDate(dreams), [dreams]);
  const openSheet = () => setSheetVisible(true);
  const closeSheet = () => {
    setSheetVisible(false);
    if (newDream) tabNavigation.setParams({ newDream: undefined });
  };
  const { milestone, checkLucidDreamMilestone, dismissMilestone } = useMilestoneCheck();
  const { currentSign, checkForNewSigns, dismissCurrentSign } = useDreamSignReveal();
  const { triggerReviewPrompt } = useReviewPrompt();

  const handleMilestoneDismiss = () => {
    const wasFirstLucidDream = milestone === 'firstLucidDream';
    dismissMilestone();
    // The 1s delay lets the overlay's own fade-out finish before the system review
    // sheet interrupts, so the two never visually collide.
    if (wasFirstLucidDream) {
      setTimeout(() => triggerReviewPrompt(), 1000);
    }
  };

  return (
    <ScreenContainer edges={['top']} edgeToEdge>
      <NightSky intensity="subtle" style={styles.sky}>
        <Arrive style={styles.header}>
          <Text style={[typography.heroTitle, styles.title]}>Journal</Text>
          <View style={styles.headerActions}>
            {/* iOS has no notification to record from, so it gets a button here instead.
                Android records from its persistent notification. */}
            {Platform.OS === 'ios' ? (
              <Pressable
                style={styles.recordButton}
                onPress={() => stackNavigation.navigate('RecordDream')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Record a dream"
              >
                <Mic color={colors.text.primary} size={20} strokeWidth={1.75} />
              </Pressable>
            ) : null}
            <Pressable style={styles.addButton} onPress={openSheet} hitSlop={8} accessibilityLabel="Add a dream">
              <Plus color="#FFFFFF" size={22} strokeWidth={2} />
            </Pressable>
          </View>
        </Arrive>

        {dreams.length === 0 ? (
          <JournalEmptyState onRecord={openSheet} />
        ) : (
          <Arrive delay={40} style={styles.listWrap}>
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderSectionHeader={({ section }) => (
                <Text style={[typography.label, styles.sectionHeader]}>{section.title}</Text>
              )}
              renderItem={({ item }) => <DreamRow dream={item} />}
            />
          </Arrive>
        )}
      </NightSky>

      <NewDreamSheet
        key={newDream?.key ?? 'blank'}
        visible={sheetVisible || !!newDream}
        initialContent={newDream?.content}
        onClose={closeSheet}
        onSubmit={async (dream) => {
          const { error } = await addDream(dream);
          // The entry is saved, so the recording it came from is finished with. Left in
          // place on a failed save, so nothing is lost.
          if (!error && newDream) {
            deleteRecording(newDream.recordingName);
            notifyRecordingsChanged();
          }
          if (dream.is_lucid && user) checkLucidDreamMilestone(user.id);
          if (user) checkForNewSigns(user.id);
        }}
      />

      <MilestoneOverlay milestone={milestone} visible={milestone !== null} onDismiss={handleMilestoneDismiss} />
      <DreamSignRevealOverlay sign={currentSign} visible={currentSign !== null} onDismiss={dismissCurrentSign} />
    </ScreenContainer>
  );
}

// No icon-in-a-circle "empty state" box — the archive being quiet is the whole screen
// for a moment, carried by scale and negative space rather than a placeholder graphic.
function JournalEmptyState({ onRecord }: { onRecord: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={[typography.heroTitle, styles.emptyHeadline]}>
        Nothing written{'\n'}down yet.
      </Text>
      <Text style={[typography.body, styles.emptyBody]}>
        Dreams fade fast. The next one you remember is the first page of your archive.
      </Text>
      <Button
        label="Record a dream"
        onPress={onRecord}
        style={styles.emptyCta}
      />
    </View>
  );
}

function DreamRow({ dream }: { dream: Dream }) {
  const category = parseDreamCategory(dream.category);
  const tint = dream.is_lucid ? colors.status.lucid : colors.accent.primary;
  return (
    <Card style={styles.dreamCard}>
      <View style={[styles.avatar, { backgroundColor: dream.is_lucid ? colors.status.lucidMuted : colors.accent.primaryMuted }]}>
        {dream.is_lucid ? (
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
          {/* The category pill below already says Lucid for a categorised lucid dream, so the
              header badge only stands in for older lucid entries that have no category. */}
          {dream.is_lucid && category !== 'lucid' ? (
            <View style={styles.lucidBadge}>
              <Text style={[typography.caption, styles.lucidBadgeText]}>Lucid</Text>
            </View>
          ) : null}
        </View>
        {category ? <DreamCategoryPill category={category} /> : null}
        {dream.content ? (
          <Text style={[typography.body, styles.dreamContent]} numberOfLines={2}>
            {dream.content}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sky: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  title: {
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Small floating controls are frosted glass in DESIGN.md: a translucent white fill.
  recordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrap: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.tabBarClearance,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.tabBarClearance,
    gap: spacing.md,
  },
  emptyHeadline: {
    color: colors.text.primary,
  },
  emptyBody: {
    color: colors.text.secondary,
    maxWidth: 280,
  },
  emptyCta: {
    marginTop: spacing.sm,
  },
  sectionHeader: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
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
    justifyContent: 'center',
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
  lucidBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  lucidBadgeText: {
    color: colors.status.lucid,
  },
});
