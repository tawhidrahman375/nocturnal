import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  applyRealityCheckSchedule,
  fetchRealityCheckSettings,
  RealityCheckSettings,
  RealityCheckSettingsPatch,
  saveRealityCheckSettings,
} from '../lib/realityChecks';
import { useAuth } from './useAuth';

export function useRealityCheckSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<RealityCheckSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    let ignore = false;
    fetchRealityCheckSettings(user.id)
      .then((data) => {
        if (ignore) return;
        setSettings(data);
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
  }, [user]);

  useFocusEffect(load);

  const save = async (patch: RealityCheckSettingsPatch, dreamSigns: string[]) => {
    if (!user) throw new Error('Not signed in');
    const next = await saveRealityCheckSettings(user.id, patch);
    setSettings(next);
    await applyRealityCheckSchedule(next, dreamSigns);
    return next;
  };

  return { settings, isLoading, error, save };
}
