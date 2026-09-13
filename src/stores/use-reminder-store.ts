import { create } from 'zustand';

import { getReminderOccurrences } from '../lib/reminders';
import { createId } from '../lib/id';
import { cancelNotificationIds, scheduleReminderOccurrence } from '../services/notifications';
import { loadReminders, saveReminders } from '../storage/reminders';
import type { Reminder } from '../types/models';

export interface ReminderInput {
  title: string;
  hour: number;
  minute: number;
  weekdays: number[];
  taskId?: string;
  taskTitle?: string;
  enabled?: boolean;
}

interface ReminderStore {
  reminders: Reminder[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  addReminder: (input: ReminderInput, scheduleNotifications?: boolean) => Promise<Reminder | null>;
  updateReminder: (id: string, patch: Partial<ReminderInput>, scheduleNotifications?: boolean) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  syncNotifications: (enabled: boolean) => Promise<void>;
}

export const useReminderStore = create<ReminderStore>()((set, get) => ({
  reminders: [],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    set({ reminders: await loadReminders(), hydrated: true });
  },
  refresh: async () => {
    set({ reminders: await loadReminders(), hydrated: true });
  },
  addReminder: async (input, scheduleNotifications = true) => {
    const reminder = normalizeInput(input);
    if (!reminder) return null;
    const withIds = await syncNotificationIds(reminder, scheduleNotifications);
    const reminders = [withIds, ...get().reminders];
    set({ reminders });
    await saveReminders(reminders);
    return withIds;
  },
  updateReminder: async (id, patch, scheduleNotifications = true) => {
    const current = get().reminders.find((reminder) => reminder.id === id);
    if (!current) return;
    await cancelNotificationIds(current.notificationIds);
    const updated = normalizeInput({ ...current, ...patch });
    if (!updated) return;
    const withIds = await syncNotificationIds({ ...updated, id: current.id }, scheduleNotifications);
    const reminders = get().reminders.map((reminder) => reminder.id === id ? withIds : reminder);
    set({ reminders });
    await saveReminders(reminders);
  },
  toggleReminder: async (id) => {
    const reminder = get().reminders.find((item) => item.id === id);
    if (!reminder) return;
    await get().updateReminder(id, { enabled: !reminder.enabled });
  },
  deleteReminder: async (id) => {
    const reminder = get().reminders.find((item) => item.id === id);
    await cancelNotificationIds(reminder?.notificationIds);
    const reminders = get().reminders.filter((item) => item.id !== id);
    set({ reminders });
    await saveReminders(reminders);
  },
  syncNotifications: async (enabled) => {
    const reminders = await Promise.all(get().reminders.map(async (reminder) => {
      await cancelNotificationIds(reminder.notificationIds);
      return syncNotificationIds(reminder, enabled);
    }));
    set({ reminders });
    await saveReminders(reminders);
  },
}));

function normalizeInput(input: ReminderInput | (Reminder & Partial<ReminderInput>)): Reminder | null {
  const title = input.title.trim().replace(/\s+/g, ' ').slice(0, 120);
  const weekdays = [...new Set(input.weekdays ?? [])].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6).sort();
  if (!title || !weekdays.length || !Number.isInteger(input.hour) || input.hour < 0 || input.hour > 23 || !Number.isInteger(input.minute) || input.minute < 0 || input.minute > 59) return null;
  return {
    id: 'id' in input && input.id ? input.id : createId('reminder'),
    title,
    hour: input.hour,
    minute: input.minute,
    weekdays,
    ...(input.taskId ? { taskId: input.taskId } : {}),
    ...(input.taskTitle ? { taskTitle: input.taskTitle.trim().slice(0, 120) } : {}),
    enabled: input.enabled !== false,
  };
}

async function syncNotificationIds(reminder: Reminder, notificationsEnabled = true): Promise<Reminder> {
  if (!reminder.enabled || !notificationsEnabled) return { ...reminder, notificationIds: [] };
  const from = new Date();
  const occurrences = getReminderOccurrences(reminder, from, 14);
  const notificationIds = (await Promise.all(occurrences.map((occurrence) => scheduleReminderOccurrence(reminder, occurrence)))).filter((id): id is string => Boolean(id));
  return { ...reminder, notificationIds };
}
