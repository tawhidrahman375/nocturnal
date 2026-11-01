import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ANTHROPIC_API_VERSION, CLAUDE_MODEL } from "../_shared/ai-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
// Set with `supabase secrets set OPENAI_API_KEY=...`. Until it exists, this function reports
// "transcription unavailable" and the app falls back to typing the dream in by hand.
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
// Used for the cleanup pass over the raw transcript. Without it the raw transcript is returned.
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const BUCKET = "voice-recordings";
const TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
// OpenAI's limit for a transcription upload.
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

// Spoken dreams are full of filler and restarts. The cleanup only removes noise; it must never
// add, reorder or reinterpret what the dreamer said, since this becomes their journal entry.
const CLEANUP_SYSTEM_PROMPT =
  "You clean up the raw speech-to-text transcript of someone describing a dream they just woke from. Remove filler words (um, uh, like, you know, I mean), false starts, repeated words or phrases, and incoherent fragments. Fix obvious punctuation and capitalisation. Keep the dreamer's own words, wording, first-person voice and the order of events. Never add details, never explain, never interpret, never summarise, and never change the meaning. If a fragment is unclear but might carry meaning, keep it. Reply with only the cleaned transcript, nothing else. Never use an em dash.";
// A transcript is at most a few minutes of speech; this only bounds a pathological upload.
const MAX_CLEANUP_CHARS = 12000;
// Cleaning only removes words, so a result much longer than the input means the model
// answered instead of cleaning, and the raw transcript is safer.
const MAX_CLEANUP_GROWTH = 1.2;

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

// Every failure the app should treat as "transcription unavailable" carries a stable
// `error` code plus a plain-English `message`, so the sheet can show one calm line and still
// let the user type the dream in.
function unavailable(error: string, message: string, status: number) {
  return json({ error, message }, status);
}

// Best effort: any failure, an empty result or a suspicious result returns the raw transcript,
// so the dreamer always gets their words back.
async function cleanTranscript(raw: string): Promise<string> {
  if (!ANTHROPIC_API_KEY || !raw) return raw;
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
        max_tokens: 4096,
        temperature: 0,
        system: CLEANUP_SYSTEM_PROMPT,
        messages: [{ role: "user", content: raw.slice(0, MAX_CLEANUP_CHARS) }],
      }),
    });
    if (!response.ok) {
      // Status only, never the body: it can echo the transcript.
      console.error(`Transcript cleanup failed with status ${response.status}`);
      return raw;
    }
    const data = await response.json();
    const block = Array.isArray(data?.content)
      ? data.content.find((b: { type?: string }) => b?.type === "text")
      : undefined;
    const cleaned = typeof block?.text === "string" ? block.text.trim() : "";
    if (!cleaned || cleaned.length > raw.length * MAX_CLEANUP_GROWTH || raw.length > MAX_CLEANUP_CHARS) return raw;
    return cleaned;
  } catch {
    return raw;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed", message: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "unauthorized", message: "Missing Authorization header" }, 401);

  // The user's own client, not the service role: the bucket's policies only let a user read
  // and delete files in their own folder, so this can never touch anyone else's audio.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "unauthorized", message: "Invalid or expired session" }, 401);

  let path: unknown;
  try {
    ({ path } = await req.json());
  } catch {
    return json({ error: "bad_request", message: "Body must be JSON" }, 400);
  }
  if (typeof path !== "string" || !path.startsWith(`${user.id}/`) || path.includes("..")) {
    return json({ error: "bad_request", message: "path must be a file in your own recordings folder" }, 400);
  }

  // Checked before downloading anything, so a missing key costs nothing.
  if (!OPENAI_API_KEY) {
    return unavailable("transcription_unavailable", "Transcription is not set up yet.", 503);
  }

  const { data: audio, error: downloadError } = await userClient.storage.from(BUCKET).download(path);
  if (downloadError || !audio) {
    return unavailable("recording_not_found", "The recording could not be found.", 404);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return unavailable("recording_too_large", "The recording is too large to transcribe.", 413);
  }

  const fileName = path.split("/").pop() ?? "dream.m4a";
  const form = new FormData();
  form.append("file", audio, fileName);
  form.append("model", TRANSCRIPTION_MODEL);
  form.append("response_format", "json");

  let text: string;
  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });
    if (!response.ok) {
      // Status only, never the body: it can echo request details and the audio is private.
      console.error(`OpenAI transcription failed with status ${response.status}`);
      return unavailable("transcription_failed", "Transcription failed. Try again later.", 502);
    }
    const data = await response.json();
    text = typeof data?.text === "string" ? data.text.trim() : "";
  } catch {
    return unavailable("transcription_failed", "Transcription failed. Try again later.", 502);
  }

  // The audio has done its job, so it does not need to sit in storage for the 24 hour
  // backstop (cleanup-voice-recordings). Best effort: a failure here is not the user's problem.
  await userClient.storage.from(BUCKET).remove([path]).catch(() => {});

  return json({ text: await cleanTranscript(text) });
});
