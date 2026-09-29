import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ANTHROPIC_API_VERSION, CLAUDE_MODEL, NO_EM_DASH_RULE } from "../_shared/ai-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const DAY_MS = 24 * 60 * 60 * 1000;
const REGENERATE_AFTER_MS = 7 * DAY_MS;
const MIN_DREAMS_FOR_PROFILE = 5;
// PostgREST caps a response at 1000 rows by default, so "all dreams" is paged.
const PAGE_SIZE = 1000;
const MAX_DREAM_SIGNS = 15;
const MAX_MOODS = 6;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type TechniqueKey = "mild" | "wild" | "ssild";
const TECHNIQUES: TechniqueKey[] = ["mild", "wild", "ssild"];

const SYSTEM_PROMPT =
  'You are a lucid dreaming coach who has read every dream this user has ever logged. Write a single paragraph of 3 to 4 plain sentences that describes their unique dreaming identity. Cover their recurring themes or environments, their emotional patterns if the data shows them, which technique is actually working for them, and one honest observation about their practice. Do not list stats. Do not use markdown. Do not use em dashes. Write it as if you know this person. If the user has fewer than 5 dreams logged, return exactly this and nothing else: "Your dream profile builds over time. Keep logging and your identity as a dreamer will start to take shape."';

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

type DreamRow = { id: string; tags: string[]; is_lucid: boolean; dreamed_at: string; mood: string | null };
type SessionRow = { technique: string; dream_id: string | null };

// Counts case-insensitively but keeps the first spelling seen, most frequent first.
// Mirrors src/lib/dreamSigns.ts, without its cap, and reused for moods.
function countValues(values: string[], limit: number): { name: string; count: number }[] {
  const counts = new Map<string, { display: string; count: number }>();
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { display: value, count: 1 });
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => ({ name: entry.display, count: entry.count }));
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// `dreamed_at` is a "YYYY-MM-DD" local calendar day (see src/lib/streaks.ts). Parsing it
// as UTC keeps the weekday the user logged it on, independent of the server's timezone.
function busiestDays(dreams: DreamRow[]): { day: string; count: number }[] {
  const counts = new Array(7).fill(0) as number[];
  for (const dream of dreams) {
    const time = new Date(`${dream.dreamed_at}T00:00:00Z`).getTime();
    if (Number.isNaN(time)) continue;
    counts[new Date(time).getUTCDay()] += 1;
  }
  return counts
    .map((count, i) => ({ day: DAY_NAMES[i], count }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
}

function buildPrompt(input: {
  dreams: DreamRow[];
  sessions: SessionRow[];
  currentStreak: number;
  longestStreak: number;
  accountCreatedAt: string | null;
}) {
  const { dreams, sessions, currentStreak, longestStreak, accountCreatedAt } = input;

  const lucidIds = new Set(dreams.filter((d) => d.is_lucid).map((d) => d.id));
  const lucidCount = lucidIds.size;

  const signs = countValues(dreams.flatMap((d) => d.tags ?? []), MAX_DREAM_SIGNS).map(
    (s) => `${s.name} (${s.count})`,
  );
  const moods = countValues(dreams.flatMap((d) => (d.mood ? [d.mood] : [])), MAX_MOODS).map(
    (m) => `${m.name} (${m.count})`,
  );

  const techniqueLines = TECHNIQUES.map((t) => {
    const ofTechnique = sessions.filter((s) => s.technique === t);
    if (ofTechnique.length === 0) return `${t.toUpperCase()}: never tried`;
    const lucid = ofTechnique.filter((s) => s.dream_id && lucidIds.has(s.dream_id)).length;
    const rate = Math.round((lucid / ofTechnique.length) * 100);
    return `${t.toUpperCase()}: ${plural(ofTechnique.length, "attempt")}, ${lucid} led to a lucid dream (${rate}% follow-through)`;
  }).join("\n");

  const days = busiestDays(dreams).map((d) => `${d.day} (${plural(d.count, "dream")})`);

  const daysSinceJoined = accountCreatedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(accountCreatedAt).getTime()) / DAY_MS))
    : null;

  return `This user's full lucid dreaming history:

Dreams logged: ${dreams.length}
Lucid dreams: ${lucidCount}
Dream signs across all dreams, with how often each appears: ${signs.length ? signs.join(", ") : "none tagged"}
Moods recorded on dreams: ${moods.length ? moods.join(", ") : "none recorded"}
Days of the week they log the most dreams: ${days.length ? days.join(", ") : "no pattern"}

Wake Back to Bed sessions completed, by technique:
${techniqueLines}

Current journaling streak: ${currentStreak} day(s)
Longest streak: ${longestStreak} day(s)
Using the app for: ${daysSinceJoined === null ? "unknown" : plural(daysSinceJoined, "day")}

Write their dream profile now. ${NO_EM_DASH_RULE}`;
}

async function callClaude(prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": ANTHROPIC_API_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 320,
      temperature: 0.5,
      system: `${SYSTEM_PROMPT} ${NO_EM_DASH_RULE}`,
      messages: [{ role: "user", content: prompt }],
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
    throw new Error("Claude API returned no text content");
  }
  // Belt and braces on the no-em-dash rule: the prompt forbids them, this guarantees it.
  return text.trim().replace(/\s*—\s*/g, ", ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

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

  // Service-role client for everything after auth: reads across the user's own data and
  // writes the profile, bypassing RLS (dream_profiles has no INSERT policy for regular
  // users; only this function is meant to write to it). The user is always the one the
  // JWT says it is, never an id taken from the request.
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: latest, error: latestError } = await adminClient
    .from("dream_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) return json({ error: latestError.message }, 500);

  if (latest && Date.now() - new Date(latest.generated_at).getTime() < REGENERATE_AFTER_MS) {
    return json({ profile: latest, cached: true });
  }

  // Cheap head count first, so an account with too few dreams never pages through
  // anything or reaches Claude. The client has its own static fallback for this case.
  const { count: totalDreams, error: countError } = await adminClient
    .from("dreams")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (countError) return json({ error: countError.message }, 500);
  if ((totalDreams ?? 0) < MIN_DREAMS_FOR_PROFILE) {
    return json({ profile: null, reason: "not_enough_dreams" });
  }

  const dreams: DreamRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data: page, error: pageError } = await adminClient
      .from("dreams")
      .select("id, tags, is_lucid, dreamed_at, mood")
      .eq("user_id", user.id)
      .order("dreamed_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (pageError) return json({ error: pageError.message }, 500);
    dreams.push(...((page ?? []) as DreamRow[]));
    if (!page || page.length < PAGE_SIZE) break;
  }

  const [
    { data: sessions, error: sessionsError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    // Only completed sessions count as attempts: scheduled, cancelled and missed ones
    // never reached a technique, so they would skew the follow-through rate.
    adminClient.from("wbtb_sessions").select("technique, dream_id").eq("user_id", user.id).eq("status", "completed"),
    adminClient.from("profiles").select("current_streak, longest_streak, created_at").eq("id", user.id).single(),
  ]);
  if (sessionsError) return json({ error: sessionsError.message }, 500);
  if (profileError) return json({ error: profileError.message }, 500);

  let content: string;
  try {
    content = await callClaude(
      buildPrompt({
        dreams,
        sessions: (sessions ?? []) as SessionRow[],
        currentStreak: profile?.current_streak ?? 0,
        longestStreak: profile?.longest_streak ?? 0,
        accountCreatedAt: profile?.created_at ?? null,
      }),
    );
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Claude request failed" }, 502);
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("dream_profiles")
    .insert({ user_id: user.id, content })
    .select()
    .single();
  if (insertError) return json({ error: insertError.message }, 500);

  return json({ profile: inserted });
});
