import type { FocusSession, TimerMode } from '../types/models';
import { readJson, STORAGE_KEYS, writeJson } from './index';

export async function loadSessions(): Promise<FocusSession[]> {
  const value = await readJson<unknown>(STORAGE_KEYS.sessions, []);
  return Array.isArray(value)
    ? value.map(normalizeFocusSession).filter((session): session is FocusSession => session !== null)
    : [];
}

export async function saveSessions(sessions: FocusSession[]): Promise<void> {
  await writeJson(STORAGE_KEYS.sessions, sessions);
}

export function normalizeFocusSession(value: unknown): FocusSession | null {
  if (!value || typeof value !== 'object') return null;
  const session = value as Partial<FocusSession>;
  if (!(
    typeof session.id === 'string' &&
    session.id.trim().length > 0 &&
    typeof session.startedAt === 'string' &&
    typeof session.endedAt === 'string' &&
    Number.isFinite(Date.parse(session.startedAt)) &&
    Number.isFinite(Date.parse(session.endedAt)) &&
    typeof session.plannedDurationMinutes === 'number' &&
    typeof session.actualDurationMinutes === 'number' &&
    Number.isFinite(session.plannedDurationMinutes) &&
    Number.isFinite(session.actualDurationMinutes) &&
    session.plannedDurationMinutes >= 1 &&
    session.actualDurationMinutes >= 0 &&
    (session.status === 'completed' || session.status === 'interrupted')
  )) return null;
  const mode: TimerMode | undefined = session.mode === 'pomodoro' || session.mode === 'free' ? session.mode : undefined;
  const notes = typeof session.notes === 'string' ? session.notes.trim().slice(0, 1000) : undefined;
  return {
    id: session.id,
    ...(session.taskId ? { taskId: session.taskId } : {}),
    ...(session.taskTitle ? { taskTitle: session.taskTitle } : {}),
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    plannedDurationMinutes: session.plannedDurationMinutes,
    actualDurationMinutes: session.actualDurationMinutes,
    status: session.status,
    ...(mode ? { mode } : {}),
    ...(notes ? { notes } : {}),
    ...(typeof session.pomodoroCycle === 'number' && Number.isInteger(session.pomodoroCycle) && session.pomodoroCycle > 0
      ? { pomodoroCycle: session.pomodoroCycle }
      : {}),
  };
}
