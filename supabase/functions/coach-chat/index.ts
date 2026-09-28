import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ANTHROPIC_API_VERSION, NO_EM_DASH_RULE, SONNET_MODEL } from "../_shared/ai-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const RECENT_DREAM_LIMIT = 10;
const MAX_DREAM_SIGNS = 8;
const MAX_CONTENT_CHARS = 240;
// How many past turns (both roles) ride along as conversation context sent to Claude —
// deliberately smaller than the client's own "last 20" on-screen history window
// (src/lib/coachChat.ts): the screen shows more scrollback than the model needs to
// stay grounded in the immediate conversation, which keeps prompt size (and cost) down.
const HISTORY_LIMIT = 8;
const MAX_MESSAGE_LENGTH = 500;
const DAILY_MESSAGE_CAP = 30;
const DAILY_CAP_MESSAGE = "You have reached your 30 message limit for today. It resets at midnight.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type DreamRow = { title: string; content: string; tags: string[]; is_lucid: boolean; dreamed_at: string };
type MessageRow = { role: string; content: string };

// Mirrors src/lib/dreamSigns.ts — same recurring-tag logic as generate-dream-insight
// and generate-mild-mantra, duplicated per-function since Edge Functions deploy
// independently.
function extractDreamSigns(dreams: Pick<DreamRow, "tags">[]): string[] {
  const counts = new Map<string, { display: string; count: number }>();
  for (const dream of dreams) {
    for (const rawTag of dream.tags ?? []) {
      const tag = rawTag.trim();
      if (!tag) continue;
      const key = tag.toLowerCase();
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { display: tag, count: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_DREAM_SIGNS)
    .map((entry) => entry.display);
}

function truncate(text: string, max: number) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function buildSystemPrompt(input: {
  recentDreams: DreamRow[];
  dreamSigns: string[];
  totalDreams: number;
  lucidDreams: number;
  currentStreak: number;
  longestStreak: number;
  triedTechniques: string[];
  trackDay: number | null;
  trackCompletedCount: number | null;
}) {
  const {
    recentDreams,
    dreamSigns,
    totalDreams,
    lucidDreams,
    currentStreak,
    longestStreak,
    triedTechniques,
    trackDay,
    trackCompletedCount,
  } = input;

  const entries = recentDreams
    .map((d, i) => {
      const lucidTag = d.is_lucid ? " [lucid]" : "";
      const tags = d.tags.length ? ` (tags: ${d.tags.join(", ")})` : "";
      return `${i + 1}. ${d.dreamed_at}${lucidTag} — "${d.title}"${tags}: ${truncate(d.content, MAX_CONTENT_CHARS)}`;
    })
    .join("\n");

  const trackLine =
    trackDay !== null && trackCompletedCount !== null
      ? `On day ${trackDay} of the 30-day beginner track, ${trackCompletedCount} day(s) completed so far.`
      : "Has not started the 30-day beginner track.";

  return `Your name is Cleo. You are the in-app lucid dreaming coach inside Nocturnal, a lucid dreaming journal and training app. You are talking directly with a specific user in an ongoing chat. Ground every answer in the real data about them below when it's relevant, and reference specific dreams, dream signs, or patterns by name when it helps. Never invent dream content, events, or details that aren't in the data given to you.

This user's data:
- Total dreams logged: ${totalDreams}, of which ${lucidDreams} were lucid.
- Current journaling streak: ${currentStreak} day(s). Longest streak: ${longestStreak} day(s).
- Recurring dream signs (tags that show up more than once): ${dreamSigns.length ? dreamSigns.join(", ") : "none yet"}.
- Techniques they've tried: ${triedTechniques.length ? triedTechniques.join(", ") : "none recorded yet"}.
- ${trackLine}
- Recent journal entries (most recent first):
${entries || "(no entries yet)"}

How to talk:
- Warm, direct, and knowledgeable. You are a coach, not a therapist and not a cheerleader — no excessive praise, no clinical distance.
- Only discuss lucid dreaming and sleep: techniques (MILD, WILD, SSILD, WBTB), sleep science, dream journaling, and reality checks. If asked about anything unrelated, briefly decline and steer back to those topics.
- Reference this user's actual dreams, streak, or dream signs when it's genuinely relevant to what they asked, not in every reply.
- Keep replies short: 2-4 sentences for a normal reply, rarely more. This renders as a plain-text chat bubble with no markdown support, so never use **bold**, bullet points, numbered lists, or headings — write in plain flowing sentences only. If you have multiple points, fold them into one short paragraph instead of a list.
- You are not a medical professional and never give medical or psychological advice or diagnoses. If the user brings up a sleep disorder, a health condition, or anything else medical, say plainly that you are not a medical professional and recommend they speak to a doctor.
- ${NO_EM_DASH_RULE}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Length check runs before anything else — no auth, no DB, no Claude call — since
  // the client always sends the just-inserted message's own text alongside the request
  // purely for this validation (the DB row, inserted client-side, is still the source
  // of truth for the actual conversation history read below).
  let body: { message?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const messageText = typeof body.message === "string" ? body.message : "";
  if (messageText.length > MAX_MESSAGE_LENGTH) {
    return json({ error: `Message is too long. Keep it under ${MAX_MESSAGE_LENGTH} characters.` }, 400);
  }

  if (!ANTHROPIC_API_KEY) {
    return json({ error: "Server is missing ANTHROPIC_API_KEY" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Invalid or expired session" }, 401);

  // Service-role client for everything after auth — reads across the user's own data
  // and writes the coach's reply, bypassing RLS (coach_messages has no INSERT policy
  // for the 'assistant' role beyond what the owner-insert policy already allows, but
  // this function is the only thing meant to author assistant turns).
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Daily cap — UTC-midnight-anchored, not a rolling 24h window. Checked (and, if hit,
  // returned) before any grounding-data queries or the Claude call itself.
  const utcMidnight = new Date();
  utcMidnight.setUTCHours(0, 0, 0, 0);
  const { count: todayCount, error: capError } = await adminClient
    .from("coach_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", utcMidnight.toISOString());
  if (capError) return json({ error: capError.message }, 500);
  if ((todayCount ?? 0) >= DAILY_MESSAGE_CAP) {
    return json({ error: DAILY_CAP_MESSAGE }, 429);
  }

  const [
    { data: history, error: historyError },
    { data: recentDreams, error: dreamsError },
    { data: profile, error: profileError },
    { count: totalDreams, error: totalError },
    { count: lucidDreams, error: lucidError },
    { data: trackProgress },
    { count: trackCompletedCount },
  ] = await Promise.all([
    adminClient
      .from("coach_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT),
    adminClient
      .from("dreams")
      .select("title, content, tags, is_lucid, dreamed_at")
      .eq("user_id", user.id)
      .order("dreamed_at", { ascending: false })
      .limit(RECENT_DREAM_LIMIT),
    adminClient
      .from("profiles")
      .select("current_streak, longest_streak, tried_techniques")
      .eq("id", user.id)
      .single(),
    adminClient.from("dreams").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    adminClient
      .from("dreams")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_lucid", true),
    adminClient.from("beginner_track_progress").select("started_at").eq("user_id", user.id).maybeSingle(),
    adminClient.from("beginner_track_completions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  if (historyError) return json({ error: historyError.message }, 500);
  if (dreamsError) return json({ error: dreamsError.message }, 500);
  if (profileError) return json({ error: profileError.message }, 500);
  if (totalError) return json({ error: totalError.message }, 500);
  if (lucidError) return json({ error: lucidError.message }, 500);

  const historyChrono = [...(history ?? [])].reverse() as MessageRow[];
  if (historyChrono.length === 0 || historyChrono[historyChrono.length - 1].role !== "user") {
    return json({ error: "No user message to respond to" }, 400);
  }

  const dreamList = (recentDreams ?? []) as DreamRow[];
  const dreamSigns = extractDreamSigns(dreamList);

  let trackDay: number | null = null;
  if (trackProgress?.started_at) {
    const days = Math.floor(
      (Date.now() - new Date(`${trackProgress.started_at}T00:00:00Z`).getTime()) / (24 * 60 * 60 * 1000)
    );
    trackDay = Math.min(30, Math.max(1, days + 1));
  }

  const systemPrompt = buildSystemPrompt({
    recentDreams: dreamList,
    dreamSigns,
    totalDreams: totalDreams ?? 0,
    lucidDreams: lucidDreams ?? 0,
    currentStreak: profile?.current_streak ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
    triedTechniques: profile?.tried_techniques ?? [],
    trackDay,
    trackCompletedCount: trackProgress?.started_at ? (trackCompletedCount ?? 0) : null,
  });

  let replyText: string;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        // No `temperature` — this model rejects it as a deprecated parameter (learned
        // live from the Edge Function logs; claude-sonnet-5-5 doesn't take the same
        // request shape older models did).
        model: SONNET_MODEL,
        // Generous relative to the "2-4 sentences" instruction in the system prompt —
        // a hard cutoff mid-sentence is worse than an occasional longer-than-ideal
        // reply, and a real technique comparison legitimately needs more room.
        max_tokens: 600,
        system: systemPrompt,
        messages: historyChrono.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const textBlock = Array.isArray(data?.content)
      ? data.content.find((block: { type?: string }) => block?.type === "text")
      : undefined;
    const text = textBlock?.text;
    if (typeof text !== "string" || !text.trim()) {
      console.error("coach-chat unexpected Claude response shape:", JSON.stringify(data));
      throw new Error("Claude API returned no text content");
    }
    replyText = text.trim();
  } catch (e) {
    console.error("coach-chat Claude call failed:", e);
    return json({ error: e instanceof Error ? e.message : "Claude request failed" }, 502);
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("coach_messages")
    .insert({ user_id: user.id, role: "assistant", content: replyText })
    .select()
    .single();
  if (insertError) return json({ error: insertError.message }, 500);

  return json({ reply: inserted });
});
