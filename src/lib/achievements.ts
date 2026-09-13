import type { AchievementId, AchievementUnlock, FocusSession } from '../types/models.ts';
import { getActiveDays } from './analytics.ts';
import { getDateKey } from './dates.ts';
import { calculateCurrentStreak, calculateLongestStreak } from './streaks.ts';

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  target: number;
  unit: string;
}

export interface AchievementProgress {
  current: number;
  target: number;
  unlocked: boolean;
}

const DEFINITIONS: AchievementDefinition[] = [
  { id: 'first-session', title: 'First light', description: 'Complete your first focus session.', target: 1, unit: 'session' },
  { id: 'five-sessions', title: 'Finding a rhythm', description: 'Complete five focus sessions.', target: 5, unit: 'sessions' },
  { id: 'hundred-minutes', title: 'Deep waters', description: 'Accumulate 100 focused minutes.', target: 100, unit: 'minutes' },
  { id: 'seven-day-streak', title: 'Steady flame', description: 'Meet your daily goal for seven days in a row.', target: 7, unit: 'day streak' },
  { id: 'ten-focus-days', title: 'Showing up', description: 'Focus on ten different days.', target: 10, unit: 'focus days' },
  { id: 'long-session', title: 'Long view', description: 'Complete a 60-minute focus session.', target: 60, unit: 'minutes' },
];

export function getAchievementDefinitions(): AchievementDefinition[] {
  return DEFINITIONS.map((definition) => ({ ...definition }));
}

function productiveSessions(sessions: FocusSession[]): FocusSession[] {
  return sessions.filter((session) => Number.isFinite(session.actualDurationMinutes) && session.actualDurationMinutes > 0);
}

export function getAchievementProgress(
  id: AchievementId,
  sessions: FocusSession[],
  goalMinutes: number,
  today: Date | string = new Date(),
  timeZone?: string,
): AchievementProgress {
  const usable = productiveSessions(sessions);
  const values: Record<AchievementId, number> = {
    'first-session': usable.length,
    'five-sessions': usable.filter((session) => session.status === 'completed').length,
    'hundred-minutes': usable.reduce((sum, session) => sum + session.actualDurationMinutes, 0),
    'seven-day-streak': calculateCurrentStreak(sessions, goalMinutes, today, timeZone),
    'ten-focus-days': getActiveDays(sessions, timeZone).size,
    'long-session': usable.reduce((longest, session) => Math.max(longest, session.actualDurationMinutes), 0),
  };
  const definition = DEFINITIONS.find((item) => item.id === id) ?? DEFINITIONS[0];
  const current = Math.max(0, values[id]);
  return { current, target: definition.target, unlocked: current >= definition.target };
}

export function evaluateAchievements(
  sessions: FocusSession[],
  goalMinutes: number,
  today: Date | string = new Date(),
  timeZone?: string,
  unlockedAt = new Date().toISOString(),
): AchievementUnlock[] {
  return DEFINITIONS
    .filter((definition) => getAchievementProgress(definition.id, sessions, goalMinutes, today, timeZone).unlocked)
    .map((definition) => ({ id: definition.id, unlockedAt }));
}

export function mergeAchievementUnlocks(existing: AchievementUnlock[], discovered: AchievementUnlock[]): AchievementUnlock[] {
  const known = new Map(existing.map((unlock) => [unlock.id, unlock]));
  for (const unlock of discovered) if (!known.has(unlock.id)) known.set(unlock.id, unlock);
  return [...known.values()];
}

export function getAchievementDateKey(unlock: AchievementUnlock): string {
  return getDateKey(unlock.unlockedAt);
}

export function getLongestGoalStreak(sessions: FocusSession[], goalMinutes: number, timeZone?: string): number {
  return calculateLongestStreak(sessions, goalMinutes, timeZone);
}
