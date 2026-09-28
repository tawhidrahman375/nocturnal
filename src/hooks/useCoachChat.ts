import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import {
  COACH_HISTORY_PAGE_SIZE,
  CoachMessage,
  fetchOlderCoachMessages,
  fetchRecentCoachMessages,
  requestCoachReply,
  sendCoachMessage,
} from '../lib/coachChat';

// Which step of the last send attempt failed — determines what retrySend re-does.
// 'send': the user's own message never made it into the DB, so retry re-sends it.
// 'reply': the message is already persisted (and in `messages`), so retry only
// re-requests the coach's reply instead of inserting a duplicate user message.
type FailedAttempt = { text: string; stage: 'send' | 'reply' } | null;

export function useCoachChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  // The coach's reply is in flight — drives the typing indicator.
  const [isReplying, setIsReplying] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  // Set only by a failed send/reply, separate from historyError so a failed initial
  // load doesn't render as a retry-able bubble in the message list (there's nothing to
  // retry — retrySend has no failed attempt to replay).
  const [sendError, setSendError] = useState<string | null>(null);
  const requestedRef = useRef(false);
  const failedRef = useRef<FailedAttempt>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const recent = await fetchRecentCoachMessages(user.id);
      setMessages(recent);
      setHasMore(recent.length === COACH_HISTORY_PAGE_SIZE);
    } catch (e) {
      setHistoryError((e as Error).message);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    loadHistory();
  }, [loadHistory]);

  const loadOlder = useCallback(async () => {
    if (!user || messages.length === 0 || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const older = await fetchOlderCoachMessages(user.id, messages[0].created_at);
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === COACH_HISTORY_PAGE_SIZE);
    } catch (e) {
      setHistoryError((e as Error).message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, messages, isLoadingMore]);

  const requestReply = useCallback(async (userText: string) => {
    setIsReplying(true);
    try {
      const reply = await requestCoachReply(userText);
      setMessages((prev) => [...prev, reply]);
      setSendError(null);
      failedRef.current = null;
    } catch (e) {
      setSendError((e as Error).message);
      failedRef.current = { text: userText, stage: 'reply' };
    } finally {
      setIsReplying(false);
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!user || !trimmed) return;
      setSendError(null);
      try {
        const userMessage = await sendCoachMessage(user.id, trimmed);
        setMessages((prev) => [...prev, userMessage]);
      } catch (e) {
        setSendError((e as Error).message);
        failedRef.current = { text: trimmed, stage: 'send' };
        return;
      }
      await requestReply(trimmed);
    },
    [user, requestReply]
  );

  // Replays whichever step actually failed — never re-inserts a user message that's
  // already persisted, since that would duplicate it in the conversation.
  const retrySend = useCallback(() => {
    const failed = failedRef.current;
    if (!failed) return;
    if (failed.stage === 'send') send(failed.text);
    else requestReply(failed.text);
  }, [send, requestReply]);

  return {
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
  };
}
