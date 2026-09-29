import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// The persistent "Tap to record a dream" notification. Android only: iOS has no equivalent
// (and no lock screen widget yet), so it gets a Record a dream button on the Journal instead.
export const quickRecordSupported = Platform.OS === 'android';

const CHANNEL_ID = 'quick-record';
const CATEGORY_ID = 'quick-record';
const NOTIFICATION_ID = 'quick-record';
const RECORD_ACTION_ID = 'record';
const ENABLED_KEY = 'nocturnal:quick-record:enabled';

// On by default. Local to the device on purpose: the notification itself only exists on this
// device, so its on/off switch does not belong in the user's synced settings.
export async function isQuickRecordEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_KEY)) !== 'false';
}

export async function setQuickRecordEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
}

// Low importance: it sits quietly at the bottom of the shade, with no sound, vibration or
// heads-up banner. Public on the lock screen so it can be tapped from there.
async function ensureChannelAndCategory() {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Quick record',
    description: 'A quiet notification for recording a dream the moment you wake.',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    vibrationPattern: null,
    enableVibrate: false,
    showBadge: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    { identifier: RECORD_ACTION_ID, buttonTitle: 'Record', options: { opensAppToForeground: true } },
  ]);
}

export async function requestQuickRecordPermission(): Promise<boolean> {
  if (!quickRecordSupported) return true;

  // Android 13+ only shows the permission prompt once a channel exists.
  await ensureChannelAndCategory();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

// Posts the ongoing notification (or leaves it alone if it is already up). `sticky` is
// Android's "ongoing": it cannot be swiped away, and `autoDismiss: false` keeps it in the
// shade after being tapped. Does nothing without notification permission or when the user
// has switched it off.
export async function showQuickRecordNotification(): Promise<void> {
  if (!quickRecordSupported || !(await isQuickRecordEnabled())) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  const showing = await Notifications.getPresentedNotificationsAsync();
  if (showing.some((n) => n.request.identifier === NOTIFICATION_ID)) return;

  await ensureChannelAndCategory();
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: 'Nocturnal',
      body: 'Tap to record a dream',
      categoryIdentifier: CATEGORY_ID,
      data: { type: 'quick-record' },
      sticky: true,
      autoDismiss: false,
      priority: Notifications.AndroidNotificationPriority.LOW,
    },
    trigger: { channelId: CHANNEL_ID },
  });
}

export async function hideQuickRecordNotification(): Promise<void> {
  if (!quickRecordSupported) return;
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID),
    Notifications.dismissNotificationAsync(NOTIFICATION_ID),
  ]);
}

// True for a tap on the notification body and for its Record button alike: both open the
// recording screen.
export function parseQuickRecordNotification(notification: Notifications.Notification) {
  return notification.request.content.data?.type === 'quick-record';
}
