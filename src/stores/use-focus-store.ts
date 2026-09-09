import { create } from 'zustand';

import { clearActiveTimer, loadActiveTimer, saveActiveTimer } from '../storage/active-timer';
import { loadSessions, saveSessions } from '../storage/sessions';
import { createId } from '../lib/id';
import { createActiveTimer, getElapsedFocusedMilliseconds, getRemainingSeconds } from '../lib/timer';
import type { ActiveTimerState, FocusSession } from '../types/models';

interface StartTimerInput {
  plannedDurationMinutes: number;
  taskId?: string;
  taskTitle?: string;
}

interface FocusStore {
  sessions: FocusSession[];
  activeTimer: ActiveTimerState | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startTimer: (input: StartTimerInput) => Promise<ActiveTimerState | null>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<ActiveTimerState | null>;
  finishTimer: (recordInterrupted: boolean) => Promise<FocusSession | null>;
  completeTimer: () => Promise<FocusSession | null>;
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
  startTimer: async ({ plannedDurationMinutes, taskId, taskTitle }) => {
    if (get().activeTimer) return null;
    const timer = createActiveTimer({
      sessionId: createId('session'),
      plannedDurationMinutes,
      taskId,
      taskTitle,
    });
    set({ activeTimer: timer });
    await saveActiveTimer(timer);
    return timer;
  },
  pauseTimer: async () => {
    const timer = get().activeTimer;
    if (!timer || timer.status !== 'running') return;
    const pausedTimer: ActiveTimerState = {
      ...timer,
      pausedAt: new Date().toISOString(),
      status: 'paused',
    };
    set({ activeTimer: pausedTimer });
    await saveActiveTimer(pausedTimer);
  },
  resumeTimer: async () => {
    const timer = get().activeTimer;
    if (!timer || timer.status !== 'paused' || !timer.pausedAt) return null;
    const nowMs = Date.now();
    const pauseMs = Math.max(0, nowMs - Date.parse(timer.pausedAt));
    const resumedTimer: ActiveTimerState = {
      ...timer,
      expectedEndAt: new Date(Date.parse(timer.expectedEndAt) + pauseMs).toISOString(),
      accumulatedPausedMilliseconds: timer.accumulatedPausedMilliseconds + pauseMs,
      pausedAt: undefined,
      status: 'running',
    };
    set({ activeTimer: resumedTimer });
    await saveActiveTimer(resumedTimer);
    return resumedTimer;
  },
  finishTimer: async (recordInterrupted) => {
    const timer = get().activeTimer;
    if (!timer) return null;
    const endedAt = new Date().toISOString();
    const actualDurationMinutes = Math.floor(getElapsedFocusedMilliseconds(timer) / 60_000);
    const createdSession = recordInterrupted
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
    const createdSession = createSession(timer, timer.expectedEndAt, timer.plannedDurationMinutes, 'completed');
    const sessions = [createdSession, ...get().sessions];
    set({ activeTimer: null, sessions });
    await clearActiveTimer();
    await saveSessions(sessions);
    return createdSession;
  },
  deleteSession: async (id) => {
    const sessions = get().sessions.filter((session) => session.id !== id);
    set({ sessions });
    await saveSessions(sessions);
  },
  clearSessions: async () => {
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
    plannedDurationMinutes: timer.plannedDurationMinutes,
    actualDurationMinutes: Math.max(0, actualDurationMinutes),
    status,
  };
}
