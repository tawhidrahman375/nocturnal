import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ANTHROPIC_API_VERSION, CLAUDE_MODEL, NO_EM_DASH_RULE } from "../_shared/ai-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const REGENERATE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_SLEEP_NIGHTS = 5;
const MIN_DREAMS = 3;
// Dream-log rates further apart than this (as a share of nights) count as a real difference.
const RATE_DIFFERENCE_THRESHOLD = 0.15;

const SYSTEM_PROMPT =
  "You are a lucid dreaming coach analysing a user's sleep data alongside their dream journal. You have been given computed statistics, not raw data. Write 2 to 3 plain sentences that tell the user something specific and actionable about the relationship between their sleep and their lucid dreams. Do not repeat the numbers back at them verbatim. Do not use markdown. Do not use em dashes. If the data shows no clear pattern, say so honestly and suggest one thing they could try.";

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

// The numbers the app computed on the device from the last 30 days of sleep data and
// dreams (src/lib/sleepCorrelation.ts). Raw sleep data never reaches this function.
type Stats = {
  periodDays: number;
  nightsWithSleepData: number;
  dreamsInPeriod: number;
  lucidDreamsInPeriod: number;
  avgSleepHours: number;
  lucidNights: number;
  nonLucidNights: number;
  avgSleepBeforeLucid: number | null;
  avgSleepBeforeNonLucid: number | null;
  commonLucidWake: { startHour: number; count: number } | null;
  commonLucidDuration: { hours: number; count: number } | null;
  longerSleep: { nights: number; dreamLogRate: number } | null;
  shorterSleep: { nights: number; dreamLogRate: number } | null;
};

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const numOrNull = (v: unknown) => (v === null ? null : isNum(v) ? v : undefined);

function parseGroup(v: unknown) {
  if (v === null) return null;
  if (typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  return isNum(o.nights) && isNum(o.dreamLogRate) ? { nights: o.nights, dreamLogRate: o.dreamLogRate } : undefined;
}

// Validates the client's payload field by field. Returns null for anything malformed
// rather than trusting it into a prompt.
function parseStats(raw: unknown): Stats | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;

  const wakeRaw = o.commonLucidWake;
  const wake =
    wakeRaw === null
      ? null
      : typeof wakeRaw === "object" && wakeRaw !== null && isNum((wakeRaw as Record<string, unknown>).startHour) && isNum((wakeRaw as Record<string, unknown>).count)
        ? { startHour: (wakeRaw as { startHour: number }).startHour, count: (wakeRaw as { count: number }).count }
        : undefined;
  const durRaw = o.commonLucidDuration;
  const dur =
    durRaw === null
      ? null
      : typeof durRaw === "object" && durRaw !== null && isNum((durRaw as Record<string, unknown>).hours) && isNum((durRaw as Record<string, unknown>).count)
        ? { hours: (durRaw as { hours: number }).hours, count: (durRaw as { count: number }).count }
        : undefined;
  const avgLucid = numOrNull(o.avgSleepBeforeLucid);
  const avgNonLucid = numOrNull(o.avgSleepBeforeNonLucid);
  const longer = parseGroup(o.longerSleep);
  const shorter = parseGroup(o.shorterSleep);

  if (
    !isNum(o.periodDays) || !isNum(o.nightsWithSleepData) || !isNum(o.dreamsInPeriod) ||
    !isNum(o.lucidDreamsInPeriod) || !isNum(o.avgSleepHours) || !isNum(o.lucidNights) || !isNum(o.nonLucidNights) ||
    avgLucid === undefined || avgNonLucid === undefined || wake === undefined || dur === undefined ||
    longer === undefined || shorter === undefined
  ) {
    return null;
  }

  return {
    periodDays: o.periodDays,
    nightsWithSleepData: o.nightsWithSleepData,
    dreamsInPeriod: o.dreamsInPeriod,
    lucidDreamsInPeriod: o.lucidDreamsInPeriod,
    avgSleepHours: o.avgSleepHours,
    lucidNights: o.lucidNights,
    nonLucidNights: o.nonLucidNights,
    avgSleepBeforeLucid: avgLucid,
    avgSleepBeforeNonLucid: avgNonLucid,
    commonLucidWake: wake,
    commonLucidDuration: dur,
    longerSleep: longer,
    shorterSleep: shorter,
  };
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function hourLabel(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  return { n: h % 12 === 0 ? 12 : h % 12, suffix: h < 12 ? "AM" : "PM" };
}

// 6 -> "between 6 and 7 AM"; 11 -> "between 11 AM and 12 PM".
function formatHourRange(startHour: number) {
  const from = hourLabel(startHour);
  const to = hourLabel(startHour + 1);
  return from.suffix === to.suffix
    ? `between ${from.n} and ${to.n} ${to.suffix}`
    : `between ${from.n} ${from.suffix} and ${to.n} ${to.suffix}`;
}

const pct = (rate: number) => `${Math.round(rate * 100)}%`;

function buildPrompt(s: Stats) {
  const lucidLine =
    s.avgSleepBeforeLucid === null
      ? "Average sleep on nights before a lucid dream: no lucid dream nights with sleep data in this period"
      : `Average sleep on nights before a lucid dream: ${s.avgSleepBeforeLucid} hours (${plural(s.lucidNights, "night")})`;

  const nonLucidLine =
    s.avgSleepBeforeNonLucid === null
      ? "Average sleep on nights before a dream that was not lucid: no such nights in this period"
      : `Average sleep on nights before a dream that was not lucid: ${s.avgSleepBeforeNonLucid} hours (${plural(s.nonLucidNights, "night")})`;

  let difference = "";
  if (s.avgSleepBeforeLucid !== null && s.avgSleepBeforeNonLucid !== null) {
    const diff = Math.round((s.avgSleepBeforeLucid - s.avgSleepBeforeNonLucid) * 10) / 10;
    difference =
      diff === 0
        ? "\nLucid dream nights and other dream nights had the same average sleep."
        : `\nNights before lucid dreams were ${Math.abs(diff)} hours ${diff > 0 ? "longer" : "shorter"} on average than nights before other dreams.`;
  }

  const wakeLine = s.commonLucidWake
    ? `Most common wake time on lucid dream nights: ${formatHourRange(s.commonLucidWake.startHour)} (${s.commonLucidWake.count} of ${plural(s.lucidNights, "lucid night")})`
    : "Most common wake time on lucid dream nights: no lucid dream nights to measure";

  const durationLine = s.commonLucidDuration
    ? `Most common total sleep on lucid dream nights: ${s.commonLucidDuration.hours} hours (${s.commonLucidDuration.count} of ${plural(s.lucidNights, "lucid night")})`
    : "Most common total sleep on lucid dream nights: no lucid dream nights to measure";

  let longerLine = "Dream logging after longer versus shorter sleep: not enough nights to compare";
  if (s.longerSleep && s.shorterSleep) {
    const gap = s.longerSleep.dreamLogRate - s.shorterSleep.dreamLogRate;
    const verdict =
      gap >= RATE_DIFFERENCE_THRESHOLD
        ? "Dreams are logged more often after longer sleep."
        : gap <= -RATE_DIFFERENCE_THRESHOLD
          ? "Dreams are logged more often after shorter sleep."
          : "There is no clear difference in how often dreams are logged after longer or shorter sleep.";
    longerLine = `Dream logging after longer versus shorter sleep: a dream was logged after ${pct(s.longerSleep.dreamLogRate)} of the ${plural(s.longerSleep.nights, "night")} with above-average sleep, and after ${pct(s.shorterSleep.dreamLogRate)} of the ${plural(s.shorterSleep.nights, "night")} with average or below-average sleep. ${verdict}`;
  }

  return `Computed statistics for this user over the last ${s.periodDays} days:

Nights with sleep data: ${s.nightsWithSleepData}
Dreams logged: ${s.dreamsInPeriod} (${s.lucidDreamsInPeriod} lucid)
Average sleep per night: ${s.avgSleepHours} hours
${lucidLine}
${nonLucidLine}${difference}
${wakeLine}
${durationLine}
${longerLine}

Write the insight now. ${NO_EM_DASH_RULE}`;
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
      max_tokens: 260,
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

  let body: { stats?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }
  const stats = parseStats(body.stats);
  if (!stats) return json({ error: "stats is missing or malformed" }, 400);

  // The app already skips the call below these thresholds; this keeps the function from
  // spending a Claude call (or caching an insight) on too little data if it is called anyway.
  if (stats.nightsWithSleepData < MIN_SLEEP_NIGHTS || stats.dreamsInPeriod < MIN_DREAMS) {
    return json({ insight: null, reason: "not_enough_data" });
  }

  // Service-role client for the cache: sleep_correlations has no INSERT policy for regular
  // users; only this function writes to it. The user is always the one the JWT says it is.
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: latest, error: latestError } = await adminClient
    .from("sleep_correlations")
    .select("*")
    .eq("user_id", user.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) return json({ error: latestError.message }, 500);

  if (latest && Date.now() - new Date(latest.generated_at).getTime() < REGENERATE_AFTER_MS) {
    return json({ insight: latest, cached: true });
  }

  let content: string;
  try {
    content = await callClaude(buildPrompt(stats));
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Claude request failed" }, 502);
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("sleep_correlations")
    .insert({ user_id: user.id, content })
    .select()
    .single();
  if (insertError) return json({ error: insertError.message }, 500);

  return json({ insight: inserted });
});
