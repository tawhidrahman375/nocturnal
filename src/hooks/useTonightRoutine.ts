import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Dream } from './useDreams';
import { useAuth } from './useAuth';
import { fetchTonightRoutineSteps, TonightRoutineSteps } from '../lib/tonightRoutine';

const STEP_COUNT = 4;

export function useTonightRoutine(dreams: Pick<Dream, 'created_at'>[], mildIntentionSetAt: string | null) {
  const { user } = useAuth();
  const [steps, setSteps] = useState<TonightRoutineSteps | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    if (!user) return;
    let ignore = false;
    fetchTonightRoutineSteps(user.id, dreams, mildIntentionSetAt)
      .then((next) => {
        if (!ignore) setSteps(next);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user, dreams, mildIntentionSetAt]);

  useFocusEffect(load);

  const completedCount = steps
    ? Number(steps.realityCheck) + Number(steps.journal) + Number(steps.intention) + Number(steps.wbtb)
    : 0;

  return {
    steps,
    completedCount,
    isComplete: completedCount === STEP_COUNT,
    isLoading,
  };
}
