import { create } from 'zustand';

import { loadTasks, saveTasks } from '../storage/tasks';
import { createId } from '../lib/id';
import type { FocusTask } from '../types/models';

interface TasksStore {
  tasks: FocusTask[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addTask: (title: string) => Promise<FocusTask | null>;
  updateTask: (id: string, title: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setCompleted: (id: string, isCompleted: boolean) => Promise<void>;
  clearTasks: () => Promise<void>;
}

export const useTasksStore = create<TasksStore>()((set, get) => ({
  tasks: [],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    set({ tasks: await loadTasks(), hydrated: true });
  },
  addTask: async (title) => {
    const cleanedTitle = title.trim().replace(/\s+/g, ' ').slice(0, 120);
    if (!cleanedTitle) return null;
    const task: FocusTask = {
      id: createId('task'),
      title: cleanedTitle,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };
    const tasks = [task, ...get().tasks];
    set({ tasks });
    await saveTasks(tasks);
    return task;
  },
  updateTask: async (id, title) => {
    const cleanedTitle = title.trim().replace(/\s+/g, ' ').slice(0, 120);
    if (!cleanedTitle) return;
    const tasks = get().tasks.map((task) => (task.id === id ? { ...task, title: cleanedTitle } : task));
    set({ tasks });
    await saveTasks(tasks);
  },
  deleteTask: async (id) => {
    const tasks = get().tasks.filter((task) => task.id !== id);
    set({ tasks });
    await saveTasks(tasks);
  },
  setCompleted: async (id, isCompleted) => {
    const tasks = get().tasks.map((task) => (
      task.id === id
        ? { ...task, isCompleted, completedAt: isCompleted ? new Date().toISOString() : undefined }
        : task
    ));
    set({ tasks });
    await saveTasks(tasks);
  },
  clearTasks: async () => {
    set({ tasks: [] });
    await saveTasks([]);
  },
}));
