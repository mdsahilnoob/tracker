import type { Reminder } from '../types/models';
import { readJson, STORAGE_KEYS, writeJson } from './index';

export async function loadReminders(): Promise<Reminder[]> {
  const value = await readJson<unknown>(STORAGE_KEYS.reminders, []);
  return Array.isArray(value) ? value.map(normalizeReminder).filter((reminder): reminder is Reminder => reminder !== null) : [];
}

export async function saveReminders(reminders: Reminder[]): Promise<void> {
  await writeJson(STORAGE_KEYS.reminders, reminders.map(normalizeReminder).filter((reminder): reminder is Reminder => reminder !== null));
}

export function normalizeReminder(value: unknown): Reminder | null {
  if (!value || typeof value !== 'object') return null;
  const reminder = value as Partial<Reminder>;
  if (typeof reminder.id !== 'string' || typeof reminder.title !== 'string') return null;
  const hour = reminder.hour;
  const minute = reminder.minute;
  if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (typeof minute !== 'number' || !Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  const weekdays = Array.isArray(reminder.weekdays)
    ? [...new Set(reminder.weekdays.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6))].sort()
    : [];
  if (!weekdays.length) return null;
  return {
    id: reminder.id,
    title: reminder.title.trim().slice(0, 120),
    hour,
    minute,
    weekdays,
    ...(typeof reminder.taskId === 'string' ? { taskId: reminder.taskId } : {}),
    ...(typeof reminder.taskTitle === 'string' ? { taskTitle: reminder.taskTitle.trim().slice(0, 120) } : {}),
    enabled: reminder.enabled !== false,
    ...(Array.isArray(reminder.notificationIds) ? { notificationIds: reminder.notificationIds.filter((id): id is string => typeof id === 'string') } : {}),
  };
}
