import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { fetchWbtbDefaults, saveWbtbDefaults, WbtbDefaults, WbtbDefaultsPatch } from '../lib/wbtbDefaults';

export function useWbtbDefaults() {
  const { user } = useAuth();
  const [defaults, setDefaults] = useState<WbtbDefaults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) {
      setDefaults(null);
      setIsLoading(false);
      return;
    }
    let ignore = false;
    setIsLoading(true);
    fetchWbtbDefaults(user.id)
      .then((data) => {
        if (ignore) return;
        setDefaults(data);
        setError(null);
      })
      .catch((e) => {
        if (!ignore) setError((e as Error).message);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user]);

  useFocusEffect(load);

  const save = async (patch: WbtbDefaultsPatch) => {
    if (!user) throw new Error('Not signed in');
    const next = await saveWbtbDefaults(user.id, patch);
    setDefaults(next);
    return next;
  };

  return { defaults, isLoading, error, save };
}
