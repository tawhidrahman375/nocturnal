import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ANTHROPIC_API_VERSION, CLAUDE_MODEL, NO_EM_DASH_RULE } from "../_shared/ai-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const REGENERATE_AFTER_MS = 24 * 60 * 60 * 1000;
const MAX_DREAM_SIGNS = 8;
const RECENT_SIGN_DREAMS = 10;
// Fetched beyond RECENT_SIGN_DREAMS too, since a wbtb_sessions.dream_id can point at an
// older entry than the most recent handful used for dream-sign extraction.
const DREAM_FETCH_LIMIT = 50;

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

type TechniqueKey = "mild" | "wild" | "ssild";
const TECHNIQUES: TechniqueKey[] = ["mild", "wild", "ssild"];

type SessionRow = { technique: string; dream_id: string | null };
type DreamRow = { id: string; tags: string[]; is_lucid: boolean };

// Mirrors src/lib/dreamSigns.ts — same recurring-tag logic duplicated across every
// generate-* function, since Edge Functions deploy independently of each other.
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

function buildPrompt(input: {
  techniqueStats: Record<TechniqueKey, { attempts: number; lucidCount: number }>;
  currentStreak: number;
  dreamSigns: string[];
}) {
  const { techniqueStats, currentStreak, dreamSigns } = input;

  const lines = TECHNIQUES.map((t) => {
    const s = techniqueStats[t];
    return `${t.toUpperCase()}: attempted ${s.attempts} time(s) via Wake Back to Bed, led to a lucid dream ${s.lucidCount} time(s).`;
  }).join("\n");

  return `This user's lucid dreaming technique history:
${lines}

Current journaling streak: ${currentStreak} day(s).
Recent dream signs (recurring tags): ${dreamSigns.length ? dreamSigns.join(", ") : "none yet"}.

Based on this user's technique history and results, write one short paragraph recommending which technique they should focus on and a specific reason why based on their data. Warm, direct, no fluff. No em dashes. No markdown. Plain sentences only. ${NO_EM_DASH_RULE}`;
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

  // Service-role client for everything after auth — reads across the user's own data
  // and writes the recommendation, bypassing RLS (technique_recommendations has no
  // INSERT policy for regular users; only this function is meant to write to it).
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: latest, error: latestError } = await adminClient
    .from("technique_recommendations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) return json({ error: latestError.message }, 500);

  if (latest && Date.now() - new Date(latest.created_at).getTime() < REGENERATE_AFTER_MS) {
    return json({ recommendation: latest, cached: true });
  }

  const [
    { data: sessions, error: sessionsError },
    { data: dreams, error: dreamsError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    adminClient.from("wbtb_sessions").select("technique, dream_id").eq("user_id", user.id),
    adminClient
      .from("dreams")
      .select("id, tags, is_lucid")
      .eq("user_id", user.id)
      .order("dreamed_at", { ascending: false })
      .limit(DREAM_FETCH_LIMIT),
    adminClient.from("profiles").select("current_streak").eq("id", user.id).single(),
  ]);
  if (sessionsError) return json({ error: sessionsError.message }, 500);
  if (dreamsError) return json({ error: dreamsError.message }, 500);
  if (profileError) return json({ error: profileError.message }, 500);

  const sessionList = (sessions ?? []) as SessionRow[];
  if (sessionList.length === 0) {
    // No technique history at all — a static client-side fallback covers this (see
    // src/lib/techniqueRecommendation.ts), so no Claude call and nothing to cache.
    return json({ recommendation: null, reason: "no_history" });
  }

  const dreamList = (dreams ?? []) as DreamRow[];
  const dreamById = new Map(dreamList.map((d) => [d.id, d]));

  const techniqueStats: Record<TechniqueKey, { attempts: number; lucidCount: number }> = {
    mild: { attempts: 0, lucidCount: 0 },
    wild: { attempts: 0, lucidCount: 0 },
    ssild: { attempts: 0, lucidCount: 0 },
  };
  for (const session of sessionList) {
    const key = session.technique as TechniqueKey;
    if (!(key in techniqueStats)) continue;
    techniqueStats[key].attempts += 1;
    const dream = session.dream_id ? dreamById.get(session.dream_id) : undefined;
    if (dream?.is_lucid) techniqueStats[key].lucidCount += 1;
  }

  const dreamSigns = extractDreamSigns(dreamList.slice(0, RECENT_SIGN_DREAMS));

  const prompt = buildPrompt({
    techniqueStats,
    currentStreak: profile?.current_streak ?? 0,
    dreamSigns,
  });

  let content: string;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        temperature: 0.5,
        system:
          `You write short, direct lucid dreaming coaching recommendations. You only reference patterns actually present in the data you're given, and you never fabricate technique results. ${NO_EM_DASH_RULE}`,
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
    content = text.trim();
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Claude request failed" }, 502);
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("technique_recommendations")
    .insert({ user_id: user.id, content, attempt_count: sessionList.length })
    .select()
    .single();
  if (insertError) return json({ error: insertError.message }, 500);

  return json({ recommendation: inserted });
});
