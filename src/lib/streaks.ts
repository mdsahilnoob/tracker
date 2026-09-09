import type { FocusSession } from '../types/models.ts';
import { getDateKey, getDateKeyOffset } from './dates.ts';
import { getFocusMinutesForDate } from './analytics.ts';

export function didMeetGoalOnDate(
  sessions: FocusSession[],
  date: Date | string,
  goalMinutes: number,
  timeZone?: string,
): boolean {
  return goalMinutes > 0 && getFocusMinutesForDate(sessions, date, timeZone) >= goalMinutes;
}

export function calculateCurrentStreak(
  sessions: FocusSession[],
  goalMinutes: number,
  today: Date | string = new Date(),
  timeZone?: string,
): number {
  if (goalMinutes <= 0) return 0;
  const todayKey = getDateKey(today, timeZone);
  let cursor = didMeetGoalOnDate(sessions, todayKey, goalMinutes, timeZone)
    ? todayKey
    : getDateKeyOffset(todayKey, -1);
  let streak = 0;
  while (didMeetGoalOnDate(sessions, cursor, goalMinutes, timeZone)) {
    streak += 1;
    cursor = getDateKeyOffset(cursor, -1);
  }
  return streak;
}

export function calculateLongestStreak(
  sessions: FocusSession[],
  goalMinutes: number,
  timeZone?: string,
): number {
  if (goalMinutes <= 0 || sessions.length === 0) return 0;
  const dateKeys = sessions
    .map((session) => getDateKey(session.startedAt, timeZone))
    .filter(Boolean)
    .sort();
  if (dateKeys.length === 0) return 0;

  let cursor = dateKeys[0];
  const lastDate = dateKeys[dateKeys.length - 1];
  let longest = 0;
  let current = 0;
  while (cursor <= lastDate) {
    if (didMeetGoalOnDate(sessions, cursor, goalMinutes, timeZone)) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
    cursor = getDateKeyOffset(cursor, 1);
  }
  return longest;
}
