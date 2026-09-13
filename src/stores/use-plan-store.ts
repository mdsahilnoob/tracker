import { create } from 'zustand';

import { getDateKey } from '../lib/dates';
import { createId } from '../lib/id';
import { loadDailyPlan, saveDailyPlan } from '../storage/plans';
import type { DailyPlanItem, FocusTask } from '../types/models';

interface PlanStore {
  dateKey: string;
  items: DailyPlanItem[];
  hydrated: boolean;
  hydrate: (dateKey?: string) => Promise<void>;
  refresh: () => Promise<void>;
  addItem: (task: FocusTask, plannedMinutes: number) => Promise<void>;
  addFreeItem: (title: string, plannedMinutes: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  reorder: (fromIndex: number, toIndex: number) => Promise<void>;
  clear: () => Promise<void>;
}

export const usePlanStore = create<PlanStore>()((set, get) => ({
  dateKey: getDateKey(new Date()),
  items: [],
  hydrated: false,
  hydrate: async (dateKey = getDateKey(new Date())) => {
    if (get().hydrated && get().dateKey === dateKey) return;
    set({ dateKey, items: await loadDailyPlan(dateKey), hydrated: true });
  },
  refresh: async () => {
    set({ items: await loadDailyPlan(get().dateKey), hydrated: true });
  },
  addItem: async (task, plannedMinutes) => {
    const cleanedTitle = task.title.trim().replace(/\s+/g, ' ').slice(0, 120);
    if (!cleanedTitle) return;
    const item: DailyPlanItem = {
      id: createId('plan'),
      dateKey: get().dateKey,
      taskId: task.id,
      taskTitle: cleanedTitle,
      plannedMinutes: Math.min(720, Math.max(1, Math.round(plannedMinutes))),
      order: get().items.length,
    };
    const items = [...get().items, item];
    set({ items });
    await saveDailyPlan(get().dateKey, items);
  },
  addFreeItem: async (title, plannedMinutes) => {
    const cleanedTitle = title.trim().replace(/\s+/g, ' ').slice(0, 120);
    if (!cleanedTitle) return;
    const item: DailyPlanItem = {
      id: createId('plan'),
      dateKey: get().dateKey,
      taskTitle: cleanedTitle,
      plannedMinutes: Math.min(720, Math.max(1, Math.round(plannedMinutes))),
      order: get().items.length,
    };
    const items = [...get().items, item];
    set({ items });
    await saveDailyPlan(get().dateKey, items);
  },
  removeItem: async (id) => {
    const items = get().items.filter((item) => item.id !== id).map((item, order) => ({ ...item, order }));
    set({ items });
    await saveDailyPlan(get().dateKey, items);
  },
  reorder: async (fromIndex, toIndex) => {
    const items = [...get().items];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) return;
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    const ordered = items.map((item, order) => ({ ...item, order }));
    set({ items: ordered });
    await saveDailyPlan(get().dateKey, ordered);
  },
  clear: async () => {
    set({ items: [] });
    await saveDailyPlan(get().dateKey, []);
  },
}));
