import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addMinutes } from './wbtb';

export const notificationsSupported = Platform.OS !== 'web';

const ALARM_CHANNEL_ID = 'wbtb-alarm';
// A single notification is easy to sleep through, so the alarm repeats until the session starts.
const ALARM_REPEAT_OFFSETS_MINUTES = [0, 3, 6];

const REALITY_CHECK_CHANNEL_ID = 'reality-check';
// Caps how many daily-recurring reminders we keep scheduled at once (and how many identifiers we cancel).
export const MAX_REALITY_CHECK_SLOTS = 16;

const MILD_PROMPT_CHANNEL_ID = 'mild-prompt';
// A single stable identifier — DAILY trigger means it fires at most once per day, so
// there's only ever one of these scheduled at a time (re-scheduling replaces it).
const MILD_PROMPT_ID = 'mild-prompt';

type WbtbNotificationType = 'wbtb-alarm' | 'wbtb-window-end';

const alarmIds = (sessionId: string) =>
  ALARM_REPEAT_OFFSETS_MINUTES.map((_, i) => `wbtb-alarm-${sessionId}-${i}`);
const windowEndId = (sessionId: string) => `wbtb-window-end-${sessionId}`;
const realityCheckId = (index: number) => `reality-check-${index}`;

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

export async function requestRealityCheckPermission() {
  if (!notificationsSupported) return true;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REALITY_CHECK_CHANNEL_ID, {
      name: 'Reality check reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
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

export async function requestMildPromptPermission() {
  if (!notificationsSupported) return true;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(MILD_PROMPT_CHANNEL_ID, {
      name: 'Pre-bed MILD prompt',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
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

export type RealityCheckSlot = {
  index: number;
  hour: number;
  minute: number;
  title: string;
  body: string;
  dreamSign: string | null;
};

export async function scheduleRealityChecks(slots: RealityCheckSlot[]) {
  if (!notificationsSupported) return;
  await cancelRealityChecks();
  await Promise.all(
    slots.map((slot) =>
      Notifications.scheduleNotificationAsync({
        identifier: realityCheckId(slot.index),
        content: {
          title: slot.title,
          body: slot.body,
          sound: 'default',
          data: { type: 'reality-check', slotIndex: slot.index, dreamSign: slot.dreamSign },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: slot.hour,
          minute: slot.minute,
          channelId: REALITY_CHECK_CHANNEL_ID,
        },
      })
    )
  );
}

export async function cancelRealityChecks() {
  if (!notificationsSupported) return;
  const ids = Array.from({ length: MAX_REALITY_CHECK_SLOTS }, (_, i) => realityCheckId(i));
  await cancelAndDismiss(ids);
}

export function parseRealityCheckNotification(notification: Notifications.Notification) {
  const data = notification.request.content.data;
  if (data?.type !== 'reality-check') return null;
  return {
    slotIndex: Number(data.slotIndex),
    dreamSign: typeof data.dreamSign === 'string' ? data.dreamSign : null,
  };
}

// One DAILY-trigger local notification timed to the user's bedtime (see
// useMildPromptScheduling), replacing whatever was scheduled under the same
// identifier before — re-scheduling on a bedtime change just overwrites it.
export async function scheduleMildPrompt(hour: number, minute: number) {
  if (!notificationsSupported) return;
  await Notifications.scheduleNotificationAsync({
    identifier: MILD_PROMPT_ID,
    content: {
      title: "Set tonight's intention",
      body: 'Your MILD prompt is ready. Takes ten seconds.',
      sound: 'default',
      data: { type: 'mild-prompt' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: MILD_PROMPT_CHANNEL_ID,
    },
  });
}

export async function cancelMildPrompt() {
  if (!notificationsSupported) return;
  await cancelAndDismiss([MILD_PROMPT_ID]);
}

export function parseMildPromptNotification(notification: Notifications.Notification) {
  return notification.request.content.data?.type === 'mild-prompt';
}
