import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CloudOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { LoadingView } from '../../components/LoadingView';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { cancelAlarm, cancelWindowEnd, scheduleWindowEnd } from '../../lib/notifications';
import { addMinutes, stageForSession, WbtbSession, WbtbStage } from '../../lib/wbtb';
import {
  fetchSession,
  saveRecallToJournal,
  SessionPatch,
  updateSession,
} from '../../lib/wbtbSessions';
import { AppStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { SessionHeader } from './SessionHeader';
import { AlarmStage } from './stages/AlarmStage';
import { ClosedStage } from './stages/ClosedStage';
import { MildStage } from './stages/MildStage';
import { RecallStage } from './stages/RecallStage';
import { WakeWindowStage } from './stages/WakeWindowStage';

type Props = NativeStackScreenProps<AppStackParamList, 'WbtbSession'>;

const STAGE_HEADERS: Record<Exclude<WbtbStage, 'closed'>, { label: string; step?: 1 | 2 | 3 }> = {
  alarm: { label: 'Wake Back To Bed' },
  recall: { label: 'Recall', step: 1 },
  window: { label: 'Wake window', step: 2 },
  mild: { label: 'Return to sleep', step: 3 },
};

export function WbtbSessionScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const { user } = useAuth();
  const [session, setSession] = useState<WbtbSession | null>(null);
  const [stage, setStage] = useState<WbtbStage | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetchSession(sessionId)
      .then((loaded) => {
        if (ignore) return;
        setSession(loaded);
        setStage(stageForSession(loaded));
      })
      .catch((e: Error) => {
        if (!ignore) setLoadError(e.message);
      });
    return () => {
      ignore = true;
    };
  }, [sessionId]);

  // Writes run in order; closing waits so Home never refetches a stale status.
  const pendingWrites = useRef<Promise<void>>(Promise.resolve());

  const close = async () => {
    await pendingWrites.current;
    navigation.goBack();
  };

  // Local state moves first so a flaky connection at 5am never stalls the session.
  const persist = (patch: SessionPatch) => {
    setSession((current) => (current ? { ...current, ...patch } : current));
    pendingWrites.current = pendingWrites.current
      .then(() => updateSession(sessionId, patch))
      .catch(() => setSyncError("Couldn't sync this session. You can keep going."));
  };

  if (loadError) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <EmptyState
            icon={CloudOff}
            title="Couldn't load your session"
            message="Check your connection and try again from the home screen."
          />
        </View>
        <Button label="Back to home" variant="secondary" onPress={close} style={styles.bottomAction} />
      </ScreenContainer>
    );
  }

  if (!session || !stage) {
    return (
      <ScreenContainer>
        <LoadingView label="Preparing your session" />
      </ScreenContainer>
    );
  }

  const handleBegin = () => {
    const wokeAt = new Date();
    persist({ status: 'active', woke_at: wokeAt.toISOString() });
    cancelAlarm(session.id);
    scheduleWindowEnd(session.id, addMinutes(wokeAt, session.wake_window_minutes));
    setStage('recall');
  };

  const handleSkip = () => {
    persist({ status: 'skipped' });
    cancelAlarm(session.id);
    close();
  };

  const handleSaveRecall = async (recall: string) => {
    setStage('window');
    if (!user) return;
    try {
      const dreamId = await saveRecallToJournal(user.id, recall);
      persist({ dream_recall: recall, dream_id: dreamId });
    } catch {
      persist({ dream_recall: recall });
      setSyncError("Couldn't add this dream to your journal.");
    }
  };

  const handleEndWindow = () => {
    persist({ wake_window_ended_at: new Date().toISOString() });
    cancelWindowEnd(session.id);
    setStage('mild');
  };

  const handleComplete = () => {
    persist({ status: 'completed', completed_at: new Date().toISOString() });
    setStage('closed');
  };

  return (
    <ScreenContainer>
      {stage !== 'closed' ? <SessionHeader {...STAGE_HEADERS[stage]} onClose={close} /> : null}

      {stage === 'alarm' ? (
        <AlarmStage session={session} onBegin={handleBegin} onSkip={handleSkip} />
      ) : null}
      {stage === 'recall' ? (
        <RecallStage onSave={handleSaveRecall} onSkip={() => setStage('window')} />
      ) : null}
      {stage === 'window' ? <WakeWindowStage session={session} onContinue={handleEndWindow} /> : null}
      {stage === 'mild' ? <MildStage session={session} onComplete={handleComplete} /> : null}
      {stage === 'closed' ? <ClosedStage session={session} onClose={close} /> : null}

      {syncError ? <Text style={[typography.caption, styles.syncError]}>{syncError}</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomAction: {
    marginBottom: spacing.lg,
  },
  syncError: {
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingBottom: spacing.sm,
  },
});
