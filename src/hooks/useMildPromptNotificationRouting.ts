import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { notificationsSupported, parseMildPromptNotification } from '../lib/notifications';
import { navigationRef } from '../navigation/navigationRef';

function openMildPrompt(notification: Notifications.Notification) {
  if (parseMildPromptNotification(notification) && navigationRef.isReady()) {
    navigationRef.navigate('MildPrompt');
  }
}

export function useMildPromptNotificationRouting(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !notificationsSupported) return;

    // Covers a tap that cold-started the app, before listeners existed.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      openMildPrompt(response.notification);
      Notifications.clearLastNotificationResponseAsync();
    });

    const responses = Notifications.addNotificationResponseReceivedListener((response) =>
      openMildPrompt(response.notification)
    );

    return () => {
      responses.remove();
    };
  }, [enabled]);
}
