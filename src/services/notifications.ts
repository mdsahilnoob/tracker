import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  buildFocusCompletionContent,
  getFocusNotificationChannelId,
} from '@/lib/notifications';
import type { ActiveTimerState } from '@/types/models';

const SOUND_CHANNEL = getFocusNotificationChannelId(true);
const SILENT_CHANNEL = getFocusNotificationChannelId(false);

let notificationHandlerConfigured = false;

export async function prepareLocalNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerConfigured = true;
  }
  if (Platform.OS !== 'android') return;
  try {
    await Promise.all([
      Notifications.setNotificationChannelAsync(SOUND_CHANNEL, {
        name: 'Focus complete with sound',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      }),
      Notifications.setNotificationChannelAsync(SILENT_CHANNEL, {
        name: 'Focus complete silently',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: null,
      }),
    ]);
  } catch {
    // Notification setup is optional and must never block the app.
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    await prepareLocalNotifications();
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === Notifications.PermissionStatus.GRANTED) return true;
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return requested.status === Notifications.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

export async function scheduleFocusCompletion(
  timer: ActiveTimerState,
  options: { soundEnabled: boolean },
): Promise<string | undefined> {
  if (Platform.OS === 'web') return undefined;
  const endMs = Date.parse(timer.expectedEndAt);
  if (!Number.isFinite(endMs) || endMs <= Date.now()) return undefined;
  const permitted = await requestNotificationPermission();
  if (!permitted) return undefined;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        ...buildFocusCompletionContent(timer.taskTitle, timer.plannedDurationMinutes),
        data: { sessionId: timer.sessionId },
        sound: options.soundEnabled ? 'default' : undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endMs),
        channelId: getFocusNotificationChannelId(options.soundEnabled),
      },
    });
  } catch {
    return undefined;
  }
}

export async function cancelFocusCompletion(notificationId: string | undefined): Promise<void> {
  if (Platform.OS === 'web' || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // A stale notification ID should not block timer cleanup.
  }
}
