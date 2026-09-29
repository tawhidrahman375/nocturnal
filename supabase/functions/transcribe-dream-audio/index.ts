import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
// Set with `supabase secrets set OPENAI_API_KEY=...`. Until it exists, this function reports
// "transcription unavailable" and the app falls back to typing the dream in by hand.
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const BUCKET = "voice-recordings";
const TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
// OpenAI's limit for a transcription upload.
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

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

  return json({ text });
});
