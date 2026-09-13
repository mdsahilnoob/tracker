import { create } from 'zustand';

import { sanitizeTemplateTitle } from '../lib/templates';
import { createId } from '../lib/id';
import { loadTemplates, saveTemplates } from '../storage/templates';
import type { FocusTemplate } from '../types/models';

type NewTemplate = Omit<FocusTemplate, 'id'>;

interface TemplateStore {
  templates: FocusTemplate[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  addTemplate: (template: NewTemplate) => Promise<FocusTemplate | null>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateStore>()((set, get) => ({
  templates: [],
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    set({ templates: await loadTemplates(), hydrated: true });
  },
  refresh: async () => {
    set({ templates: await loadTemplates(), hydrated: true });
  },
  addTemplate: async (input) => {
    const title = sanitizeTemplateTitle(input.title);
    if (!title) return null;
    const template: FocusTemplate = {
      id: createId('template'),
      title,
      workMinutes: clamp(input.workMinutes, 1, 180, 25),
      shortBreakMinutes: clamp(input.shortBreakMinutes, 1, 60, 5),
      longBreakMinutes: clamp(input.longBreakMinutes, 1, 60, 15),
      cycles: clamp(input.cycles, 1, 12, 4),
      mode: input.mode === 'free' ? 'free' : 'pomodoro',
    };
    const templates = [...get().templates, template];
    set({ templates });
    await saveTemplates(templates);
    return template;
  },
  deleteTemplate: async (id) => {
    const templates = get().templates.filter((template) => template.id !== id);
    set({ templates });
    await saveTemplates(templates);
  },
}));

function clamp(value: number, minimum: number, maximum: number, fallback: number): number {
  return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, Math.round(value))) : fallback;
}
