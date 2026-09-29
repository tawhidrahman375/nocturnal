import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { notificationsSupported } from '../lib/notifications';
import { parseQuickRecordNotification } from '../lib/quickRecord';
import { navigationRef } from '../navigation/navigationRef';

function openRecorder(notification: Notifications.Notification) {
  if (parseQuickRecordNotification(notification) && navigationRef.isReady()) {
    navigationRef.navigate('RecordDream');
  }
}

// Tapping the quick-record notification, or its Record button, opens the recording screen.
export function useQuickRecordNotificationRouting(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !notificationsSupported) return;

    // Covers a tap that cold-started the app, before listeners existed.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      openRecorder(response.notification);
      Notifications.clearLastNotificationResponseAsync();
    });

    const responses = Notifications.addNotificationResponseReceivedListener((response) =>
      openRecorder(response.notification)
    );

    return () => {
      responses.remove();
    };
  }, [enabled]);
}
