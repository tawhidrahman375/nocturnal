import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ANTHROPIC_API_VERSION, CLAUDE_MODEL } from "../_shared/ai-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// A dream entry is short prose; this only bounds a pathological paste, not normal use.
const MAX_CONTENT_CHARS = 4000;

// The full fixed list. Mirrors src/lib/dreamCategories.ts; Edge Functions deploy
// independently of the app, so it is duplicated here. `lucid` is never asked of Claude:
// it is assigned in code when the user marked the dream lucid.
const CATEGORIES = [
  "lucid",
  "nightmare",
  "adventure",
  "emotional",
  "mundane",
  "surreal",
  "recurring",
  "sleep paralysis",
  "astral projection",
  "unknown",
] as const;
type Category = (typeof CATEGORIES)[number];

const SYSTEM_PROMPT =
  "You are classifying a dream journal entry into exactly one category. Reply with a single word or short phrase only, nothing else. The output must be exactly one of: nightmare, adventure, emotional, mundane, surreal, recurring, sleep paralysis, astral projection, unknown. No punctuation, no explanation, no other text.";

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

// Strip whitespace, lowercase, and accept only an exact match from the fixed list.
// Anything else, including "lucid" (which Claude is never asked for) and any
// multi-category answer, falls back to "unknown".
function normaliseCategory(raw: string): Category {
  const value = raw.trim().toLowerCase();
  return (CATEGORIES as readonly string[]).includes(value) && value !== "lucid" ? (value as Category) : "unknown";
}

async function classify(content: string): Promise<Category> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": ANTHROPIC_API_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 10,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: content.slice(0, MAX_CONTENT_CHARS) }],
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
  return normaliseCategory(typeof text === "string" ? text : "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  // The user's own client, not the service role: `dreams` has an owner-only UPDATE
  // policy, so the write below can only ever touch a dream the caller owns.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Invalid or expired session" }, 401);

  let body: { dream_id?: unknown; content?: unknown; is_lucid?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }
  const { dream_id: dreamId, content, is_lucid: isLucid } = body;
  if (typeof dreamId !== "string" || !dreamId) return json({ error: "dream_id is required" }, 400);
  if (typeof content !== "string") return json({ error: "content must be a string" }, 400);
  if (typeof isLucid !== "boolean") return json({ error: "is_lucid must be a boolean" }, 400);

  let category: Category;
  if (isLucid) {
    // A dream the user marked lucid is `lucid`, full stop. No Claude call.
    category = "lucid";
  } else if (!content.trim()) {
    // Title-only entry: nothing to read, so nothing worth a Claude call.
    category = "unknown";
  } else {
    if (!ANTHROPIC_API_KEY) return json({ error: "Server is missing ANTHROPIC_API_KEY" }, 500);
    try {
      category = await classify(content);
    } catch (e) {
      // Leave the column null; the app shows no badge and that is fine.
      return json({ error: e instanceof Error ? e.message : "Claude request failed" }, 502);
    }
  }

  const { data: updated, error: updateError } = await userClient
    .from("dreams")
    .update({ category })
    .eq("id", dreamId)
    .select("id")
    .maybeSingle();
  if (updateError) return json({ error: updateError.message }, 500);
  if (!updated) return json({ error: "Dream not found" }, 404);

  return json({ category });
});
