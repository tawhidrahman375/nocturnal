import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { applyMildPromptSchedule } from '../lib/mildPromptSchedule';
import {
  fetchNotificationSettings,
  NotificationSettings,
  NotificationSettingsPatch,
  saveNotificationSettings,
} from '../lib/notificationSettings';

export function useNotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }
    let ignore = false;
    setIsLoading(true);
    fetchNotificationSettings(user.id)
      .then((data) => {
        if (ignore) return;
        setSettings(data);
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

  const save = async (patch: NotificationSettingsPatch) => {
    if (!user) throw new Error('Not signed in');
    const next = await saveNotificationSettings(user.id, patch);
    setSettings(next);
    // Re-derives and re-schedules (or cancels) the MILD prompt immediately, same as
    // useRealityCheckSettings' save() applying the reality-check schedule right away
    // rather than waiting for the next app launch.
    await applyMildPromptSchedule(user.id);
    return next;
  };

  return { settings, isLoading, error, save };
}
