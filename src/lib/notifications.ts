import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addMinutes } from './wbtb';

export const notificationsSupported = Platform.OS !== 'web';

const ALARM_CHANNEL_ID = 'wbtb-alarm';
// A single notification is easy to sleep through, so the alarm repeats until the session starts.
const ALARM_REPEAT_OFFSETS_MINUTES = [0, 3, 6];

type WbtbNotificationType = 'wbtb-alarm' | 'wbtb-window-end';

const alarmIds = (sessionId: string) =>
  ALARM_REPEAT_OFFSETS_MINUTES.map((_, i) => `wbtb-alarm-${sessionId}-${i}`);
const windowEndId = (sessionId: string) => `wbtb-window-end-${sessionId}`;

export function configureNotifications() {
  if (!notificationsSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // The session screen already shows the countdown finishing; just chime.
      const isWindowEnd = notification.request.content.data?.type === 'wbtb-window-end';
      return {
        shouldShowBanner: !isWindowEnd,
        shouldShowList: !isWindowEnd,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
  });
}

export async function requestAlarmPermission() {
  if (!notificationsSupported) return true;

  // Android 13+ only shows the permission prompt once a channel exists.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: 'Wake Back To Bed alarm',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 250, 400],
      sound: 'default',
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      audioAttributes: { usage: Notifications.AndroidAudioUsage.ALARM },
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const next = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return next.granted;
}

function schedule(
  identifier: string,
  date: Date,
  type: WbtbNotificationType,
  sessionId: string,
  title: string,
  body: string
) {
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: 'default',
      data: { type, sessionId },
      interruptionLevel: 'timeSensitive',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: ALARM_CHANNEL_ID,
    },
  });
}

export async function scheduleAlarm(sessionId: string, wakeAt: Date) {
  if (!notificationsSupported) return;
  const ids = alarmIds(sessionId);
  await Promise.all(
    ALARM_REPEAT_OFFSETS_MINUTES.map((offset, i) =>
      schedule(
        ids[i],
        addMinutes(wakeAt, offset),
        'wbtb-alarm',
        sessionId,
        i === 0 ? 'Time to wake up' : 'Your wake window is waiting',
        i === 0
          ? 'Stay still for a moment and hold on to your last dream.'
          : 'Open Nocturnal to start your WBTB session.'
      )
    )
  );
}

export async function scheduleWindowEnd(sessionId: string, endsAt: Date) {
  if (!notificationsSupported) return;
  await schedule(
    windowEndId(sessionId),
    endsAt,
    'wbtb-window-end',
    sessionId,
    'Wake window complete',
    'Head back to bed and set your lucid intention.'
  );
}

async function cancelAndDismiss(identifiers: string[]) {
  if (!notificationsSupported) return;
  await Promise.all(
    identifiers.flatMap((id) => [
      Notifications.cancelScheduledNotificationAsync(id),
      Notifications.dismissNotificationAsync(id),
    ])
  );
}

export const cancelAlarm = (sessionId: string) => cancelAndDismiss(alarmIds(sessionId));
export const cancelWindowEnd = (sessionId: string) => cancelAndDismiss([windowEndId(sessionId)]);

export function parseWbtbNotification(notification: Notifications.Notification) {
  const data = notification.request.content.data;
  if (data?.type !== 'wbtb-alarm' && data?.type !== 'wbtb-window-end') return null;
  return { sessionId: String(data.sessionId), type: data.type as WbtbNotificationType };
}
