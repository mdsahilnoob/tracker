import type { FocusTask } from '../types/models';
import { readJson, STORAGE_KEYS, writeJson } from './index';

export async function loadTasks(): Promise<FocusTask[]> {
  const value = await readJson<unknown>(STORAGE_KEYS.tasks, []);
  return Array.isArray(value) ? value.filter(isFocusTask) : [];
}

export async function saveTasks(tasks: FocusTask[]): Promise<void> {
  await writeJson(STORAGE_KEYS.tasks, tasks);
}

function isFocusTask(value: unknown): value is FocusTask {
  if (!value || typeof value !== 'object') return false;
  const task = value as Partial<FocusTask>;
  return (
    typeof task.id === 'string' &&
    task.id.trim().length > 0 &&
    typeof task.title === 'string' &&
    task.title.trim().length > 0 &&
    task.title.length <= 120 &&
    typeof task.createdAt === 'string' &&
    Number.isFinite(Date.parse(task.createdAt)) &&
    (task.completedAt === undefined || (typeof task.completedAt === 'string' && Number.isFinite(Date.parse(task.completedAt)))) &&
    typeof task.isCompleted === 'boolean'
  );
}
