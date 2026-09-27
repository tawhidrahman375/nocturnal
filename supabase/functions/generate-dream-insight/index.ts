import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ANTHROPIC_API_VERSION, CLAUDE_MODEL, NO_EM_DASH_RULE } from "../_shared/ai-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const MIN_DREAMS_FOR_INSIGHT = 3;
const RECENT_DREAM_LIMIT = 20;
const REGENERATE_AFTER_MS = 24 * 60 * 60 * 1000;
const MAX_DREAM_SIGNS = 8;
const MAX_CONTENT_CHARS = 320;

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

// Mirrors src/lib/dreamSigns.ts — recurring journal tags are the user's own dream
// signs, and the insight prompt should reference the same ones the app already
// surfaces on the Reality Checks screen, not a separately computed set.
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

function buildPrompt(input: {
  dreams: DreamRow[];
  dreamSigns: string[];
  currentStreak: number;
  longestStreak: number;
}) {
  const { dreams, dreamSigns, currentStreak, longestStreak } = input;
  const lucidCount = dreams.filter((d) => d.is_lucid).length;

  const entries = dreams
    .map((d, i) => {
      const lucidTag = d.is_lucid ? " [lucid]" : "";
      const tags = d.tags.length ? ` (tags: ${d.tags.join(", ")})` : "";
      return `${i + 1}. ${d.dreamed_at}${lucidTag} — "${d.title}"${tags}: ${truncate(d.content, MAX_CONTENT_CHARS)}`;
    })
    .join("\n");

  return `Here is a lucid dreaming journal user's recent data:

Journal entries (most recent first, ${dreams.length} total, ${lucidCount} marked lucid):
${entries || "(no entries)"}

Recurring dream signs (tags that show up more than once): ${dreamSigns.length ? dreamSigns.join(", ") : "none yet"}
Current journaling streak: ${currentStreak} day(s)
Longest streak: ${longestStreak} day(s)

Write one short insight (2-3 sentences, no lists, no markdown, no headings) that narrates a real pattern in this specific data — for example a connection between a recurring dream sign and lucidity, a theme across entries, or something notable about their recall or streak habit. Speak directly to the user as "you". Only state things clearly supported by the data above — never invent details, people, or events that aren't there. If the data is too thin for a specific pattern, give a plain, honest observation about what's there instead (e.g. their lucid rate or most common dream sign). Do not use exclamation points more than once. Do not give sleep, medical, or psychological advice. ${NO_EM_DASH_RULE}`;
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
      max_tokens: 220,
      temperature: 0.4,
      system:
        `You are a quiet, observant narrator inside a lucid dreaming journal app. You only describe patterns that are actually present in the data you're given. You never fabricate dream content, never diagnose, and never write more than a short paragraph. ${NO_EM_DASH_RULE}`,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Claude API returned no text content");
  }
  return text.trim();
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
  // and writes the generated insight, bypassing RLS (dream_insights has no INSERT
  // policy for regular users; only this function is meant to write to it).
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: latest, error: latestError } = await adminClient
    .from("dream_insights")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) return json({ error: latestError.message }, 500);

  if (latest && Date.now() - new Date(latest.created_at).getTime() < REGENERATE_AFTER_MS) {
    return json({ insight: latest, isFirst: false, cached: true });
  }

  const [{ data: dreams, error: dreamsError }, { data: profile, error: profileError }] = await Promise.all([
    adminClient
      .from("dreams")
      .select("title, content, tags, is_lucid, dreamed_at")
      .eq("user_id", user.id)
      .order("dreamed_at", { ascending: false })
      .limit(RECENT_DREAM_LIMIT),
    adminClient.from("profiles").select("current_streak, longest_streak").eq("id", user.id).single(),
  ]);
  if (dreamsError) return json({ error: dreamsError.message }, 500);
  if (profileError) return json({ error: profileError.message }, 500);

  const dreamList = (dreams ?? []) as DreamRow[];
  if (dreamList.length < MIN_DREAMS_FOR_INSIGHT) {
    return json({ insight: null, isFirst: false, reason: "not_enough_data" });
  }

  const dreamSigns = extractDreamSigns(dreamList);
  const prompt = buildPrompt({
    dreams: dreamList,
    dreamSigns,
    currentStreak: profile?.current_streak ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
  });

  let content: string;
  try {
    content = await callClaude(prompt);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Claude request failed" }, 502);
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("dream_insights")
    .insert({ user_id: user.id, content, dream_count: dreamList.length })
    .select()
    .single();
  if (insertError) return json({ error: insertError.message }, 500);

  return json({ insight: inserted, isFirst: latest === null });
});
