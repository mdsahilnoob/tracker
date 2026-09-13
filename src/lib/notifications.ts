export interface FocusCompletionContent {
  title: string;
  body: string;
}

export type FocusNotificationChannelId = 'focus-complete-sound' | 'focus-complete-silent';

export function buildFocusCompletionContent(taskTitle: string | undefined, minutes: number): FocusCompletionContent {
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  const subject = taskTitle?.trim();
  return {
    title: 'Focus session complete',
    body: subject
      ? `${safeMinutes} minutes on ${subject}. Nice work.`
      : `${safeMinutes} minutes of focus complete. Nice work.`,
  };
}

export function getFocusNotificationChannelId(soundEnabled: boolean): FocusNotificationChannelId {
  return soundEnabled ? 'focus-complete-sound' : 'focus-complete-silent';
}
