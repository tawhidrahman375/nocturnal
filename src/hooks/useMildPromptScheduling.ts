import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { applyMildPromptSchedule } from '../lib/mildPromptSchedule';
import { notificationsSupported } from '../lib/notifications';

// Keeps the nightly MILD-prompt notification scheduled (or cancelled, if the user has
// turned it off in NotificationSettingsScreen) whenever the app starts signed in.
// NotificationSettingsScreen calls the same applyMildPromptSchedule directly so a
// toggle/time change there takes effect immediately rather than waiting for next launch.
export function useMildPromptScheduling(enabled: boolean) {
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !notificationsSupported || !user) return;
    applyMildPromptSchedule(user.id).catch(() => {});
  }, [enabled, user]);
}
