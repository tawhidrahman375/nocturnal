import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { notificationsSupported, parseRoutineNotification } from '../lib/notifications';
import { navigationRef } from '../navigation/navigationRef';

// The morning recall and the come-back nudges both open the Journal with the entry sheet
// already up: the notification is the cue, the next tap is the writing.
function openJournal(notification: Notifications.Notification) {
  if (parseRoutineNotification(notification) && navigationRef.isReady()) {
    navigationRef.navigate('Tabs', { screen: 'Journal', params: { compose: true } });
  }
}

export function useRoutineNotificationRouting(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !notificationsSupported) return;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      openJournal(response.notification);
      Notifications.clearLastNotificationResponseAsync();
    });

    const responses = Notifications.addNotificationResponseReceivedListener((response) =>
      openJournal(response.notification)
    );

    return () => {
      responses.remove();
    };
  }, [enabled]);
}
