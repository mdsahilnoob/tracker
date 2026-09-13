import type { FocusTask, TaskPriority, TaskRecurrence } from '../types/models';
import { readJson, STORAGE_KEYS, writeJson } from './index';

export async function loadTasks(): Promise<FocusTask[]> {
  const value = await readJson<unknown>(STORAGE_KEYS.tasks, []);
  return Array.isArray(value)
    ? value.map(normalizeFocusTask).filter((task): task is FocusTask => task !== null)
    : [];
}

export async function saveTasks(tasks: FocusTask[]): Promise<void> {
  await writeJson(STORAGE_KEYS.tasks, tasks);
}

export function normalizeFocusTask(value: unknown): FocusTask | null {
  if (!value || typeof value !== 'object') return null;
  const task = value as Partial<FocusTask>;
  if (!(
    typeof task.id === 'string' &&
    task.id.trim().length > 0 &&
    typeof task.title === 'string' &&
    task.title.trim().length > 0 &&
    task.title.length <= 120 &&
    typeof task.createdAt === 'string' &&
    Number.isFinite(Date.parse(task.createdAt)) &&
    (task.completedAt === undefined || (typeof task.completedAt === 'string' && Number.isFinite(Date.parse(task.completedAt)))) &&
    typeof task.isCompleted === 'boolean'
  )) return null;
  const priority: TaskPriority = task.priority === 'low' || task.priority === 'high' ? task.priority : 'medium';
  const recurrence = normalizeRecurrence(task.recurrence);
  const tags = Array.isArray(task.tags)
    ? [...new Set(task.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 12)
    : [];
  const completedDates = Array.isArray(task.completedDates)
    ? [...new Set(task.completedDates.filter((date): date is string => /^\d{4}-\d{2}-\d{2}$/.test(date)))].slice(-366)
    : [];
  return {
    id: task.id,
    title: task.title,
    createdAt: task.createdAt,
    ...(task.completedAt ? { completedAt: task.completedAt } : {}),
    isCompleted: task.isCompleted,
    priority,
    tags,
    recurrence,
    completedDates,
  };
}

function normalizeRecurrence(value: unknown): TaskRecurrence {
  if (!value || typeof value !== 'object') return { frequency: 'none' };
  const recurrence = value as Partial<TaskRecurrence>;
  const frequency = recurrence.frequency === 'daily' || recurrence.frequency === 'weekdays' || recurrence.frequency === 'weekly'
    ? recurrence.frequency
    : 'none';
  const interval = typeof recurrence.interval === 'number' && Number.isFinite(recurrence.interval)
    ? Math.min(12, Math.max(1, Math.round(recurrence.interval)))
    : 1;
  const weekdays = Array.isArray(recurrence.weekdays)
    ? [...new Set(recurrence.weekdays.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6))].sort()
    : undefined;
  return { frequency, interval, ...(weekdays?.length ? { weekdays } : {}) };
}
