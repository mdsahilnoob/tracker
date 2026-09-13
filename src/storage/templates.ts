import type { FocusTemplate } from '../types/models';
import { readJson, STORAGE_KEYS, writeJson } from './index';

export async function loadTemplates(): Promise<FocusTemplate[]> {
  const value = await readJson<unknown>(STORAGE_KEYS.templates, []);
  return Array.isArray(value) ? value.map(normalizeTemplate).filter((template): template is FocusTemplate => template !== null) : [];
}

export async function saveTemplates(templates: FocusTemplate[]): Promise<void> {
  await writeJson(STORAGE_KEYS.templates, templates.map(normalizeTemplate).filter((template): template is FocusTemplate => template !== null));
}

function normalizeTemplate(value: unknown): FocusTemplate | null {
  if (!value || typeof value !== 'object') return null;
  const template = value as Partial<FocusTemplate>;
  if (typeof template.id !== 'string' || typeof template.title !== 'string') return null;
  return {
    id: template.id,
    title: template.title.trim().slice(0, 60),
    workMinutes: valid(template.workMinutes, 25, 180),
    shortBreakMinutes: valid(template.shortBreakMinutes, 5, 60),
    longBreakMinutes: valid(template.longBreakMinutes, 15, 60),
    cycles: valid(template.cycles, 4, 12),
    mode: template.mode === 'free' ? 'free' : 'pomodoro',
  };
}

function valid(value: unknown, fallback: number, maximum: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(maximum, Math.max(1, Math.round(value))) : fallback;
}
