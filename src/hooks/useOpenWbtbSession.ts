import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { WbtbSession } from '../lib/wbtb';
import { fetchOpenSession } from '../lib/wbtbSessions';

export function useOpenWbtbSession() {
  const [session, setSession] = useState<WbtbSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let ignore = false;
    fetchOpenSession()
      .then((next) => {
        if (ignore) return;
        setSession(next);
        setError(null);
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useFocusEffect(load);

  return { session, isLoading, error, reload: load };
}
