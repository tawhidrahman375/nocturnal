import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

// Voice recordings live in the app's document directory until the user has reviewed them:
// `dream-<epoch ms>.<ext>` for the audio, and a `dream-<epoch ms>.txt` next to it once it
// has been transcribed, so reopening the app never pays for the same transcription twice.
// The file name is the whole record: the epoch is when the dream was recorded.
//
// expo-file-system has no web implementation of Directory/File, and the recording flow is
// for the iOS and Android apps, so on web every call here is a no-op.
export const recordingsSupported = Platform.OS !== 'web';

export const MAX_RECORDING_SECONDS = 5 * 60;

export type PendingRecording = {
  // The audio file's name, e.g. "dream-1790000000000.m4a". Stable id for a recording.
  name: string;
  uri: string;
  recordedAt: Date;
  // Set once the audio has been transcribed; null until then.
  transcript: string | null;
};

// Lets the review sheet refresh when a recording is saved or removed from anywhere in the app.
const listeners = new Set<() => void>();
export function subscribeToRecordings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export const notifyRecordingsChanged = () => listeners.forEach((listener) => listener());

const AUDIO_FILE = /^dream-(\d+)\.(m4a|mp4|aac|3gp|webm|wav)$/;

function recordingsDirectory(): Directory {
  const directory = new Directory(Paths.document, 'dream-recordings');
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return directory;
}

const transcriptFileFor = (audioName: string) => new File(recordingsDirectory(), audioName.replace(/\.[^.]+$/, '.txt'));

// Moves a finished recording out of the recorder's cache into the document directory and
// returns it as a pending recording.
export function savePendingRecording(temporaryUri: string, recordedAt: Date = new Date()): PendingRecording {
  const extension = temporaryUri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'm4a';
  const source = new File(temporaryUri);
  const target = new File(recordingsDirectory(), `dream-${recordedAt.getTime()}.${extension}`);
  source.move(target);
  return { name: target.name, uri: target.uri, recordedAt, transcript: null };
}

// Newest first. A recording is pending until the user saves it to the journal or discards it.
export async function listPendingRecordings(): Promise<PendingRecording[]> {
  if (!recordingsSupported) return [];

  const pending: PendingRecording[] = [];
  for (const entry of recordingsDirectory().list()) {
    if (!(entry instanceof File)) continue;
    const match = AUDIO_FILE.exec(entry.name);
    if (!match) continue;

    const transcriptFile = transcriptFileFor(entry.name);
    pending.push({
      name: entry.name,
      uri: entry.uri,
      recordedAt: new Date(Number(match[1])),
      transcript: transcriptFile.exists ? await transcriptFile.text() : null,
    });
  }
  return pending.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
}

export function saveTranscript(audioName: string, transcript: string) {
  const file = transcriptFileFor(audioName);
  if (!file.exists) file.create();
  file.write(transcript);
}

export function deleteRecording(audioName: string) {
  if (!recordingsSupported) return;
  for (const file of [new File(recordingsDirectory(), audioName), transcriptFileFor(audioName)]) {
    if (file.exists) file.delete();
  }
}

// The audio as bytes, for uploading. Reads the whole file: a five minute m4a is a few MB.
export function readRecordingBytes(audioName: string): Promise<ArrayBuffer> {
  return new File(recordingsDirectory(), audioName).arrayBuffer();
}
