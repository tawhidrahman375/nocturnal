import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { computeLucidity, fetchLucidityInputs, LucidityProgress } from '../lib/lucidity';

type DreamLike = { dreamed_at: string; is_lucid: boolean };

// Re-read on every focus, since it is made of rolling windows and moves with the day.
export function useLucidityProgress(dreams: DreamLike[], dreamsLoading: boolean) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<LucidityProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user || dreamsLoading) return;
      let ignore = false;
      fetchLucidityInputs(user.id, dreams)
        .then((inputs) => {
          if (!ignore) setProgress(computeLucidity(inputs));
        })
        .catch(() => {})
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });
      return () => {
        ignore = true;
      };
    }, [user, dreams, dreamsLoading])
  );

  return { progress, isLoading };
}
