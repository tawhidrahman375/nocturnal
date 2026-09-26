import * as Notifications from 'expo-notifications';
import { useCallback, useRef, useState } from 'react';
import { notificationsSupported } from '../lib/notifications';
import { hasBeenPrompted, markPrompted, PrePermissionKind } from '../lib/permissionPrompts';

// Wraps an existing permission-request function (requestAlarmPermission,
// requestRealityCheckPermission, both untouched) with a custom explanation screen
// that fires before the system prompt, shown at most once per device per kind.
export function usePrePermissionGate(
  kind: PrePermissionKind,
  requestPermission: () => Promise<boolean>
) {
  const [visible, setVisible] = useState(false);
  const resolverRef = useRef<((granted: boolean) => void) | null>(null);

  const requestWithGate = useCallback(async (): Promise<boolean> => {
    if (!notificationsSupported) return requestPermission();

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return requestPermission();
    if (await hasBeenPrompted(kind)) return requestPermission();

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setVisible(true);
    });
  }, [kind, requestPermission]);

  const handleAllow = useCallback(async () => {
    setVisible(false);
    await markPrompted(kind);
    const granted = await requestPermission();
    resolverRef.current?.(granted);
    resolverRef.current = null;
  }, [kind, requestPermission]);

  // A dismiss never marks the kind as prompted, since the system prompt never fired,
  // so the explanation is still eligible to show again next time it is requested.
  const handleDismiss = useCallback(() => {
    setVisible(false);
    resolverRef.current?.(false);
    resolverRef.current = null;
  }, []);

  return { visible, requestWithGate, handleAllow, handleDismiss };
}
