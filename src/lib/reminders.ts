import { getDateKey, getDateKeyOffset } from './dates.ts';
import type { Reminder, ReminderOccurrence } from '../types/models';

export function getReminderOccurrences(reminder: Reminder, from: Date, days: number): ReminderOccurrence[] {
  const count = Math.min(31, Math.max(0, Math.round(days)));
  const startKey = getDateKey(from);
  if (!startKey || !reminder.enabled) return [];
  return Array.from({ length: count }, (_, index) => getDateKeyOffset(startKey, index))
    .filter((date): date is string => Boolean(date) && reminder.weekdays.includes(getWeekday(date)))
    .map((date) => ({
      reminderId: reminder.id,
      date,
      title: reminder.title,
      hour: reminder.hour,
      minute: reminder.minute,
    }));
}

export function formatReminderTime(hour: number, minute: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function getWeekday(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00.000Z`).getUTCDay();
}
