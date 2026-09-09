import type { FocusSession } from '../types/models';
import { readJson, STORAGE_KEYS, writeJson } from './index';

export async function loadSessions(): Promise<FocusSession[]> {
  const value = await readJson<unknown>(STORAGE_KEYS.sessions, []);
  return Array.isArray(value) ? value.filter(isFocusSession) : [];
}

export async function saveSessions(sessions: FocusSession[]): Promise<void> {
  await writeJson(STORAGE_KEYS.sessions, sessions);
}

function isFocusSession(value: unknown): value is FocusSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<FocusSession>;
  return (
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
  );
}
