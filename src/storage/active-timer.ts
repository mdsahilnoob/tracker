import type { ActiveTimerState } from '../types/models';
import { readJson, removeValue, STORAGE_KEYS, writeJson } from './index';

export async function loadActiveTimer(): Promise<ActiveTimerState | null> {
  const value = await readJson<unknown>(STORAGE_KEYS.activeTimer, null);
  return isActiveTimer(value) ? value : null;
}

export async function saveActiveTimer(timer: ActiveTimerState): Promise<void> {
  await writeJson(STORAGE_KEYS.activeTimer, timer);
}

export async function clearActiveTimer(): Promise<void> {
  await removeValue(STORAGE_KEYS.activeTimer);
}

function isActiveTimer(value: unknown): value is ActiveTimerState {
  if (!value || typeof value !== 'object') return false;
  const timer = value as Partial<ActiveTimerState>;
  return (
    typeof timer.sessionId === 'string' &&
    typeof timer.startedAt === 'string' &&
    typeof timer.expectedEndAt === 'string' &&
    Number.isFinite(Date.parse(timer.startedAt)) &&
    Number.isFinite(Date.parse(timer.expectedEndAt)) &&
    typeof timer.plannedDurationMinutes === 'number' &&
    Number.isFinite(timer.plannedDurationMinutes) &&
    timer.plannedDurationMinutes >= 1 &&
    timer.plannedDurationMinutes <= 180 &&
    typeof timer.accumulatedPausedMilliseconds === 'number' &&
    Number.isFinite(timer.accumulatedPausedMilliseconds) &&
    timer.accumulatedPausedMilliseconds >= 0 &&
    (!timer.pausedAt || Number.isFinite(Date.parse(timer.pausedAt))) &&
    (timer.status === 'running' || timer.status === 'paused')
  );
}
