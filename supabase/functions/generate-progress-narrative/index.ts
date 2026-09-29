import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ANTHROPIC_API_VERSION, CLAUDE_MODEL, NO_EM_DASH_RULE } from "../_shared/ai-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DREAM_SIGNS = 8;

type Period = "weekly" | "monthly";
type PeriodRequest = Period | "both";
type TechniqueKey = "mild" | "wild" | "ssild";
const TECHNIQUES: TechniqueKey[] = ["mild", "wild", "ssild"];

const PERIOD_CONFIG: Record<Period, { windowDays: number; regenerateAfterMs: number; maxTokens: number }> = {
  weekly: { windowDays: 7, regenerateAfterMs: DAY_MS, maxTokens: 220 },
  monthly: { windowDays: 30, regenerateAfterMs: 7 * DAY_MS, maxTokens: 320 },
};

// Two separate prompts on purpose (one Haiku call per period, never combined). Wording
// follows the product spec, with its em dash swapped for a period since these prompts
// generate user-facing text and the house rule (NO_EM_DASH_RULE) is appended anyway.
const SYSTEM_PROMPTS: Record<Period, string> = {
  weekly:
    "You are a lucid dreaming coach writing a short weekly summary for a user. You will be given their dream data from the last 7 days. Write 2-3 plain sentences. No markdown. No em dashes. No bullet points. Be specific and reference their actual numbers and techniques. Be encouraging but honest. If they had zero lucid dreams, acknowledge it without being discouraging. If they had no dreams logged, say there is not enough data this week.",
  monthly:
    "You are a lucid dreaming coach writing a monthly progress summary for a user. You will be given their dream data from the last 30 days. Write 3-4 plain sentences. No markdown. No em dashes. No bullet points. Be specific and reference their actual numbers, techniques tried, and any patterns. Be honest about what is working and what is not. If they had zero lucid dreams this month, say so plainly and suggest one concrete change. If they have fewer than 3 dreams logged this month, say there is not enough data yet.",
};

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

type DreamRow = { id: string; tags: string[]; is_lucid: boolean; dreamed_at: string };
type SessionRow = { technique: string; dream_id: string | null; sleep_at: string };
type NarrativeRow = { id: string; user_id: string; period: string; content: string; generated_at: string };
type PeriodResult = { narrative: NarrativeRow; cached: boolean } | { narrative: null; error: string };

type Stats = {
  dreamCount: number;
  lucidCount: number;
  dreamSigns: { name: string; count: number }[];
  sessionCount: number;
  lucidSessionCount: number;
  techniqueStats: Record<TechniqueKey, { attempts: number; lucidCount: number }>;
};

// Mirrors src/lib/dreamSigns.ts (recurring journal tags are the user's dream signs),
// with counts kept so the prompt can say how often each showed up. Duplicated across
// the generate-* functions because Edge Functions deploy independently of each other.
function extractDreamSigns(dreams: Pick<DreamRow, "tags">[]): { name: string; count: number }[] {
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
    .map((entry) => ({ name: entry.display, count: entry.count }));
}

// Dreams store `dreamed_at` as a "YYYY-MM-DD" calendar day (see src/lib/streaks.ts), so
// the window is expressed in days: today plus the (windowDays - 1) days before it.
function windowStartDate(windowDays: number): string {
  return new Date(Date.now() - (windowDays - 1) * DAY_MS).toISOString().slice(0, 10);
}

function computeStats(
  windowDays: number,
  dreams: DreamRow[],
  sessions: SessionRow[],
  lucidDreamIds: Set<string>,
): Stats {
  const startDate = windowStartDate(windowDays);
  const startTime = new Date(`${startDate}T00:00:00Z`).getTime();

  const periodDreams = dreams.filter((d) => d.dreamed_at >= startDate);
  const periodSessions = sessions.filter((s) => new Date(s.sleep_at).getTime() >= startTime);

  const techniqueStats: Stats["techniqueStats"] = {
    mild: { attempts: 0, lucidCount: 0 },
    wild: { attempts: 0, lucidCount: 0 },
    ssild: { attempts: 0, lucidCount: 0 },
  };
  let lucidSessionCount = 0;
  for (const session of periodSessions) {
    const key = session.technique as TechniqueKey;
    if (!(key in techniqueStats)) continue;
    techniqueStats[key].attempts += 1;
    if (session.dream_id && lucidDreamIds.has(session.dream_id)) {
      techniqueStats[key].lucidCount += 1;
      lucidSessionCount += 1;
    }
  }

  return {
    dreamCount: periodDreams.length,
    lucidCount: periodDreams.filter((d) => d.is_lucid).length,
    dreamSigns: extractDreamSigns(periodDreams),
    sessionCount: periodSessions.length,
    lucidSessionCount,
    techniqueStats,
  };
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function buildPrompt(input: {
  period: Period;
  stats: Stats;
  currentStreak: number;
  longestStreak: number;
  totalDreams: number;
  totalLucid: number;
}) {
  const { period, stats, currentStreak, longestStreak, totalDreams, totalLucid } = input;
  const windowLabel = `the last ${PERIOD_CONFIG[period].windowDays} days`;

  const usedTechniques = TECHNIQUES.filter((t) => stats.techniqueStats[t].attempts > 0).map((t) => {
    const s = stats.techniqueStats[t];
    return `${t.toUpperCase()}: ${plural(s.attempts, "session")}, ${s.lucidCount} led to a lucid dream`;
  });

  const signs = stats.dreamSigns.map((s) => `${s.name} (${plural(s.count, "time")})`);

  return `This user's lucid dreaming data for ${windowLabel}:

Dreams logged: ${stats.dreamCount}
Lucid dreams: ${stats.lucidCount}
Dream signs mentioned: ${signs.length ? signs.join(", ") : "none"}
Wake Back to Bed sessions completed: ${stats.sessionCount}
Techniques used: ${usedTechniques.length ? usedTechniques.join("; ") : "none"}
Sessions that led to a lucid dream: ${stats.lucidSessionCount}

Current journaling streak: ${currentStreak} day(s)
Longest streak: ${longestStreak} day(s)
All time: ${totalDreams} dream(s) logged, ${totalLucid} lucid

Write the summary now. ${NO_EM_DASH_RULE}`;
}

async function callClaude(period: Period, prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": ANTHROPIC_API_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: PERIOD_CONFIG[period].maxTokens,
      temperature: 0.5,
      system: `${SYSTEM_PROMPTS[period]} ${NO_EM_DASH_RULE}`,
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

  let body: { user_id?: unknown; period?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // Empty or non-JSON body: fall through to the defaults (period "both").
  }

  // The user is always the one the JWT says it is. A `user_id` in the body is accepted
  // for callers that send it, but it can never point at someone else's data, since this
  // function reads and writes with the service role.
  if (body.user_id !== undefined && body.user_id !== user.id) {
    return json({ error: "user_id does not match the signed-in user" }, 403);
  }

  const requested = body.period ?? "both";
  if (requested !== "weekly" && requested !== "monthly" && requested !== "both") {
    return json({ error: 'period must be "weekly", "monthly", or "both"' }, 400);
  }
  const periods: Period[] = (requested as PeriodRequest) === "both" ? ["weekly", "monthly"] : [requested as Period];

  // Service-role client for everything after auth: reads the user's own data and writes
  // the narrative, bypassing RLS (progress_narratives has no INSERT policy for regular
  // users; only this function is meant to write to it).
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const results: Partial<Record<Period, PeriodResult>> = {};
  const stalePeriods: Period[] = [];

  await Promise.all(
    periods.map(async (period) => {
      const { data: latest, error } = await adminClient
        .from("progress_narratives")
        .select("*")
        .eq("user_id", user.id)
        .eq("period", period)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        results[period] = { narrative: null, error: error.message };
        return;
      }
      const row = latest as NarrativeRow | null;
      if (row && Date.now() - new Date(row.generated_at).getTime() < PERIOD_CONFIG[period].regenerateAfterMs) {
        results[period] = { narrative: row, cached: true };
        return;
      }
      stalePeriods.push(period);
    }),
  );

  if (stalePeriods.length === 0) return json(results);

  // Fetched once and shared: the 30-day window covers the 7-day one, so each period's
  // numbers are just a filter over the same rows.
  const longestWindowDays = Math.max(...stalePeriods.map((p) => PERIOD_CONFIG[p].windowDays));
  const sessionsSince = new Date(`${windowStartDate(longestWindowDays)}T00:00:00Z`).toISOString();

  const [
    { data: dreams, error: dreamsError },
    { data: sessions, error: sessionsError },
    { data: profile, error: profileError },
    { count: totalDreams, error: totalError },
    { count: totalLucid, error: totalLucidError },
  ] = await Promise.all([
    adminClient
      .from("dreams")
      .select("id, tags, is_lucid, dreamed_at")
      .eq("user_id", user.id)
      .gte("dreamed_at", windowStartDate(longestWindowDays)),
    // Only completed sessions count as attempts: scheduled, cancelled and missed ones
    // never reached a technique, so they would skew the follow-through numbers.
    adminClient
      .from("wbtb_sessions")
      .select("technique, dream_id, sleep_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("sleep_at", sessionsSince),
    adminClient.from("profiles").select("current_streak, longest_streak").eq("id", user.id).single(),
    adminClient.from("dreams").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    adminClient
      .from("dreams")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_lucid", true),
  ]);

  const fetchError = dreamsError ?? sessionsError ?? profileError ?? totalError ?? totalLucidError;
  if (fetchError) {
    for (const period of stalePeriods) results[period] = { narrative: null, error: fetchError.message };
    return json(results);
  }

  const dreamList = (dreams ?? []) as DreamRow[];
  const sessionList = (sessions ?? []) as SessionRow[];

  // A session's dream_id may point at an entry outside the window, so resolve which of
  // the linked dreams are lucid by id instead of relying on the window fetch above.
  const linkedDreamIds = [...new Set(sessionList.map((s) => s.dream_id).filter((id): id is string => !!id))];
  const lucidDreamIds = new Set<string>();
  if (linkedDreamIds.length > 0) {
    const { data: linked, error: linkedError } = await adminClient
      .from("dreams")
      .select("id")
      .in("id", linkedDreamIds)
      .eq("is_lucid", true);
    if (linkedError) {
      for (const period of stalePeriods) results[period] = { narrative: null, error: linkedError.message };
      return json(results);
    }
    for (const row of linked ?? []) lucidDreamIds.add(row.id as string);
  }

  // One Claude call per period, in parallel. A failure in one leaves the other intact.
  await Promise.all(
    stalePeriods.map(async (period) => {
      try {
        const prompt = buildPrompt({
          period,
          stats: computeStats(PERIOD_CONFIG[period].windowDays, dreamList, sessionList, lucidDreamIds),
          currentStreak: profile?.current_streak ?? 0,
          longestStreak: profile?.longest_streak ?? 0,
          totalDreams: totalDreams ?? 0,
          totalLucid: totalLucid ?? 0,
        });
        const content = await callClaude(period, prompt);

        const { data: inserted, error: insertError } = await adminClient
          .from("progress_narratives")
          .insert({ user_id: user.id, period, content })
          .select()
          .single();
        if (insertError) throw new Error(insertError.message);

        results[period] = { narrative: inserted as NarrativeRow, cached: false };
      } catch (e) {
        results[period] = { narrative: null, error: e instanceof Error ? e.message : "Claude request failed" };
      }
    }),
  );

  return json(results);
});
