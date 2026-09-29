import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BUCKET = "voice-recordings";
// Storage removes up to this many files per request.
const REMOVE_BATCH_SIZE = 100;

// Called hourly by a pg_cron job. Deletes any voice recording older than 24 hours through
// the Storage API. It takes no input and only ever removes expired files, so it is safe to
// call at any time and by anyone (which is why it does not verify a JWT: the scheduler has
// no user session); the transcribe function already removes a recording as soon as it has
// been transcribed, so this is the backstop for the ones that never were.
Deno.serve(async () => {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: expired, error } = await adminClient.rpc("expired_voice_recordings");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const names = ((expired ?? []) as { name: string }[]).map((row) => row.name);
  let removed = 0;
  for (let i = 0; i < names.length; i += REMOVE_BATCH_SIZE) {
    const batch = names.slice(i, i + REMOVE_BATCH_SIZE);
    const { error: removeError } = await adminClient.storage.from(BUCKET).remove(batch);
    if (removeError) {
      return new Response(JSON.stringify({ error: removeError.message, removed }), { status: 500 });
    }
    removed += batch.length;
  }

  return new Response(JSON.stringify({ removed }), { headers: { "Content-Type": "application/json" } });
});
