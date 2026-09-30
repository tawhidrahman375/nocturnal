import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CloudOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { CrossFade } from '../../components/CrossFade';
import { EmptyState } from '../../components/EmptyState';
import { LoadingView } from '../../components/LoadingView';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { track } from '../../lib/analytics';
import { STAGE_SLIDE_PX } from '../../lib/motion';
import { cancelAlarm, cancelWindowEnd, scheduleWindowEnd } from '../../lib/notifications';
import { markMildIntentionSet } from '../../lib/tonightRoutine';
import { addMinutes, stageForSession, WbtbSession, WbtbStage, WbtbTechnique } from '../../lib/wbtb';
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
import { SsildStage } from './stages/SsildStage';
import { WakeWindowStage } from './stages/WakeWindowStage';
import { WildStage } from './stages/WildStage';

type Props = NativeStackScreenProps<AppStackParamList, 'WbtbSession'>;

const STAGE_HEADERS: Record<Exclude<WbtbStage, 'closed'>, { label: string; step?: 1 | 2 | 3 }> = {
  alarm: { label: 'Wake Back To Bed' },
  recall: { label: 'Recall', step: 1 },
  window: { label: 'Wake window', step: 2 },
  technique: { label: 'Return to sleep', step: 3 },
};

const TECHNIQUE_STAGES: Record<WbtbTechnique, typeof MildStage> = {
  mild: MildStage,
  wild: WildStage,
  ssild: SsildStage,
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
    track('wbtb_session_started', { technique: session.technique });
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
    setStage('technique');
  };

  const handleComplete = () => {
    persist({ status: 'completed', completed_at: new Date().toISOString() });
    track('wbtb_session_completed', { technique: session.technique });
    // Tonight's routine card tracks this as the "pre-bed intention" step.
    if (session.technique === 'mild' && user) markMildIntentionSet(user.id).catch(() => {});
    setStage('closed');
  };

  const renderStage = () => {
    if (stage === 'alarm') return <AlarmStage session={session} onBegin={handleBegin} onSkip={handleSkip} />;
    if (stage === 'recall') {
      return <RecallStage onSave={handleSaveRecall} onSkip={() => setStage('window')} />;
    }
    if (stage === 'window') return <WakeWindowStage session={session} onContinue={handleEndWindow} />;
    if (stage === 'technique') {
      const TechniqueStage = TECHNIQUE_STAGES[session.technique as WbtbTechnique];
      return <TechniqueStage session={session} onComplete={handleComplete} />;
    }
    return <ClosedStage session={session} onClose={close} />;
  };

  return (
    <ScreenContainer>
      {stage !== 'closed' ? <SessionHeader {...STAGE_HEADERS[stage]} onClose={close} /> : null}

      <CrossFade contentKey={stage} slidePx={STAGE_SLIDE_PX} style={styles.stage}>
        {renderStage()}
      </CrossFade>

      {syncError ? <Text style={[typography.caption, styles.syncError]}>{syncError}</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
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
