import type { FocusSession } from '../types/models.ts';
import { getDateKey, getDateKeyOffset, getWeekdayLabel } from './dates.ts';

function validSessions(sessions: FocusSession[]): FocusSession[] {
  return sessions.filter((session) => {
    return Number.isFinite(session.actualDurationMinutes) && session.actualDurationMinutes >= 0;
  });
}

function getSessionDateKeys(session: FocusSession, timeZone?: string): string[] {
  const startMs = Date.parse(session.startedAt);
  const endMs = Date.parse(session.endedAt);
  const startKey = getDateKey(startMs, timeZone);
  if (!startKey) return [];
  if (!Number.isFinite(endMs) || endMs <= startMs) return [startKey];

  const endKey = getDateKey(Math.max(startMs, endMs - 1), timeZone);
  const keys = [startKey];
  let cursor = startKey;
  let guard = 0;
  while (cursor && cursor !== endKey && guard < 3660) {
    cursor = getDateKeyOffset(cursor, 1);
    if (cursor) keys.push(cursor);
    guard += 1;
  }
  return keys;
}

function sessionMinutesOnDate(session: FocusSession, dateKey: string, timeZone?: string): number {
  const actualMinutes = Math.max(0, session.actualDurationMinutes);
  const startMs = Date.parse(session.startedAt);
  const endMs = Date.parse(session.endedAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return getDateKey(session.startedAt, timeZone) === dateKey ? actualMinutes : 0;
  }

  const startKey = getDateKey(startMs, timeZone);
  const endKey = getDateKey(Math.max(startMs, endMs - 1), timeZone);
  if (startKey === endKey) return startKey === dateKey ? actualMinutes : 0;

  const wallDuration = endMs - startMs;
  const step = 60_000;
  let minutes = 0;
  for (let cursor = startMs; cursor < endMs; cursor += step) {
    const currentKey = getDateKey(cursor, timeZone);
    let sliceEnd = Math.min(endMs, cursor + step);
    if (getDateKey(Math.max(cursor, sliceEnd - 1), timeZone) !== currentKey) {
      let low = cursor + 1;
      let high = sliceEnd;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (getDateKey(middle, timeZone) === currentKey) low = middle + 1;
        else high = middle;
      }
      sliceEnd = low;
    }
    if (currentKey === dateKey) {
      minutes += actualMinutes * ((sliceEnd - cursor) / wallDuration);
    }
    cursor = sliceEnd - step;
  }
  return minutes;
}

function sessionBelongsToDate(session: FocusSession, dateKey: string, timeZone?: string): boolean {
  return sessionMinutesOnDate(session, dateKey, timeZone) > 0 || getDateKey(session.startedAt, timeZone) === dateKey;
}

export function getFocusMinutesForDate(
  sessions: FocusSession[],
  date: Date | string,
  timeZone?: string,
): number {
  const dateKey = getDateKey(date, timeZone);
  return validSessions(sessions).reduce((total, session) => {
    return total + sessionMinutesOnDate(session, dateKey, timeZone);
  }, 0);
}

export interface TodayStats {
  focusMinutes: number;
  sessionsCount: number;
  goalMinutes: number;
}

export function getTodayStats(
  sessions: FocusSession[],
  today: Date | string = new Date(),
  goalMinutes = 120,
  timeZone?: string,
): TodayStats {
  const dateKey = getDateKey(today, timeZone);
  return {
    focusMinutes: getFocusMinutesForDate(sessions, dateKey, timeZone),
    sessionsCount: validSessions(sessions).filter((session) => sessionBelongsToDate(session, dateKey, timeZone)).length,
    goalMinutes,
  };
}

export interface DayFocus {
  dateKey: string;
  label: string;
  minutes: number;
}

export function getLast7Days(
  sessions: FocusSession[],
  today: Date | string = new Date(),
  timeZone?: string,
): DayFocus[] {
  const todayKey = getDateKey(today, timeZone);
  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = getDateKeyOffset(todayKey, index - 6);
    return {
      dateKey,
      label: getWeekdayLabel(dateKey),
      minutes: getFocusMinutesForDate(sessions, dateKey, timeZone),
    };
  });
}

export interface MonthlyStats {
  focusMinutes: number;
  sessionsCount: number;
  activeDays: number;
}

export function getMonthlyStats(
  sessions: FocusSession[],
  date: Date | string = new Date(),
  timeZone?: string,
): MonthlyStats {
  const monthKey = getDateKey(date, timeZone).slice(0, 7);
  const monthSessions = validSessions(sessions).filter((session) => {
    return getSessionDateKeys(session, timeZone).some((dateKey) => dateKey.slice(0, 7) === monthKey);
  });
  const dayKeys = new Set(monthSessions.flatMap((session) => getSessionDateKeys(session, timeZone)).filter((dateKey) => dateKey.slice(0, 7) === monthKey));
  return {
    focusMinutes: [...dayKeys].reduce((total, dateKey) => total + getFocusMinutesForDate(sessions, dateKey, timeZone), 0),
    sessionsCount: monthSessions.length,
    activeDays: dayKeys.size,
  };
}

export function getLongestSession(sessions: FocusSession[]): FocusSession | undefined {
  return validSessions(sessions).reduce<FocusSession | undefined>((longest, session) => {
    if (!longest || session.actualDurationMinutes > longest.actualDurationMinutes) return session;
    return longest;
  }, undefined);
}

export interface TaskStats {
  focusMinutes: number;
  sessionsCount: number;
}

export function getTaskStats(sessions: FocusSession[], taskId: string): TaskStats {
  const taskSessions = validSessions(sessions).filter((session) => session.taskId === taskId);
  return {
    focusMinutes: taskSessions.reduce((total, session) => total + session.actualDurationMinutes, 0),
    sessionsCount: taskSessions.length,
  };
}

export function getActiveDays(sessions: FocusSession[], timeZone?: string): Set<string> {
  return new Set(
    validSessions(sessions)
      .filter((session) => session.actualDurationMinutes > 0)
      .flatMap((session) => getSessionDateKeys(session, timeZone)),
  );
}
