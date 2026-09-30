import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, ArrowUp, Moon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Breathing } from '../../components/Breathing';
import { CoachMessageBubble } from '../../components/CoachMessageBubble';
import { LoadingView } from '../../components/LoadingView';
import { NightSky } from '../../components/NightSky';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useCoachChat } from '../../hooks/useCoachChat';
import { track } from '../../lib/analytics';
import { CoachMessage } from '../../lib/coachChat';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'CoachChat'>;

const MAX_MESSAGE_LENGTH = 500;
const CHAR_WARNING_THRESHOLD = MAX_MESSAGE_LENGTH - 50;

// Static, zero-token placeholder shown only while the real conversation (from Supabase)
// is empty — never persisted, never sent to the Edge Function. Shares CoachMessageBubble
// with real messages so it's visually identical to an actual reply from Cleo.
const GREETING: CoachMessage = {
  id: 'greeting',
  user_id: '',
  role: 'assistant',
  content:
    'Hi, I am Cleo, your lucid dreaming coach. Ask me about your dreams, your technique, or how to have your first lucid dream tonight.',
  created_at: new Date(0).toISOString(),
};

// Three staggered Breathing dots in a coach-side bubble shell — the "otherwise load
// with a typing indicator" fallback from spec, since true token streaming isn't wired
// up (see the Edge Function: it returns the full reply in one response, not a stream).
function TypingBubble() {
  return (
    <View style={styles.metaRow}>
      <View style={styles.avatar}>
        <Moon color={colors.accent.primary} size={14} strokeWidth={1.75} />
      </View>
      <View style={styles.typingBubble}>
        {[0, 1, 2].map((i) => (
          <Breathing key={i} minOpacity={0.3} maxOpacity={1} durationMs={600} delayMs={i * 150}>
            <View style={styles.typingDot} />
          </Breathing>
        ))}
      </View>
    </View>
  );
}

// Renders a failed send/reply as part of the conversation itself, with a way to retry
// the exact step that failed — never a silent blank state or a thrown error screen.
function ErrorBubble({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.metaRow}>
      <View style={styles.avatar}>
        <Moon color={colors.accent.primary} size={14} strokeWidth={1.75} />
      </View>
      <View style={styles.errorBubble}>
        <Text style={[typography.body, styles.errorBubbleText]}>{message}</Text>
        <AnimatedPressable onPress={onRetry} hitSlop={8} accessibilityRole="button" accessibilityLabel="Retry">
          <Text style={[typography.label, styles.retryText]}>Retry</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function LoadEarlierRow({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} disabled={loading} style={styles.loadEarlier}>
      <Text style={[typography.label, styles.loadEarlierText]}>
        {loading ? 'Loading…' : 'Load earlier messages'}
      </Text>
    </AnimatedPressable>
  );
}

export function CoachChatScreen({ navigation }: Props) {
  const {
    messages,
    isLoadingHistory,
    isLoadingMore,
    hasMore,
    isReplying,
    historyError,
    sendError,
    loadOlder,
    send,
    retrySend,
  } = useCoachChat();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<CoachMessage>>(null);

  useEffect(() => {
    track('coach_chat_opened');
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length, isReplying, sendError]);

  const handleSend = () => {
    const text = input;
    if (!text.trim() || text.length > MAX_MESSAGE_LENGTH) return;
    setInput('');
    send(text);
  };

  const overLimit = input.length > MAX_MESSAGE_LENGTH;
  const nearLimit = input.length >= CHAR_WARNING_THRESHOLD;

  return (
    <ScreenContainer edges={['top', 'bottom']} edgeToEdge>
      <NightSky intensity="subtle" style={styles.sky}>
        <View style={styles.header}>
          <AnimatedPressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft color={colors.text.secondary} size={24} strokeWidth={1.5} />
          </AnimatedPressable>
          <View style={styles.headerText}>
            <Text style={[typography.label, styles.eyebrow]}>Coach</Text>
            <Text style={[typography.displayMd, styles.title]}>Talk it through</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {isLoadingHistory ? (
            <LoadingView label="Loading your conversation" />
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => <CoachMessageBubble message={item} />}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              ListHeaderComponent={
                hasMore ? <LoadEarlierRow loading={isLoadingMore} onPress={loadOlder} /> : null
              }
              ListFooterComponent={
                isReplying ? (
                  <TypingBubble />
                ) : sendError ? (
                  <ErrorBubble message={sendError} onRetry={retrySend} />
                ) : null
              }
              ListEmptyComponent={<CoachMessageBubble message={GREETING} />}
            />
          )}

          {historyError ? <Text style={[typography.label, styles.errorText]}>{historyError}</Text> : null}

          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask your coach..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                maxLength={MAX_MESSAGE_LENGTH}
              />
              {nearLimit ? (
                <Text style={[typography.label, overLimit ? styles.charCountOver : styles.charCountWarning]}>
                  {input.length}/{MAX_MESSAGE_LENGTH}
                </Text>
              ) : null}
            </View>
            <AnimatedPressable
              onPress={handleSend}
              disabled={!input.trim() || overLimit}
              style={[styles.sendButton, (!input.trim() || overLimit) && styles.sendButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Send"
            >
              <ArrowUp
                color={input.trim() && !overLimit ? colors.text.onAccent : colors.text.tertiary}
                size={18}
                strokeWidth={2}
              />
            </AnimatedPressable>
          </View>
        </KeyboardAvoidingView>
      </NightSky>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sky: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
  },
  headerText: {
    gap: spacing.xs / 2,
  },
  headerSpacer: {
    width: 24,
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text.primary,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    justifyContent: 'flex-end',
  },
  loadEarlier: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  loadEarlierText: {
    color: colors.text.secondary,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface.cardElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.card,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.secondary,
  },
  errorBubble: {
    maxWidth: '78%',
    gap: spacing.xs,
    backgroundColor: colors.surface.cardElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.card,
  },
  errorBubbleText: {
    color: colors.text.primary,
  },
  retryText: {
    color: colors.accent.primary,
  },
  errorText: {
    color: '#F87171',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  inputWrap: {
    flex: 1,
  },
  input: {
    maxHeight: 100,
    minHeight: 44,
    borderRadius: radius.button,
    backgroundColor: colors.surface.card,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
  charCountWarning: {
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs / 2,
  },
  charCountOver: {
    color: '#F87171',
    textAlign: 'right',
    marginTop: spacing.xs / 2,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surface.card,
  },
});
