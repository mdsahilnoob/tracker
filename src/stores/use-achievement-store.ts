import { create } from 'zustand';

import { evaluateAchievements, mergeAchievementUnlocks } from '../lib/achievements';
import { loadAchievements, saveAchievements } from '../storage/achievements';
import type { AchievementUnlock, FocusSession } from '../types/models';

interface AchievementStore {
  unlocks: AchievementUnlock[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  sync: (sessions: FocusSession[], goalMinutes: number, today?: Date | string) => Promise<void>;
}

export const useAchievementStore = create<AchievementStore>()((set, get) => ({
  unlocks: [],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    set({ unlocks: await loadAchievements(), hydrated: true });
  },
  refresh: async () => {
    set({ unlocks: await loadAchievements(), hydrated: true });
  },
  sync: async (sessions, goalMinutes, today = new Date()) => {
    const existing = get().hydrated ? get().unlocks : await loadAchievements();
    const merged = mergeAchievementUnlocks(existing, evaluateAchievements(sessions, goalMinutes, today));
    set({ unlocks: merged, hydrated: true });
    if (merged.length !== existing.length) await saveAchievements(merged);
  },
}));
