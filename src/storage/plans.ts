import type { DailyPlanItem } from '../types/models';
import { readJson, STORAGE_KEYS, writeJson } from './index';

export type StoredPlans = Record<string, DailyPlanItem[]>;

export async function loadDailyPlan(dateKey: string): Promise<DailyPlanItem[]> {
  const plans = await readJson<unknown>(STORAGE_KEYS.dailyPlans, {});
  if (!plans || typeof plans !== 'object') return [];
  const items = (plans as StoredPlans)[dateKey];
  return Array.isArray(items)
    ? items.map(normalizePlanItem).filter((item): item is DailyPlanItem => item !== null).sort((a, b) => a.order - b.order)
    : [];
}

export async function saveDailyPlan(dateKey: string, items: DailyPlanItem[]): Promise<void> {
  const plans = await readJson<StoredPlans>(STORAGE_KEYS.dailyPlans, {});
  const safeItems = items
    .map(normalizePlanItem)
    .filter((item): item is DailyPlanItem => item !== null)
    .map((item, order) => ({ ...item, dateKey, order }));
  await writeJson(STORAGE_KEYS.dailyPlans, { ...plans, [dateKey]: safeItems });
}

export async function loadAllPlans(): Promise<StoredPlans> {
  const plans = await readJson<unknown>(STORAGE_KEYS.dailyPlans, {});
  if (!plans || typeof plans !== 'object') return {};
  return Object.fromEntries(Object.entries(plans).map(([dateKey, value]) => [
    dateKey,
    Array.isArray(value) ? value.map(normalizePlanItem).filter((item): item is DailyPlanItem => item !== null) : [],
  ]));
}

export async function saveAllPlans(plans: StoredPlans): Promise<void> {
  await writeJson(STORAGE_KEYS.dailyPlans, plans);
}

function normalizePlanItem(value: unknown): DailyPlanItem | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<DailyPlanItem>;
  if (typeof item.id !== 'string' || typeof item.dateKey !== 'string' || typeof item.taskTitle !== 'string') return null;
  return {
    id: item.id,
    dateKey: item.dateKey,
    ...(typeof item.taskId === 'string' ? { taskId: item.taskId } : {}),
    taskTitle: item.taskTitle.trim().slice(0, 120),
    plannedMinutes: typeof item.plannedMinutes === 'number' && Number.isFinite(item.plannedMinutes)
      ? Math.min(720, Math.max(1, Math.round(item.plannedMinutes)))
      : 25,
    order: typeof item.order === 'number' && Number.isFinite(item.order) ? Math.max(0, Math.round(item.order)) : 0,
  };
}
