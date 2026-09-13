import { create } from 'zustand';

import { loadTasks, saveTasks } from '../storage/tasks';
import { createId } from '../lib/id';
import type { FocusTask, TaskPriority, TaskRecurrence } from '../types/models';

export interface CreateTaskInput {
  title: string;
  priority?: TaskPriority;
  tags?: string[];
  recurrence?: TaskRecurrence;
}

export interface UpdateTaskInput {
  title?: string;
  priority?: TaskPriority;
  tags?: string[];
  recurrence?: TaskRecurrence;
}

interface TasksStore {
  tasks: FocusTask[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  addTask: (input: string | CreateTaskInput) => Promise<FocusTask | null>;
  updateTask: (id: string, input: string | UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setCompleted: (id: string, isCompleted: boolean, dateKey?: string) => Promise<void>;
  toggleRecurringCompletion: (id: string, dateKey: string, completed: boolean) => Promise<void>;
  clearTasks: () => Promise<void>;
}

export const useTasksStore = create<TasksStore>()((set, get) => ({
  tasks: [],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    set({ tasks: await loadTasks(), hydrated: true });
  },
  refresh: async () => {
    set({ tasks: await loadTasks(), hydrated: true });
  },
  addTask: async (input) => {
    const details = typeof input === 'string' ? { title: input } : input;
    const title = details.title;
    const cleanedTitle = title.trim().replace(/\s+/g, ' ').slice(0, 120);
    if (!cleanedTitle) return null;
    const task: FocusTask = {
      id: createId('task'),
      title: cleanedTitle,
      createdAt: new Date().toISOString(),
      isCompleted: false,
      priority: details.priority ?? 'medium',
      tags: normalizeTags(details.tags),
      recurrence: normalizeRecurrence(details.recurrence),
      completedDates: [],
    };
    const tasks = [task, ...get().tasks];
    set({ tasks });
    await saveTasks(tasks);
    return task;
  },
  updateTask: async (id, input) => {
    const current = get().tasks.find((task) => task.id === id);
    if (!current) return;
    const details = typeof input === 'string' ? { title: input } : input;
    const cleanedTitle = (details.title ?? current.title).trim().replace(/\s+/g, ' ').slice(0, 120);
    if (!cleanedTitle) return;
    const tasks = get().tasks.map((task) => (task.id === id ? {
      ...task,
      title: cleanedTitle,
      priority: details.priority ?? task.priority ?? 'medium',
      tags: details.tags ? normalizeTags(details.tags) : task.tags ?? [],
      recurrence: details.recurrence ? normalizeRecurrence(details.recurrence) : task.recurrence ?? { frequency: 'none' },
    } : task));
    set({ tasks });
    await saveTasks(tasks);
  },
  deleteTask: async (id) => {
    const tasks = get().tasks.filter((task) => task.id !== id);
    set({ tasks });
    await saveTasks(tasks);
  },
  setCompleted: async (id, isCompleted, dateKey) => {
    const task = get().tasks.find((item) => item.id === id);
    if (task?.recurrence?.frequency !== 'none' && task?.recurrence && dateKey) {
      await get().toggleRecurringCompletion(id, dateKey, isCompleted);
      return;
    }
    const tasks = get().tasks.map((task) => (
      task.id === id
        ? { ...task, isCompleted, completedAt: isCompleted ? new Date().toISOString() : undefined }
        : task
    ));
    set({ tasks });
    await saveTasks(tasks);
  },
  toggleRecurringCompletion: async (id, dateKey, completed) => {
    const tasks = get().tasks.map((task) => {
      if (task.id !== id) return task;
      const completedDates = new Set(task.completedDates ?? []);
      if (completed) completedDates.add(dateKey);
      else completedDates.delete(dateKey);
      return { ...task, isCompleted: false, completedDates: [...completedDates].sort().slice(-366) };
    });
    set({ tasks });
    await saveTasks(tasks);
  },
  clearTasks: async () => {
    set({ tasks: [] });
    await saveTasks([]);
  },
}));

function normalizeTags(tags: string[] | undefined): string[] {
  return [...new Set((tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
}

function normalizeRecurrence(recurrence: TaskRecurrence | undefined): TaskRecurrence {
  if (!recurrence || recurrence.frequency === 'none') return { frequency: 'none' };
  return {
    frequency: recurrence.frequency,
    interval: Math.min(12, Math.max(1, Math.round(recurrence.interval ?? 1))),
    ...(recurrence.weekdays?.length ? { weekdays: [...new Set(recurrence.weekdays)].sort() } : {}),
  };
}
