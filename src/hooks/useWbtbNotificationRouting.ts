import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { notificationsSupported, parseWbtbNotification } from '../lib/notifications';
import { navigationRef } from '../navigation/navigationRef';

function openSession(notification: Notifications.Notification) {
  const parsed = parseWbtbNotification(notification);
  if (parsed && navigationRef.isReady()) {
    navigationRef.navigate('WbtbSession', { sessionId: parsed.sessionId });
  }
}

export function useWbtbNotificationRouting(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !notificationsSupported) return;

    // Covers a tap that cold-started the app, before listeners existed.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      openSession(response.notification);
      Notifications.clearLastNotificationResponseAsync();
    });

    const responses = Notifications.addNotificationResponseReceivedListener((response) =>
      openSession(response.notification)
    );
    const received = Notifications.addNotificationReceivedListener((notification) => {
      if (parseWbtbNotification(notification)?.type === 'wbtb-alarm') openSession(notification);
    });

    return () => {
      responses.remove();
      received.remove();
    };
  }, [enabled]);
}
