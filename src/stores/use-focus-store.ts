import { create } from 'zustand';

import { clearActiveTimer, loadActiveTimer, saveActiveTimer } from '../storage/active-timer';
import { loadSessions, saveSessions } from '../storage/sessions';
import { createId } from '../lib/id';
import { createActiveTimer, getElapsedFocusedMilliseconds, getRemainingSeconds } from '../lib/timer';
import { cancelFocusCompletion, scheduleFocusCompletion } from '../services/notifications';
import type { ActiveTimerState, FocusSession } from '../types/models';

interface StartTimerInput {
  plannedDurationMinutes: number;
  taskId?: string;
  taskTitle?: string;
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
}

interface FocusStore {
  sessions: FocusSession[];
  activeTimer: ActiveTimerState | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startTimer: (input: StartTimerInput) => Promise<ActiveTimerState | null>;
  pauseTimer: () => Promise<void>;
  resumeTimer: (options?: { notificationsEnabled?: boolean; soundEnabled?: boolean }) => Promise<ActiveTimerState | null>;
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
  startTimer: async ({ plannedDurationMinutes, taskId, taskTitle, notificationsEnabled = false, soundEnabled = true }) => {
    if (get().activeTimer) return null;
    const baseTimer = createActiveTimer({
      sessionId: createId('session'),
      plannedDurationMinutes,
      taskId,
      taskTitle,
    });
    const notificationId = notificationsEnabled
      ? await scheduleFocusCompletion(baseTimer, { soundEnabled })
      : undefined;
    const timer = notificationId ? { ...baseTimer, notificationId } : baseTimer;
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
    const baseTimer: ActiveTimerState = {
      ...timer,
      expectedEndAt: new Date(expectedEndMs + pauseMs).toISOString(),
      accumulatedPausedMilliseconds: timer.accumulatedPausedMilliseconds + pauseMs,
      pausedAt: undefined,
      status: 'running',
      notificationId: undefined,
    };
    const notificationId = options.notificationsEnabled
      ? await scheduleFocusCompletion(baseTimer, { soundEnabled: options.soundEnabled !== false })
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
    await cancelFocusCompletion(timer.notificationId);
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
    plannedDurationMinutes: timer.plannedDurationMinutes,
    actualDurationMinutes: Math.max(0, actualDurationMinutes),
    status,
  };
}
