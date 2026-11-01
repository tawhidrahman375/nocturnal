import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './useAuth';
import { notificationsSupported } from '../lib/notifications';
import { applyRoutineSchedules, pushBackComeBackNudges } from '../lib/routineSchedule';

// Keeps every recurring, routine-anchored notification scheduled whenever the app starts
// signed in, and moves the come-back nudges out each time the app returns to the foreground.
// NotificationSettingsScreen and the pause controls call applyRoutineSchedules directly so a
// change takes effect immediately rather than at the next launch.
export function useRoutineScheduling(enabled: boolean) {
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !notificationsSupported || !user) return;
    applyRoutineSchedules(user.id).catch(() => {});

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') pushBackComeBackNudges(user.id).catch(() => {});
    });
    return () => subscription.remove();
  }, [enabled, user]);
}
