import { create } from 'zustand';

import { clearActiveTimer, loadActiveTimer, saveActiveTimer } from '../storage/active-timer';
import { loadSessions, saveSessions } from '../storage/sessions';
import { createId } from '../lib/id';
import { advancePomodoroPhase, createActiveTimer, createPomodoroTimer, getElapsedFocusedMilliseconds, getRemainingSeconds } from '../lib/timer';
import { cancelFocusCompletion, scheduleFocusCompletion } from '../services/notifications';
import type { ActiveTimerState, FocusSession, TimerMode } from '../types/models';

interface StartTimerInput {
  plannedDurationMinutes: number;
  taskId?: string;
  taskTitle?: string;
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
  mode?: TimerMode;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  cycles?: number;
}

interface FocusStore {
  sessions: FocusSession[];
  activeTimer: ActiveTimerState | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  startTimer: (input: StartTimerInput) => Promise<ActiveTimerState | null>;
  pauseTimer: () => Promise<void>;
  resumeTimer: (options?: { notificationsEnabled?: boolean; soundEnabled?: boolean }) => Promise<ActiveTimerState | null>;
  finishTimer: (recordInterrupted: boolean) => Promise<FocusSession | null>;
  completeTimer: () => Promise<FocusSession | null>;
  skipBreak: () => Promise<void>;
  updateSessionNotes: (id: string, notes: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  clearSessions: () => Promise<void>;
}

export const useFocusStore = create<FocusStore>()((set, get) => ({
  sessions: [],
  activeTimer: null,
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    const [sessions, storedTimer] = await Promise.all([loadSessions(), loadActiveTimer()]);
    set({ sessions, activeTimer: storedTimer, hydrated: true });
    if (storedTimer && storedTimer.status === 'running' && getRemainingSeconds(storedTimer) <= 0) {
      await get().completeTimer();
    }
  },
  refresh: async () => {
    const [sessions, activeTimer] = await Promise.all([loadSessions(), loadActiveTimer()]);
    set({ sessions, activeTimer, hydrated: true });
  },
  startTimer: async ({ plannedDurationMinutes, taskId, taskTitle, notificationsEnabled = false, soundEnabled = true, mode = 'free', shortBreakMinutes = 5, longBreakMinutes = 15, cycles = 4 }) => {
    if (get().activeTimer) return null;
    const sessionId = createId('session');
    const baseTimer = mode === 'pomodoro'
      ? createPomodoroTimer({ sessionId, workMinutes: plannedDurationMinutes, shortBreakMinutes, longBreakMinutes, cycles, taskId, taskTitle })
      : createActiveTimer({ sessionId, plannedDurationMinutes, taskId, taskTitle });
    const configuredTimer: ActiveTimerState = { ...baseTimer, mode, notificationsEnabled, soundEnabled };
    const notificationId = notificationsEnabled
      ? await scheduleFocusCompletion(configuredTimer, { soundEnabled })
      : undefined;
    const timer = notificationId ? { ...configuredTimer, notificationId } : configuredTimer;
    set({ activeTimer: timer });
    await saveActiveTimer(timer);
    return timer;
  },
  pauseTimer: async () => {
    const timer = get().activeTimer;
    if (!timer || timer.status !== 'running') return;
    await cancelFocusCompletion(timer.notificationId);
    const pausedTimer: ActiveTimerState = {
      ...timer,
      pausedAt: new Date().toISOString(),
      status: 'paused',
      notificationId: undefined,
    };
    set({ activeTimer: pausedTimer });
    await saveActiveTimer(pausedTimer);
  },
  resumeTimer: async (options = {}) => {
    const timer = get().activeTimer;
    if (!timer || timer.status !== 'paused' || !timer.pausedAt) return null;
    const nowMs = Date.now();
    const pausedAtMs = Date.parse(timer.pausedAt);
    const expectedEndMs = Date.parse(timer.expectedEndAt);
    if (!Number.isFinite(pausedAtMs) || !Number.isFinite(expectedEndMs)) return null;
    const pauseMs = Math.max(0, nowMs - pausedAtMs);
    const notificationsEnabled = options.notificationsEnabled ?? timer.notificationsEnabled ?? false;
    const soundEnabled = options.soundEnabled ?? timer.soundEnabled ?? true;
    const baseTimer: ActiveTimerState = {
      ...timer,
      expectedEndAt: new Date(expectedEndMs + pauseMs).toISOString(),
      accumulatedPausedMilliseconds: timer.accumulatedPausedMilliseconds + pauseMs,
      pausedAt: undefined,
      status: 'running',
      notificationId: undefined,
      notificationsEnabled,
      soundEnabled,
    };
    const notificationId = notificationsEnabled
      ? await scheduleFocusCompletion(baseTimer, { soundEnabled })
      : undefined;
    const resumedTimer = notificationId ? { ...baseTimer, notificationId } : baseTimer;
    set({ activeTimer: resumedTimer });
    await saveActiveTimer(resumedTimer);
    return resumedTimer;
  },
  finishTimer: async (recordInterrupted) => {
    const timer = get().activeTimer;
    if (!timer) return null;
    await cancelFocusCompletion(timer.notificationId);
    const endedAt = new Date().toISOString();
    const isFocusPhase = (timer.phase ?? 'focus') === 'focus';
    const actualDurationMinutes = Math.floor(getElapsedFocusedMilliseconds(timer) / 60_000);
    const createdSession = recordInterrupted && isFocusPhase
      ? createSession(timer, endedAt, actualDurationMinutes, 'interrupted')
      : null;
    const sessions = createdSession ? [createdSession, ...get().sessions] : get().sessions;
    set({ activeTimer: null, sessions });
    await clearActiveTimer();
    if (createdSession) await saveSessions(sessions);
    return createdSession;
  },
  completeTimer: async () => {
    const timer = get().activeTimer;
    if (!timer || timer.status !== 'running' || getRemainingSeconds(timer) > 0) return null;
    await cancelFocusCompletion(timer.notificationId);
    if (timer.mode === 'pomodoro' && timer.phase !== 'focus') {
      const advancedTimer = advancePomodoroPhase(timer, Date.parse(timer.expectedEndAt));
      const nextTimer = advancedTimer?.phase === 'focus' ? { ...advancedTimer, sessionId: createId('session') } : advancedTimer;
      if (!nextTimer) {
        set({ activeTimer: null });
        await clearActiveTimer();
        return null;
      }
      const notificationId = timer.notificationsEnabled
        ? await scheduleFocusCompletion(nextTimer, { soundEnabled: timer.soundEnabled !== false })
        : undefined;
      const resumedTimer = notificationId ? { ...nextTimer, notificationId } : nextTimer;
      set({ activeTimer: resumedTimer });
      await saveActiveTimer(resumedTimer);
      return null;
    }
    const createdSession = createSession(timer, timer.expectedEndAt, timer.plannedDurationMinutes, 'completed');
    const sessions = [createdSession, ...get().sessions];
    const advancedTimer = timer.mode === 'pomodoro' ? advancePomodoroPhase(timer, Date.parse(timer.expectedEndAt)) : null;
    const nextTimer = advancedTimer?.phase === 'focus' ? { ...advancedTimer, sessionId: createId('session') } : advancedTimer;
    if (!nextTimer) {
      set({ activeTimer: null, sessions });
      await clearActiveTimer();
    } else {
      const notificationId = timer.notificationsEnabled
        ? await scheduleFocusCompletion(nextTimer, { soundEnabled: timer.soundEnabled !== false })
        : undefined;
      const breakTimer = notificationId ? { ...nextTimer, notificationId } : nextTimer;
      set({ activeTimer: breakTimer, sessions });
      await saveActiveTimer(breakTimer);
    }
    await saveSessions(sessions);
    return createdSession;
  },
  skipBreak: async () => {
    const timer = get().activeTimer;
    if (!timer || timer.mode !== 'pomodoro' || timer.phase === 'focus') return;
    const skippedTimer = { ...timer, expectedEndAt: new Date(Date.now() - 1).toISOString() };
    set({ activeTimer: skippedTimer });
    await saveActiveTimer(skippedTimer);
    await get().completeTimer();
  },
  updateSessionNotes: async (id, notes) => {
    const cleanedNotes = notes.trim().slice(0, 1000);
    const sessions = get().sessions.map((session) => session.id === id
      ? { ...session, ...(cleanedNotes ? { notes: cleanedNotes } : { notes: undefined }) }
      : session);
    set({ sessions });
    await saveSessions(sessions);
  },
  deleteSession: async (id) => {
    const sessions = get().sessions.filter((session) => session.id !== id);
    set({ sessions });
    await saveSessions(sessions);
  },
  clearSessions: async () => {
    await cancelFocusCompletion(get().activeTimer?.notificationId);
    set({ sessions: [], activeTimer: null });
    await Promise.all([saveSessions([]), clearActiveTimer()]);
  },
}));

function createSession(
  timer: ActiveTimerState,
  endedAt: string,
  actualDurationMinutes: number,
  status: FocusSession['status'],
): FocusSession {
  return {
    id: timer.sessionId,
    ...(timer.taskId ? { taskId: timer.taskId } : {}),
    ...(timer.taskTitle ? { taskTitle: timer.taskTitle } : {}),
    startedAt: timer.startedAt,
    endedAt,
    plannedDurationMinutes: timer.mode === 'pomodoro' ? (timer.pomodoroWorkMinutes ?? timer.plannedDurationMinutes) : timer.plannedDurationMinutes,
    actualDurationMinutes: Math.max(0, actualDurationMinutes),
    status,
    ...(timer.mode ? { mode: timer.mode } : {}),
    ...(timer.cycle && timer.mode === 'pomodoro' ? { pomodoroCycle: timer.cycle } : {}),
  };
}
