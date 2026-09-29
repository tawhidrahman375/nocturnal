import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pause, Play, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { SkeletonLines } from './SkeletonLines';
import { useAuth } from '../hooks/useAuth';
import {
  deleteRecording,
  listPendingRecordings,
  notifyRecordingsChanged,
  PendingRecording,
  saveTranscript,
  subscribeToRecordings,
} from '../lib/dreamRecordings';
import { TRANSCRIPTION_UNAVAILABLE, transcribeRecording } from '../lib/voiceTranscription';
import { formatTime } from '../lib/wbtb';
import { navigationRef } from '../navigation/navigationRef';
import { colors, radius, spacing, typography } from '../theme';

const NO_SPEECH = 'No speech was picked up. Type your dream instead.';

const formatDuration = (totalSeconds: number) => {
  const whole = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

// A simple play/pause pill for the recording. Mounted only while the sheet is open, so
// closing the sheet stops playback.
function PlaybackButton({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const toggle = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    // A finished clip starts over from the top.
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.05)) {
      await player.seekTo(0);
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
    player.play();
  };

  const Icon = status.playing ? Pause : Play;
  return (
    <Pressable
      onPress={toggle}
      disabled={!status.isLoaded}
      accessibilityRole="button"
      accessibilityLabel={status.playing ? 'Pause recording' : 'Play recording'}
      style={[styles.playButton, !status.isLoaded && styles.playButtonDisabled]}
    >
      <Icon color={colors.accent.primary} size={18} strokeWidth={2} />
      <Text style={[typography.bodyMedium, styles.playLabel]}>{status.playing ? 'Pause' : 'Play'}</Text>
      {status.isLoaded ? (
        <Text style={[typography.label, styles.playTime]}>
          {formatDuration(status.playing ? status.currentTime : status.duration)}
        </Text>
      ) : null}
    </Pressable>
  );
}

// Slides up on its own whenever there is a recording that has not been saved to the journal
// or discarded: on launch, on returning to the app, and right after a recording is made. It
// transcribes the audio (unless that is unavailable, in which case the user just types the
// dream), and hands the transcript to the new-entry sheet on the Journal.
export function PendingRecordingSheet() {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<PendingRecording[]>([]);
  // Recordings the user closed the sheet on. They stay pending and come back next launch.
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [routeName, setRouteName] = useState<string | undefined>(() => navigationRef.getCurrentRoute()?.name);
  const attempted = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    setRecordings(await listPendingRecordings());
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      const list = await listPendingRecordings();
      if (!ignore) setRecordings(list);
    };
    load();
    const unsubscribe = subscribeToRecordings(load);
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') load();
    });
    return () => {
      ignore = true;
      unsubscribe();
      appState.remove();
    };
  }, []);

  // The recording screen owns the display while it is open; the sheet returns after it.
  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', () => setRouteName(navigationRef.getCurrentRoute()?.name));
    return unsubscribe;
  }, []);

  const current = recordings.find((r) => !dismissed.includes(r.name));
  const visible = !!current && routeName !== 'RecordDream';
  const name = current?.name;
  const transcript = current?.transcript ?? null;

  // Only transcribes once the sheet is actually in front of the user, and only once per
  // recording per launch.
  useEffect(() => {
    if (!visible || !name || !user || transcript !== null || attempted.current.has(name)) return;
    attempted.current.add(name);
    (async () => {
      const result = await transcribeRecording(user.id, name);
      if ('text' in result) {
        saveTranscript(name, result.text);
        await refresh();
      } else {
        setUnavailable((list) => [...list, name]);
      }
    })();
  }, [visible, name, user, transcript, refresh]);

  if (!current) return null;

  const isTranscribing = transcript === null && !unavailable.includes(current.name);

  const close = () => setDismissed((list) => [...list, current.name]);

  const discard = () => {
    deleteRecording(current.name);
    notifyRecordingsChanged();
  };

  // Hands the transcript (or an empty entry, when there is none) to the Journal's new-entry
  // sheet. The recording stays until that entry is actually saved.
  const saveToJournal = () => {
    close();
    navigationRef.navigate('Tabs', {
      screen: 'Journal',
      params: { newDream: { key: current.name, content: transcript ?? '', recordingName: current.name } },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[typography.heading, styles.headerTitle]}>
              Dream recorded at {formatTime(current.recordedAt)}
            </Text>
            <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <X color={colors.text.secondary} size={22} strokeWidth={1.5} />
            </Pressable>
          </View>

          <PlaybackButton uri={current.uri} />

          <View style={styles.transcript}>
            {isTranscribing ? (
              <SkeletonLines accessibilityLabel="Transcribing your dream" />
            ) : transcript === null ? (
              <Text style={[typography.body, styles.mutedText]}>{TRANSCRIPTION_UNAVAILABLE}</Text>
            ) : transcript === '' ? (
              <Text style={[typography.body, styles.mutedText]}>{NO_SPEECH}</Text>
            ) : (
              <ScrollView style={styles.transcriptScroll} showsVerticalScrollIndicator={false}>
                <Text style={[typography.body, styles.transcriptText]}>{transcript}</Text>
              </ScrollView>
            )}
          </View>

          <View style={styles.actions}>
            <Button label="Save to journal" onPress={saveToJournal} disabled={isTranscribing} style={styles.action} />
            <Button label="Discard" onPress={discard} variant="secondary" style={styles.action} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 12, 0.6)',
    justifyContent: 'flex-end',
  },
  // The same sheet chrome as NewDreamSheet.
  sheet: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerTitle: {
    color: colors.text.primary,
    flex: 1,
  },
  playButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent.primaryMuted,
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  playLabel: {
    color: colors.accent.primary,
  },
  playTime: {
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  transcript: {
    minHeight: 72,
  },
  transcriptScroll: {
    maxHeight: 180,
  },
  transcriptText: {
    color: colors.text.primary,
  },
  mutedText: {
    color: colors.text.tertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});
