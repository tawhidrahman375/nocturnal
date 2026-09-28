import { supabase } from './supabase';
import { Tables } from '../types/database';

export type CoachMessage = Tables<'coach_messages'>;

export const COACH_HISTORY_PAGE_SIZE = 20;

// Both history reads return newest-first from Postgres (so LIMIT/`created_at < cursor`
// page correctly) and are flipped to chronological order here — every caller works with
// oldest-first arrays, matching how messages render and how new ones get appended.
export async function fetchRecentCoachMessages(userId: string): Promise<CoachMessage[]> {
  const { data, error } = await supabase
    .from('coach_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(COACH_HISTORY_PAGE_SIZE);
  if (error) throw new Error(error.message);
  return (data ?? []).reverse();
}

export async function fetchOlderCoachMessages(userId: string, before: string): Promise<CoachMessage[]> {
  const { data, error } = await supabase
    .from('coach_messages')
    .select('*')
    .eq('user_id', userId)
    .lt('created_at', before)
    .order('created_at', { ascending: false })
    .limit(COACH_HISTORY_PAGE_SIZE);
  if (error) throw new Error(error.message);
  return (data ?? []).reverse();
}

// Inserted directly (coach_messages has an owner-insert RLS policy, same as `dreams`)
// so the user's own message appears instantly instead of waiting on the Edge Function
// round trip. The Edge Function reads it back as part of the conversation history it
// grounds the reply in.
export async function sendCoachMessage(userId: string, content: string): Promise<CoachMessage> {
  const { data, error } = await supabase
    .from('coach_messages')
    .insert({ user_id: userId, role: 'user', content })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

type CoachReplyResponse = { reply: CoachMessage } | { error: string };

// Calls the coach-chat Edge Function, which re-derives the system prompt from the
// user's live data (dreams, dream signs, streak, techniques, track progress) on every
// turn and replies to whatever the latest stored user message is — see
// supabase/functions/coach-chat/index.ts. `message` is the just-sent text, already
// persisted by sendCoachMessage — the function only uses it to reject over-length
// messages before doing anything else; the DB row is still the source of truth.
export async function requestCoachReply(message: string): Promise<CoachMessage> {
  const { data, error } = await supabase.functions.invoke<CoachReplyResponse>('coach-chat', {
    method: 'POST',
    body: { message },
  });
  if (error) {
    // supabase-js doesn't parse the Edge Function's JSON error body for non-2xx
    // responses — `error.message` is just a generic "non-2xx status" string. Read the
    // real message (e.g. the 429 daily-cap copy, or the 400 length message) from the
    // underlying Response so it's what actually reaches the chat UI.
    const context = (error as { context?: Response }).context;
    let serverMessage: string | null = null;
    if (context) {
      try {
        const body = await context.clone().json();
        if (body && typeof body.error === 'string') serverMessage = body.error;
      } catch {
        // Response body wasn't JSON (or already consumed) — fall back below.
      }
    }
    throw new Error(serverMessage ?? error.message);
  }
  if (!data) throw new Error('No response from coach-chat');
  if ('error' in data) throw new Error(data.error);
  return data.reply;
}
