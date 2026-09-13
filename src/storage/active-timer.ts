import type { ActiveTimerState, TimerMode, TimerPhase } from '../types/models';
import { readJson, removeValue, STORAGE_KEYS, writeJson } from './index';

export async function loadActiveTimer(): Promise<ActiveTimerState | null> {
  const value = await readJson<unknown>(STORAGE_KEYS.activeTimer, null);
  return normalizeActiveTimer(value);
}

export async function saveActiveTimer(timer: ActiveTimerState): Promise<void> {
  await writeJson(STORAGE_KEYS.activeTimer, timer);
}

export async function clearActiveTimer(): Promise<void> {
  await removeValue(STORAGE_KEYS.activeTimer);
}

function normalizeActiveTimer(value: unknown): ActiveTimerState | null {
  if (!value || typeof value !== 'object') return null;
  const timer = value as Partial<ActiveTimerState>;
  if (!(
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
  )) return null;
  const mode: TimerMode = timer.mode === 'pomodoro' ? 'pomodoro' : 'free';
  const phase: TimerPhase = timer.phase === 'short-break' || timer.phase === 'long-break' ? timer.phase : 'focus';
  return {
    sessionId: timer.sessionId,
    ...(timer.taskId ? { taskId: timer.taskId } : {}),
    ...(timer.taskTitle ? { taskTitle: timer.taskTitle } : {}),
    startedAt: timer.startedAt,
    expectedEndAt: timer.expectedEndAt,
    plannedDurationMinutes: timer.plannedDurationMinutes,
    ...(timer.pausedAt ? { pausedAt: timer.pausedAt } : {}),
    accumulatedPausedMilliseconds: timer.accumulatedPausedMilliseconds,
    status: timer.status,
    ...(timer.notificationId ? { notificationId: timer.notificationId } : {}),
    mode,
    phase,
    cycle: Number.isInteger(timer.cycle) && (timer.cycle ?? 0) > 0 ? timer.cycle : 1,
    totalCycles: Number.isInteger(timer.totalCycles) && (timer.totalCycles ?? 0) > 0 ? timer.totalCycles : 1,
    shortBreakMinutes: typeof timer.shortBreakMinutes === 'number' && timer.shortBreakMinutes > 0 ? timer.shortBreakMinutes : 5,
    longBreakMinutes: typeof timer.longBreakMinutes === 'number' && timer.longBreakMinutes > 0 ? timer.longBreakMinutes : 15,
    ...(typeof timer.pomodoroWorkMinutes === 'number' && timer.pomodoroWorkMinutes > 0 ? { pomodoroWorkMinutes: timer.pomodoroWorkMinutes } : {}),
    ...(typeof timer.notificationsEnabled === 'boolean' ? { notificationsEnabled: timer.notificationsEnabled } : {}),
    ...(typeof timer.soundEnabled === 'boolean' ? { soundEnabled: timer.soundEnabled } : {}),
  };
}
