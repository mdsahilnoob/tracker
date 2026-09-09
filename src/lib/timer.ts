import type { ActiveTimerState } from '../types/models.ts';

export interface CreateActiveTimerInput {
  nowMs?: number;
  plannedDurationMinutes: number;
  taskId?: string;
  taskTitle?: string;
  sessionId?: string;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createActiveTimer({
  nowMs = Date.now(),
  plannedDurationMinutes,
  taskId,
  taskTitle,
  sessionId = `session-${nowMs}`,
}: CreateActiveTimerInput): ActiveTimerState {
  const safeDuration = clamp(Math.round(plannedDurationMinutes), 1, 180);
  return {
    sessionId,
    ...(taskId ? { taskId } : {}),
    ...(taskTitle ? { taskTitle } : {}),
    startedAt: new Date(nowMs).toISOString(),
    expectedEndAt: new Date(nowMs + safeDuration * 60_000).toISOString(),
    plannedDurationMinutes: safeDuration,
    accumulatedPausedMilliseconds: 0,
    status: 'running',
  };
}

export function getElapsedFocusedMilliseconds(timer: ActiveTimerState, nowMs = Date.now()): number {
  const startMs = Date.parse(timer.startedAt);
  if (Number.isNaN(startMs)) return 0;

  const effectiveNow = timer.status === 'paused' && timer.pausedAt
    ? Date.parse(timer.pausedAt)
    : nowMs;
  const elapsed = effectiveNow - startMs - timer.accumulatedPausedMilliseconds;
  return clamp(elapsed, 0, timer.plannedDurationMinutes * 60_000);
}

export function getRemainingMilliseconds(timer: ActiveTimerState, nowMs = Date.now()): number {
  if (timer.status === 'paused' && timer.pausedAt) {
    return Math.max(0, Date.parse(timer.expectedEndAt) - Date.parse(timer.pausedAt));
  }
  return Math.max(0, Date.parse(timer.expectedEndAt) - nowMs);
}

export function getRemainingSeconds(timer: ActiveTimerState, nowMs = Date.now()): number {
  return Math.ceil(getRemainingMilliseconds(timer, nowMs) / 1000);
}

export function getTimerProgress(timer: ActiveTimerState, nowMs = Date.now()): number {
  const total = timer.plannedDurationMinutes * 60_000;
  if (total <= 0) return 1;
  return clamp(getElapsedFocusedMilliseconds(timer, nowMs) / total, 0, 1);
}
