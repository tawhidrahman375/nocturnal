import { readRecordingBytes } from './dreamRecordings';
import { supabase } from './supabase';

const BUCKET = 'voice-recordings';

const CONTENT_TYPES: Record<string, string> = {
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  webm: 'audio/webm',
  wav: 'audio/wav',
};

export const TRANSCRIPTION_UNAVAILABLE = 'Transcription unavailable, type your dream instead.';

// `unavailable` covers everything that stops a transcript from arriving (no OpenAI key on the
// server yet, no network, the service failing). The sheet shows one calm line for all of
// them and still lets the user type the dream in.
export type TranscriptionResult = { text: string } | { unavailable: true };

// Uploads the recording to the private voice-recordings bucket (one folder per user), asks
// the transcribe-dream-audio Edge Function to transcribe it, and returns the text. The
// function deletes the upload once it has the transcript, and a scheduled job removes anything
// left after 24 hours.
export async function transcribeRecording(userId: string, audioName: string): Promise<TranscriptionResult> {
  try {
    const path = `${userId}/${audioName}`;
    const extension = audioName.split('.').pop()?.toLowerCase() ?? 'm4a';

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, await readRecordingBytes(audioName), { contentType: CONTENT_TYPES[extension] ?? 'audio/mp4' });
    // A previous attempt may already have uploaded this exact file; that is fine, transcribe it.
    if (uploadError && !/already exists|duplicate/i.test(uploadError.message)) return { unavailable: true };

    const { data, error } = await supabase.functions.invoke<{ text: string }>('transcribe-dream-audio', {
      method: 'POST',
      body: { path },
    });
    if (error || typeof data?.text !== 'string') return { unavailable: true };
    return { text: data.text };
  } catch {
    return { unavailable: true };
  }
}
