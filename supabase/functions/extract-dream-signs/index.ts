import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ANTHROPIC_API_VERSION, CLAUDE_MODEL } from "../_shared/ai-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const RECENT_DREAM_LIMIT = 14;
const MAX_DREAM_SIGNS = 8;
const MAX_SIGN_CHARS = 40;
const MAX_CONTENT_CHARS = 1200;

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

const SYSTEM_PROMPT =
  `You find a dreamer's recurring dream signs from their journal. A dream sign is a specific person, place, object, creature, event or oddity that shows up in more than one of the entries and could tip them off that they are dreaming. Only return signs that genuinely recur across at least two different entries, judged from what the entries actually say. Use short concrete noun phrases of one to three words, such as "my old school" or "flying" or "black cat". Ignore generic words and feelings. Order by how often they recur, most first, and return at most ${MAX_DREAM_SIGNS}. Reply with only a JSON array of strings, for example ["black cat","my old school"]. If nothing recurs, reply []. No other text. Never use an em dash.`;

type DreamRow = { title: string; content: string; dreamed_at: string };

function buildPrompt(dreams: DreamRow[]) {
  return dreams
    .map((d, i) => {
      const text = d.content.trim().slice(0, MAX_CONTENT_CHARS);
      return `Entry ${i + 1} (${d.dreamed_at}): ${d.title.trim()}${text ? `. ${text}` : ""}`;
    })
    .join("\n\n");
}

// Claude is asked for a bare JSON array; this also tolerates a code fence around it. Anything
// that does not parse to an array of strings is treated as a failure, never as "no signs".
function parseSigns(raw: string): string[] | null {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return null;
    const seen = new Set<string>();
    const signs: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      const sign = item.trim();
      const key = sign.toLowerCase();
      if (!sign || sign.length > MAX_SIGN_CHARS || seen.has(key)) continue;
      seen.add(key);
      signs.push(sign);
    }
    return signs.slice(0, MAX_DREAM_SIGNS);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  // The user's own client, so row-level security limits this to their own journal.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Invalid or expired session" }, 401);

  const { data: dreams, error: dreamsError } = await userClient
    .from("dreams")
    .select("title, content, dreamed_at")
    .eq("user_id", user.id)
    .order("dreamed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(RECENT_DREAM_LIMIT);
  if (dreamsError) return json({ error: dreamsError.message }, 500);

  // Recurrence needs at least two entries; no Claude call otherwise.
  if (!dreams || dreams.length < 2) return json({ dream_signs: [] });

  if (!ANTHROPIC_API_KEY) return json({ error: "Server is missing ANTHROPIC_API_KEY" }, 500);

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_API_VERSION,
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildPrompt(dreams as DreamRow[]) }],
      }),
    });
  } catch {
    return json({ error: "Claude request failed" }, 502);
  }
  if (!response.ok) {
    console.error(`Claude API error ${response.status}`);
    return json({ error: "Claude request failed" }, 502);
  }

  const data = await response.json();
  const block = Array.isArray(data?.content)
    ? data.content.find((b: { type?: string }) => b?.type === "text")
    : undefined;
  const signs = parseSigns(typeof block?.text === "string" ? block.text : "");
  if (!signs) return json({ error: "Could not read dream signs from the response" }, 502);

  return json({ dream_signs: signs });
});
