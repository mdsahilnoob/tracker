import { create } from 'zustand';

import type { UserSettings } from '../types/models';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../storage/settings';

interface SettingsStore {
  settings: UserSettings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    set({ settings: await loadSettings(), hydrated: true });
  },
  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await saveSettings(settings);
  },
  resetSettings: async () => {
    set({ settings: DEFAULT_SETTINGS });
    await saveSettings(DEFAULT_SETTINGS);
  },
}));
