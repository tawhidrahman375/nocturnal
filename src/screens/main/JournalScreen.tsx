import { BookOpen, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { NewDreamSheet } from '../../components/NewDreamSheet';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Dream, useDreams } from '../../hooks/useDreams';
import { colors, radius, spacing, typography } from '../../theme';

export function JournalScreen() {
  const { dreams, addDream } = useDreams();
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.displayMd, styles.title]}>Journal</Text>
        <Pressable style={styles.addButton} onPress={() => setSheetVisible(true)} hitSlop={8}>
          <Plus color="#FFFFFF" size={22} strokeWidth={2} />
        </Pressable>
      </View>

      <FlatList
        data={dreams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={dreams.length === 0 ? styles.emptyContainer : styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={BookOpen}
            title="Your journal is empty"
            message="Record your first dream to start building your archive."
          />
        }
        renderItem={({ item }) => <DreamRow dream={item} />}
      />

      <NewDreamSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSubmit={async (dream) => {
          await addDream(dream);
        }}
      />
    </ScreenContainer>
  );
}

function DreamRow({ dream }: { dream: Dream }) {
  return (
    <Card style={styles.dreamCard}>
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
      <Text style={[typography.caption, styles.dreamDate]}>{dream.dreamed_at}</Text>
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
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  dreamCard: {
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
});
