import type { ActiveTimerState } from '../types/models.ts';

export interface CreateActiveTimerInput {
  nowMs?: number;
  plannedDurationMinutes: number;
  taskId?: string;
  taskTitle?: string;
  sessionId?: string;
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

export function createActiveTimer({
  nowMs = Date.now(),
  plannedDurationMinutes,
  taskId,
  taskTitle,
  sessionId,
}: CreateActiveTimerInput): ActiveTimerState {
  const safeNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const safeSessionId = sessionId?.trim() || `session-${safeNowMs}`;
  const safeDuration = Number.isFinite(plannedDurationMinutes)
    ? clamp(Math.round(plannedDurationMinutes), 1, 180)
    : 25;
  return {
    sessionId: safeSessionId,
    ...(taskId ? { taskId } : {}),
    ...(taskTitle ? { taskTitle } : {}),
    startedAt: new Date(safeNowMs).toISOString(),
    expectedEndAt: new Date(safeNowMs + safeDuration * 60_000).toISOString(),
    plannedDurationMinutes: safeDuration,
    accumulatedPausedMilliseconds: 0,
    status: 'running',
  };
}

export function getElapsedFocusedMilliseconds(timer: ActiveTimerState, nowMs = Date.now()): number {
  const startMs = Date.parse(timer.startedAt);
  if (Number.isNaN(startMs)) return 0;

  const effectiveNow = timer.status === 'paused' && timer.pausedAt ? Date.parse(timer.pausedAt) : nowMs;
  if (!Number.isFinite(effectiveNow) || !Number.isFinite(timer.accumulatedPausedMilliseconds)) return 0;
  const elapsed = effectiveNow - startMs - timer.accumulatedPausedMilliseconds;
  return clamp(elapsed, 0, timer.plannedDurationMinutes * 60_000);
}

export function getRemainingMilliseconds(timer: ActiveTimerState, nowMs = Date.now()): number {
  const expectedEndMs = Date.parse(timer.expectedEndAt);
  if (!Number.isFinite(expectedEndMs)) return 0;
  if (timer.status === 'paused' && timer.pausedAt) {
    const pausedAtMs = Date.parse(timer.pausedAt);
    return Number.isFinite(pausedAtMs) ? Math.max(0, expectedEndMs - pausedAtMs) : 0;
  }
  return Number.isFinite(nowMs) ? Math.max(0, expectedEndMs - nowMs) : 0;
}

export function getRemainingSeconds(timer: ActiveTimerState, nowMs = Date.now()): number {
  return Math.ceil(getRemainingMilliseconds(timer, nowMs) / 1000);
}

export function getTimerProgress(timer: ActiveTimerState, nowMs = Date.now()): number {
  const total = timer.plannedDurationMinutes * 60_000;
  if (total <= 0) return 1;
  return clamp(getElapsedFocusedMilliseconds(timer, nowMs) / total, 0, 1);
}
