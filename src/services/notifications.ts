import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import {
  buildFocusCompletionContent,
  getFocusNotificationChannelId,
  shouldUseNativeNotifications,
} from '@/lib/notifications';
import type { ActiveTimerState } from '@/types/models';
import type * as Notifications from 'expo-notifications';

type NotificationsModule = typeof Notifications;

const SOUND_CHANNEL = getFocusNotificationChannelId(true);
const SILENT_CHANNEL = getFocusNotificationChannelId(false);

let notificationHandlerConfigured = false;
let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

async function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (!shouldUseNativeNotifications(Platform.OS, isRunningInExpoGo())) return null;
  notificationsModulePromise ??= import('expo-notifications').catch(() => null);
  return notificationsModulePromise;
}

export async function prepareLocalNotifications(): Promise<void> {
  const notifications = await loadNotificationsModule();
  if (!notifications) return;
  try {
    if (!notificationHandlerConfigured) {
      notifications.setNotificationHandler({
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
    await Promise.all([
      notifications.setNotificationChannelAsync(SOUND_CHANNEL, {
        name: 'Focus complete with sound',
        importance: notifications.AndroidImportance.HIGH,
        sound: 'default',
      }),
      notifications.setNotificationChannelAsync(SILENT_CHANNEL, {
        name: 'Focus complete silently',
        importance: notifications.AndroidImportance.DEFAULT,
        sound: null,
      }),
    ]);
  } catch {
    // Notification setup is optional and must never block the app.
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const notifications = await loadNotificationsModule();
  if (!notifications) return false;
  try {
    await prepareLocalNotifications();
    const existing = await notifications.getPermissionsAsync();
    if (existing.status === notifications.PermissionStatus.GRANTED) return true;
    const requested = await notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return requested.status === notifications.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

export async function scheduleFocusCompletion(
  timer: ActiveTimerState,
  options: { soundEnabled: boolean },
): Promise<string | undefined> {
  const notifications = await loadNotificationsModule();
  if (!notifications) return undefined;
  const endMs = Date.parse(timer.expectedEndAt);
  if (!Number.isFinite(endMs) || endMs <= Date.now()) return undefined;
  const permitted = await requestNotificationPermission();
  if (!permitted) return undefined;

  try {
    return await notifications.scheduleNotificationAsync({
      content: {
        ...buildFocusCompletionContent(timer.taskTitle, timer.plannedDurationMinutes),
        data: { sessionId: timer.sessionId },
        sound: options.soundEnabled ? 'default' : undefined,
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endMs),
        channelId: getFocusNotificationChannelId(options.soundEnabled),
      },
    });
  } catch {
    return undefined;
  }
}

export async function cancelFocusCompletion(notificationId: string | undefined): Promise<void> {
  const notifications = await loadNotificationsModule();
  if (!notifications || !notificationId) return;
  try {
    await notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // A stale notification ID should not block timer cleanup.
  }
}
