import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { Mic, Square, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { NightSky } from '../../components/NightSky';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { track } from '../../lib/analytics';
import { MAX_RECORDING_SECONDS, notifyRecordingsChanged, savePendingRecording } from '../../lib/dreamRecordings';
import { EASE_AMBIENT } from '../../lib/motion';
import { AppStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'RecordDream'>;
type Phase = 'idle' | 'recording' | 'saving';

const MIC_SIZE = 144;
// "Saving..." is only ever a beat, but long enough to read as a state rather than a flicker.
const SAVING_MIN_MS = 600;
// One gentle breath per second: 1.0 down to 0.95 and back, half a second each way.
const PULSE_HALF_CYCLE_MS = 500;

const formatTimer = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// A minimal, standalone recording screen: this is where the Android notification and the
// iOS Journal button both land. It only records and saves the audio to the device; the
// transcript and the journal entry come afterwards, from the review sheet.
export function RecordDreamScreen({ navigation }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [micDenied, setMicDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulse] = useState(() => new Animated.Value(1));

  // Refs so the timer, the auto-stop and the back handler always see the current phase.
  const phaseRef = useRef<Phase>('idle');
  const finishingRef = useRef(false);
  const leavingRef = useRef(false);
  const startedAtRef = useRef(new Date());
  useEffect(() => {
    phaseRef.current = phase;
  });

  // Once recording has started the only way out is stopping it, so a stray back gesture
  // cannot throw a dream away.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!leavingRef.current && phaseRef.current !== 'idle') event.preventDefault();
      }),
    [navigation]
  );

  const finish = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setPhase('saving');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('The recorder produced no file');
      savePendingRecording(uri, startedAtRef.current);
      track('voice_recording_saved', {
        duration_seconds: Math.round((Date.now() - startedAtRef.current.getTime()) / 1000),
      });
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      notifyRecordingsChanged();
      await new Promise((resolve) => setTimeout(resolve, SAVING_MIN_MS));
      leavingRef.current = true;
      navigation.goBack();
    } catch {
      finishingRef.current = false;
      setError('That recording could not be saved. Please try again.');
      setPhase('idle');
    }
  };

  // Timer, and the five minute limit: the recorder is asked to stop itself at the limit
  // too, but this catches it on every platform and saves what was recorded.
  useEffect(() => {
    if (phase !== 'recording') return;
    const id = setInterval(() => {
      const elapsed = recorder.currentTime;
      setSeconds(Math.floor(elapsed));
      if (elapsed >= MAX_RECORDING_SECONDS) finish();
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish only reads refs and stable setters
  }, [phase, recorder]);

  // The mic breathes gently while recording; under reduced motion it holds still.
  useEffect(() => {
    if (phase !== 'recording' || reducedMotion) {
      pulse.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.95, duration: PULSE_HALF_CYCLE_MS, easing: EASE_AMBIENT, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: PULSE_HALF_CYCLE_MS, easing: EASE_AMBIENT, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [phase, reducedMotion, pulse]);

  const start = async () => {
    setError(null);
    try {
      let permission = await getRecordingPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setMicDenied(true);
        return;
      }
      setMicDenied(false);

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: MAX_RECORDING_SECONDS });
      startedAtRef.current = new Date();
      finishingRef.current = false;
      setSeconds(0);
      setPhase('recording');
    } catch {
      setError('Recording could not start. Please try again.');
    }
  };

  const handleMicPress = () => {
    if (phase === 'idle') start();
    else if (phase === 'recording') finish();
  };

  const isSaving = phase === 'saving';
  const MicIcon = phase === 'recording' ? Square : Mic;

  return (
    <ScreenContainer edges={['top', 'bottom']} edgeToEdge>
      <NightSky intensity="full" style={styles.sky}>
        <View style={styles.closeRow}>
          {phase === 'idle' ? (
            <AnimatedPressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X color={colors.text.secondary} size={24} strokeWidth={1.5} />
            </AnimatedPressable>
          ) : null}
        </View>

        <Arrive style={styles.center}>
          <Text style={[typography.displayMd, styles.prompt]}>What happened in your dream?</Text>

          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <AnimatedPressable
              onPress={handleMicPress}
              disabled={isSaving}
              style={styles.mic}
              accessibilityRole="button"
              accessibilityLabel={phase === 'recording' ? 'Stop recording' : 'Start recording'}
            >
              <MicIcon color={colors.text.onAccent} size={56} strokeWidth={1.5} />
            </AnimatedPressable>
          </Animated.View>

          <View style={styles.status}>
            {isSaving ? (
              <Text style={[typography.body, styles.hint]}>Saving...</Text>
            ) : (
              <>
                <Text style={styles.timer}>{formatTimer(seconds)}</Text>
                {micDenied ? (
                  <>
                    <Text style={[typography.body, styles.hint]}>Microphone access is needed to record dreams.</Text>
                    <Button label="Open Settings" onPress={() => Linking.openSettings()} style={styles.settingsButton} />
                  </>
                ) : (
                  <Text style={[typography.label, styles.hint]}>
                    {phase === 'recording' ? 'Tap to stop' : 'Tap to record, up to 5 minutes'}
                  </Text>
                )}
                {error ? <Text style={[typography.label, styles.error]}>{error}</Text> : null}
              </>
            )}
          </View>
        </Arrive>
      </NightSky>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sky: {
    flex: 1,
  },
  closeRow: {
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  prompt: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  mic: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 96,
  },
  timer: {
    ...typography.body,
    fontSize: 32,
    lineHeight: 38,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  error: {
    color: colors.status.danger,
    textAlign: 'center',
  },
  settingsButton: {
    marginTop: spacing.xs,
    // Buttons hug the left by default; this column is centred.
    alignSelf: 'center',
  },
});
