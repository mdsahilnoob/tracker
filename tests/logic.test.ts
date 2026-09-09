import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatCountdown,
  formatDuration,
  getDateKey,
  getDateKeyOffset,
} from '../src/lib/dates.ts';
import {
  getFocusMinutesForDate,
  getLast7Days,
  getLongestSession,
  getMonthlyStats,
  getTaskStats,
  getTodayStats,
} from '../src/lib/analytics.ts';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  didMeetGoalOnDate,
} from '../src/lib/streaks.ts';
import {
  createActiveTimer,
  getRemainingSeconds,
  getTimerProgress,
} from '../src/lib/timer.ts';
import { shouldCelebrateGoal } from '../src/lib/goals.ts';
import type { FocusSession } from '../src/types/models.ts';

const baseNow = Date.parse('2026-09-09T10:00:00.000Z');

function session(
  id: string,
  startedAt: string,
  actualDurationMinutes: number,
  options: Partial<FocusSession> = {},
): FocusSession {
  return {
    id,
    startedAt,
    endedAt: new Date(Date.parse(startedAt) + actualDurationMinutes * 60_000).toISOString(),
    plannedDurationMinutes: actualDurationMinutes,
    actualDurationMinutes,
    status: 'completed',
    ...options,
  };
}

test('date helpers use local date keys and move across month boundaries', () => {
  assert.equal(getDateKey('2026-09-09T00:30:00.000Z', 'UTC'), '2026-09-09');
  assert.equal(getDateKey('2026-09-09T23:30:00.000Z', 'America/Los_Angeles'), '2026-09-09');
  assert.equal(getDateKeyOffset('2026-09-01', -1), '2026-08-31');
  assert.equal(getDateKeyOffset('2026-12-31', 1), '2027-01-01');
});

test('date and display helpers fail safely for invalid input', () => {
  assert.equal(getDateKeyOffset('2026-02-30', 1), '');
  assert.equal(getDateKeyOffset('2026-02-01', Number.NaN), '');
  assert.equal(formatDuration(Number.NaN), '0m');
  assert.equal(formatCountdown(Number.NaN), '00:00');
});

test('timestamp timer reports remaining time and progress without counting paused time', () => {
  const timer = createActiveTimer({
    nowMs: baseNow,
    plannedDurationMinutes: 25,
    taskId: 'task-1',
    taskTitle: 'Write tests',
  });

  assert.equal(getRemainingSeconds(timer, baseNow + 5 * 60_000), 20 * 60);
  assert.equal(getTimerProgress(timer, baseNow + 5 * 60_000), 0.2);

  const pausedTimer = {
    ...timer,
    status: 'paused' as const,
    pausedAt: new Date(baseNow + 5 * 60_000).toISOString(),
  };
  assert.equal(getRemainingSeconds(pausedTimer, baseNow + 15 * 60_000), 20 * 60);
});

test('today, week, month, longest session, and task stats derive from sessions', () => {
  const sessions = [
    session('one', '2026-09-09T08:00:00.000Z', 45, { taskId: 'task-1', taskTitle: 'Write tests' }),
    session('two', '2026-09-08T08:00:00.000Z', 25, { taskId: 'task-1', taskTitle: 'Write tests' }),
    session('three', '2026-09-01T08:00:00.000Z', 60, { taskId: 'task-2', taskTitle: 'Read docs' }),
    session('four', '2026-08-31T23:30:00.000Z', 30, { status: 'interrupted' }),
  ];

  assert.equal(getFocusMinutesForDate(sessions, '2026-09-09', 'UTC'), 45);
  assert.deepEqual(getTodayStats(sessions, '2026-09-09', 120, 'UTC'), {
    focusMinutes: 45,
    sessionsCount: 1,
    goalMinutes: 120,
  });
  assert.equal(getLast7Days(sessions, '2026-09-09', 'UTC').at(-1)?.minutes, 45);
  assert.equal(getLast7Days(sessions, '2026-09-09', 'UTC').reduce((sum, day) => sum + day.minutes, 0), 70);
  assert.deepEqual(getMonthlyStats(sessions, '2026-09-09', 'UTC'), {
    focusMinutes: 130,
    sessionsCount: 3,
    activeDays: 3,
  });
  assert.equal(getLongestSession(sessions)?.id, 'three');
  assert.deepEqual(getTaskStats(sessions, 'task-1'), {
    focusMinutes: 70,
    sessionsCount: 2,
  });
});

test('goal completion and streaks handle zero, current, and longest streaks', () => {
  const sessions = [
    session('a', '2026-09-09T08:00:00.000Z', 60),
    session('b', '2026-09-08T08:00:00.000Z', 60),
    session('c', '2026-09-07T08:00:00.000Z', 60),
    session('d', '2026-09-05T08:00:00.000Z', 60),
    session('e', '2026-09-03T08:00:00.000Z', 60),
  ];

  assert.equal(didMeetGoalOnDate(sessions, '2026-09-09', 60, 'UTC'), true);
  assert.equal(calculateCurrentStreak(sessions, 60, '2026-09-09', 'UTC'), 3);
  assert.equal(calculateLongestStreak(sessions, 60, 'UTC'), 3);
  assert.equal(calculateCurrentStreak([], 60, '2026-09-09', 'UTC'), 0);
});

test('analytics splits a session at a local midnight', () => {
  const crossMidnight = session('midnight', '2026-09-09T23:59:30.000Z', 2);
  const beforeMidnight = getFocusMinutesForDate([crossMidnight], '2026-09-09', 'UTC');
  const afterMidnight = getFocusMinutesForDate([crossMidnight], '2026-09-10', 'UTC');
  assert.ok(Math.abs(beforeMidnight - 0.5) < 0.001);
  assert.ok(Math.abs(afterMidnight - 1.5) < 0.001);
  const monthBoundary = session('month-boundary', '2026-08-31T23:59:30.000Z', 2);
  const september = getMonthlyStats([monthBoundary], '2026-09-10', 'UTC');
  assert.equal(september.activeDays, 1);
  assert.ok(Math.abs(september.focusMinutes - 1.5) < 0.001);
});

test('timer helpers fail safely for malformed persisted timestamps', () => {
  const timer = createActiveTimer({ nowMs: baseNow, plannedDurationMinutes: 25 });
  assert.equal(getRemainingSeconds({ ...timer, expectedEndAt: 'not-a-date' }, baseNow), 0);
  assert.equal(getTimerProgress({ ...timer, pausedAt: 'not-a-date', status: 'paused' }, baseNow), 0);
  assert.equal(createActiveTimer({ nowMs: baseNow, plannedDurationMinutes: Number.NaN }).plannedDurationMinutes, 25);
  assert.ok(Number.isFinite(Date.parse(createActiveTimer({ nowMs: Number.NaN, plannedDurationMinutes: 25 }).startedAt)));
});

test('goal celebration only fires when a session crosses the goal', () => {
  assert.equal(shouldCelebrateGoal(null, 120, 120), false);
  assert.equal(shouldCelebrateGoal(119, 120, 120), true);
  assert.equal(shouldCelebrateGoal(120, 140, 120), false);
});

test('streaks include both local dates touched by a session', () => {
  const crossMidnight = session('streak-midnight', '2026-08-31T23:30:00.000Z', 60);
  assert.equal(calculateLongestStreak([crossMidnight], 30, 'UTC'), 2);
});
