import * as Notifications from 'expo-notifications';
import { Mic } from 'lucide-react-native';
import { useEffect } from 'react';
import { PrePermissionModal } from './PrePermissionModal';
import { usePrePermissionGate } from '../hooks/usePrePermissionGate';
import { hasBeenPrompted } from '../lib/permissionPrompts';
import {
  hideQuickRecordNotification,
  isQuickRecordEnabled,
  quickRecordSupported,
  requestQuickRecordPermission,
  showQuickRecordNotification,
} from '../lib/quickRecord';

// Android only. Once the app has been opened it keeps the quiet "Tap to record a dream"
// notification up: on each launch it posts it if it is not already showing, asking for
// notification permission first (with the app's usual explanation screen) if it has never
// been asked. Renders nothing on iOS.
export function QuickRecordSetup() {
  const permission = usePrePermissionGate('quick-record', requestQuickRecordPermission);
  const { requestWithGate } = permission;

  useEffect(() => {
    if (!quickRecordSupported) return;
    (async () => {
      if (!(await isQuickRecordEnabled())) {
        await hideQuickRecordNotification();
        return;
      }
      const current = await Notifications.getPermissionsAsync();
      if (current.granted) {
        await showQuickRecordNotification();
        return;
      }
      // Only ever ask once through this path; after that the toggle in Notification
      // settings is where the user turns it back on.
      if (current.canAskAgain && !(await hasBeenPrompted('quick-record')) && (await requestWithGate())) {
        await showQuickRecordNotification();
      }
    })();
  }, [requestWithGate]);

  if (!quickRecordSupported) return null;

  return (
    <PrePermissionModal
      visible={permission.visible}
      icon={Mic}
      headline="Record a dream before it fades"
      body="Nocturnal keeps one quiet notification in your shade, so you can record a dream the moment you wake, even from the lock screen. Allow notifications to turn it on."
      ctaLabel="Allow Quick Record"
      onAllow={permission.handleAllow}
      onDismiss={permission.handleDismiss}
    />
  );
}
