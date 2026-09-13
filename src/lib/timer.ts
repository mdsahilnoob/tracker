import type { ActiveTimerState, TimerMode, TimerPhase } from '../types/models.ts';

export interface CreateActiveTimerInput {
  nowMs?: number;
  plannedDurationMinutes: number;
  taskId?: string;
  taskTitle?: string;
  sessionId?: string;
  mode?: TimerMode;
  phase?: TimerPhase;
  cycle?: number;
  totalCycles?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  pomodoroWorkMinutes?: number;
}

export interface PomodoroTimerInput {
  nowMs?: number;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cycles: number;
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
  mode = 'free',
  phase = 'focus',
  cycle = 1,
  totalCycles = 1,
  shortBreakMinutes = 5,
  longBreakMinutes = 15,
  pomodoroWorkMinutes,
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
    mode,
    phase,
    cycle,
    totalCycles,
    shortBreakMinutes,
    longBreakMinutes,
    ...(pomodoroWorkMinutes ? { pomodoroWorkMinutes } : {}),
  };
}

export function createPomodoroTimer(input: PomodoroTimerInput): ActiveTimerState {
  return createActiveTimer({
    nowMs: input.nowMs,
    plannedDurationMinutes: input.workMinutes,
    taskId: input.taskId,
    taskTitle: input.taskTitle,
    sessionId: input.sessionId,
    mode: 'pomodoro',
    phase: 'focus',
    cycle: 1,
    totalCycles: clamp(Math.round(input.cycles), 1, 12),
    shortBreakMinutes: clamp(Math.round(input.shortBreakMinutes), 1, 60),
    longBreakMinutes: clamp(Math.round(input.longBreakMinutes), 1, 60),
    pomodoroWorkMinutes: clamp(Math.round(input.workMinutes), 1, 180),
  });
}

export function advancePomodoroPhase(timer: ActiveTimerState, nowMs = Date.now()): ActiveTimerState | null {
  if (timer.mode !== 'pomodoro' || getRemainingMilliseconds(timer, nowMs) > 0) return timer;
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  if (timer.phase === 'long-break') return null;
  const nextPhase: TimerPhase = timer.phase === 'focus'
    ? ((timer.cycle ?? 1) >= (timer.totalCycles ?? 1) ? 'long-break' : 'short-break')
    : 'focus';
  const nextCycle = nextPhase === 'focus' ? (timer.cycle ?? 1) + 1 : (timer.cycle ?? 1);
  const duration = nextPhase === 'focus'
    ? (timer.pomodoroWorkMinutes ?? timer.plannedDurationMinutes)
    : nextPhase === 'short-break' ? (timer.shortBreakMinutes ?? 5) : (timer.longBreakMinutes ?? 15);
  return {
    ...timer,
    startedAt: new Date(safeNow).toISOString(),
    expectedEndAt: new Date(safeNow + duration * 60_000).toISOString(),
    plannedDurationMinutes: duration,
    pausedAt: undefined,
    accumulatedPausedMilliseconds: 0,
    status: 'running',
    phase: nextPhase,
    cycle: nextCycle,
    notificationId: undefined,
  };
}

export function getPhaseLabel(timer: ActiveTimerState): string {
  if (timer.mode !== 'pomodoro' || timer.phase === 'focus') return 'In focus';
  return timer.phase === 'long-break' ? 'Long break' : 'Short break';
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
