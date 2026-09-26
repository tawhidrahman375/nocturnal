import { Moon, Plus, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { MilestoneOverlay } from '../../components/MilestoneOverlay';
import { NewDreamSheet } from '../../components/NewDreamSheet';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { Dream, useDreams } from '../../hooks/useDreams';
import { useMilestoneCheck } from '../../hooks/useMilestoneCheck';
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
  const sections = useMemo(() => groupDreamsByDate(dreams), [dreams]);
  const openSheet = () => setSheetVisible(true);
  const { milestone, checkLucidDreamMilestone, dismissMilestone } = useMilestoneCheck();

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.heroTitle, styles.title]}>Journal</Text>
        <Pressable style={styles.addButton} onPress={openSheet} hitSlop={8}>
          <Plus color="#FFFFFF" size={22} strokeWidth={2} />
        </Pressable>
      </View>

      {dreams.length === 0 ? (
        <JournalEmptyState onRecord={openSheet} />
      ) : (
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
      )}

      <NewDreamSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSubmit={async (dream) => {
          await addDream(dream);
          if (dream.is_lucid && user) checkLucidDreamMilestone(user.id);
        }}
      />

      <MilestoneOverlay milestone={milestone} visible={milestone !== null} onDismiss={dismissMilestone} />
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
          {dream.is_lucid ? (
            <View style={styles.lucidBadge}>
              <Text style={[typography.caption, styles.lucidBadgeText]}>Lucid</Text>
            </View>
          ) : null}
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.tabBarClearance,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
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
