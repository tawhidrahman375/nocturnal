import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ANTHROPIC_API_VERSION, CLAUDE_MODEL, NO_EM_DASH_RULE } from "../_shared/ai-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const MIN_DREAMS_FOR_MANTRA = 1;
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
// signs, and the mantra prompt should reference the same ones the app already
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

function buildPrompt(input: { dreams: DreamRow[]; dreamSigns: string[] }) {
  const { dreams, dreamSigns } = input;

  const entries = dreams
    .slice(0, 5)
    .map((d, i) => {
      const lucidTag = d.is_lucid ? " [lucid]" : "";
      const tags = d.tags.length ? ` (tags: ${d.tags.join(", ")})` : "";
      return `${i + 1}. ${d.dreamed_at}${lucidTag} — "${d.title}"${tags}: ${truncate(d.content, MAX_CONTENT_CHARS)}`;
    })
    .join("\n");

  return `Here is a lucid dreaming journal user's recent data:

Recent journal entries (most recent first):
${entries || "(no entries)"}

Recurring dream signs (tags that show up more than once): ${dreamSigns.length ? dreamSigns.join(", ") : "none yet"}

Write one personalized MILD (Mnemonic Induction of Lucid Dreams) mantra for this user to read right before falling asleep tonight. MILD is a spoken intention repeated while picturing yourself back in a dream, so the mantra should read like a first-person "I will..." statement. Ground it in this specific data — reference their most recurring dream sign or a recent dream theme if one stands out, so it feels personal rather than generic. If the data is too thin for anything specific, fall back to the plain classic phrasing ("Next time I'm dreaming, I will remember I'm dreaming.") rather than inventing detail that isn't there. One or two sentences maximum. Warm and calm, never cheesy or over-the-top. No lists, no markdown, no quotation marks around the mantra itself. Only state things clearly supported by the data above, never invent dream content, people, or events that aren't there. ${NO_EM_DASH_RULE}`;
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
      max_tokens: 120,
      temperature: 0.5,
      system:
        `You write short, warm bedtime intention mantras for a lucid dreaming journal app. You only reference patterns actually present in the data you're given, you never fabricate dream content, and you never write more than two short sentences. ${NO_EM_DASH_RULE}`,
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
  // and writes the generated mantra, bypassing RLS (mild_mantras has no INSERT policy
  // for regular users; only this function is meant to write to it).
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: latest, error: latestError } = await adminClient
    .from("mild_mantras")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) return json({ error: latestError.message }, 500);

  if (latest && Date.now() - new Date(latest.created_at).getTime() < REGENERATE_AFTER_MS) {
    return json({ mantra: latest, cached: true });
  }

  const { data: dreams, error: dreamsError } = await adminClient
    .from("dreams")
    .select("title, content, tags, is_lucid, dreamed_at")
    .eq("user_id", user.id)
    .order("dreamed_at", { ascending: false })
    .limit(RECENT_DREAM_LIMIT);
  if (dreamsError) return json({ error: dreamsError.message }, 500);

  const dreamList = (dreams ?? []) as DreamRow[];
  if (dreamList.length < MIN_DREAMS_FOR_MANTRA) {
    return json({ mantra: null, reason: "not_enough_data" });
  }

  const dreamSigns = extractDreamSigns(dreamList);
  const prompt = buildPrompt({ dreams: dreamList, dreamSigns });

  let content: string;
  try {
    content = await callClaude(prompt);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Claude request failed" }, 502);
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("mild_mantras")
    .insert({ user_id: user.id, content, dream_count: dreamList.length })
    .select()
    .single();
  if (insertError) return json({ error: insertError.message }, 500);

  return json({ mantra: inserted });
});
