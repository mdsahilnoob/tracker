import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { ActiveTimerState } from '@/types/models';

const CHANNEL_ID = 'focus-complete';
let completionSoundEnabled = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: completionSoundEnabled,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configureNotifications(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Focus sessions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#FF7657',
    });
  } catch {
    // Notification support is optional; the timer still works without it.
  }
}

export async function scheduleFocusCompletion(timer: ActiveTimerState, soundEnabled: boolean, notificationsEnabled = true): Promise<void> {
  if (Platform.OS === 'web' || !notificationsEnabled) return;
  try {
    completionSoundEnabled = soundEnabled;
    await configureNotifications();
    const permissions = await Notifications.getPermissionsAsync();
    const status = permissions.status === 'granted'
      ? permissions.status
      : (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Focus session complete',
        body: timer.taskTitle ? `Great work — ${timer.taskTitle} is done.` : 'Great work — you focused with intention.',
        sound: soundEnabled ? 'default' : false,
        data: { sessionId: timer.sessionId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(timer.expectedEndAt),
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    // Denied or unavailable notifications never block a focus session.
  }
}

export async function cancelFocusCompletion(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore platform notification cleanup failures.
  }
}
