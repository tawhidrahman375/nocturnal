import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { track } from '../lib/analytics';
import { notificationsSupported, parseRealityCheckNotification } from '../lib/notifications';
import { logRealityCheckReminder } from '../lib/realityChecks';
import { useAuth } from './useAuth';

// Local notifications have no server, so this is the only place a reminder that actually
// fires gets logged — while the app process is alive to catch the event.
export function useRealityCheckNotificationRouting(enabled: boolean) {
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !notificationsSupported || !user) return;

    const log = (notification: Notifications.Notification, status: 'delivered' | 'opened') => {
      const parsed = parseRealityCheckNotification(notification);
      if (!parsed) return;
      // "Completed" = the user acted on the reminder by opening it; delivery alone is not.
      if (status === 'opened') track('reality_check_completed');
      logRealityCheckReminder(user.id, { dreamSign: parsed.dreamSign, status }).catch(() => {});
    };

    // Covers a tap that cold-started the app, before listeners existed.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      log(response.notification, 'opened');
      Notifications.clearLastNotificationResponseAsync();
    });

    const responses = Notifications.addNotificationResponseReceivedListener((response) =>
      log(response.notification, 'opened')
    );
    const received = Notifications.addNotificationReceivedListener((notification) =>
      log(notification, 'delivered')
    );

    return () => {
      responses.remove();
      received.remove();
    };
  }, [enabled, user]);
}
