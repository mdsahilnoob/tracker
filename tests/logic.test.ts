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
  getProductivityTrend,
  getMostProductiveWeekday,
  getSessionCompletionRate,
} from '../src/lib/analytics.ts';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  didMeetGoalOnDate,
} from '../src/lib/streaks.ts';
import {
  createActiveTimer,
  createPomodoroTimer,
  advancePomodoroPhase,
  getRemainingSeconds,
  getTimerProgress,
} from '../src/lib/timer.ts';
import {
  getFilteredTasks,
  getPlanMinutes,
  getTaskDueState,
} from '../src/lib/tasks.ts';
import { getReminderOccurrences } from '../src/lib/reminders.ts';
import { sanitizeSessionNotes } from '../src/lib/sessions.ts';
import { serializeBackupCsv, validateBackup, type FocusFlowBackup } from '../src/lib/backup.ts';
import { shouldCelebrateGoal } from '../src/lib/goals.ts';
import {
  evaluateAchievements,
  getAchievementDefinitions,
  getAchievementProgress,
} from '../src/lib/achievements.ts';
import { getMotionDuration } from '../src/lib/motion.ts';
import { sanitizeTemplateTitle } from '../src/lib/templates.ts';
import {
  buildFocusCompletionContent,
  getFocusNotificationChannelId,
  shouldUseNativeNotifications,
} from '../src/lib/notifications.ts';
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

test('builds local completion copy with task snapshot and duration', () => {
  assert.deepEqual(buildFocusCompletionContent('Write tests', 25), {
    title: 'Focus session complete',
    body: '25 minutes on Write tests. Nice work.',
  });
  assert.deepEqual(buildFocusCompletionContent(undefined, 45), {
    title: 'Focus session complete',
    body: '45 minutes of focus complete. Nice work.',
  });
});

test('selects separate Android notification channels for sound preference', () => {
  assert.equal(getFocusNotificationChannelId(true), 'focus-complete-sound');
  assert.equal(getFocusNotificationChannelId(false), 'focus-complete-silent');
});

test('does not load native notifications inside Expo Go or on web', () => {
  assert.equal(shouldUseNativeNotifications('android', true), false);
  assert.equal(shouldUseNativeNotifications('android', false), true);
  assert.equal(shouldUseNativeNotifications('ios', true), false);
  assert.equal(shouldUseNativeNotifications('web', false), false);
});

test('streaks include both local dates touched by a session', () => {
  const crossMidnight = session('streak-midnight', '2026-08-31T23:30:00.000Z', 60);
  assert.equal(calculateLongestStreak([crossMidnight], 30, 'UTC'), 2);
});

test('recurring tasks derive due state from the local date', () => {
  const dailyTask = {
    id: 'daily', title: 'Daily review', createdAt: '2026-09-01T08:00:00.000Z', isCompleted: false,
    recurrence: { frequency: 'daily' as const, interval: 1 }, completedDates: ['2026-09-08'],
  };
  const oneOff = {
    id: 'one-off', title: 'Ship build', createdAt: '2026-09-01T08:00:00.000Z', isCompleted: true,
    recurrence: { frequency: 'none' as const }, completedDates: [],
  };
  assert.equal(getTaskDueState(dailyTask, '2026-09-08'), 'complete');
  assert.equal(getTaskDueState(dailyTask, '2026-09-09'), 'due');
  assert.equal(getTaskDueState(oneOff, '2026-09-09'), 'complete');
});

test('task filters match title or tags and sort by priority', () => {
  const tasks = [
    { id: 'low', title: 'Read notes', createdAt: '2026-09-01T08:00:00.000Z', isCompleted: false, priority: 'low' as const, tags: ['reading'] },
    { id: 'high', title: 'Ship build', createdAt: '2026-09-02T08:00:00.000Z', isCompleted: false, priority: 'high' as const, tags: ['work'] },
  ];
  assert.deepEqual(getFilteredTasks(tasks, 'work', { priority: 'all', tag: 'all', sort: 'priority' }).map((task) => task.id), ['high']);
  assert.deepEqual(getFilteredTasks(tasks, '', { priority: 'all', tag: 'all', sort: 'priority' }).map((task) => task.id), ['high', 'low']);
});

test('daily plan totals are derived from planned minutes', () => {
  assert.equal(getPlanMinutes([
    { id: 'a', dateKey: '2026-09-09', taskTitle: 'Read', plannedMinutes: 25, order: 0 },
    { id: 'b', dateKey: '2026-09-09', taskTitle: 'Write', plannedMinutes: 45, order: 1 },
  ]), 70);
});

test('pomodoro timers use work and break timestamps without changing cycle order', () => {
  const timer = createPomodoroTimer({
    nowMs: baseNow,
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cycles: 4,
  });
  assert.equal(timer.phase, 'focus');
  assert.equal(timer.cycle, 1);
  assert.equal(getRemainingSeconds(timer, baseNow + 25 * 60_000), 0);
  const shortBreak = advancePomodoroPhase(timer, baseNow + 25 * 60_000);
  assert.equal(shortBreak?.phase, 'short-break');
  assert.equal(shortBreak?.plannedDurationMinutes, 5);
  const nextFocus = shortBreak && advancePomodoroPhase(shortBreak, baseNow + 30 * 60_000);
  assert.equal(nextFocus?.phase, 'focus');
  assert.equal(nextFocus?.cycle, 2);
});

test('local reminders expand only on selected weekdays', () => {
  const occurrences = getReminderOccurrences({
    id: 'reminder', title: 'Plan the day', hour: 9, minute: 30, weekdays: [1, 3, 5], enabled: true,
  }, new Date('2026-09-14T08:00:00.000Z'), 7);
  assert.deepEqual(occurrences.map((item) => item.date), ['2026-09-14', '2026-09-16', '2026-09-18']);
});

test('session notes are trimmed and capped without changing empty notes', () => {
  assert.equal(sanitizeSessionNotes('  Good session  '), 'Good session');
  assert.equal(sanitizeSessionNotes('   '), '');
  assert.equal(sanitizeSessionNotes('x'.repeat(1200)).length, 1000);
});

test('backup validation rejects malformed envelopes and CSV escapes text', () => {
  const backup: FocusFlowBackup = {
    schemaVersion: 2,
    exportedAt: '2026-09-14T10:00:00.000Z',
    sessions: [], tasks: [], settings: {}, activeTimer: null, dailyPlans: {}, templates: [], reminders: [], achievements: [],
  };
  assert.ok(validateBackup(backup));
  assert.equal(validateBackup({ schemaVersion: 1 }), null);
  const csv = serializeBackupCsv({ ...backup, sessions: [{ id: 's1', taskTitle: 'Read, then "write"', startedAt: '2026-09-14T08:00:00.000Z', endedAt: '2026-09-14T08:25:00.000Z', plannedDurationMinutes: 25, actualDurationMinutes: 25, status: 'completed' }] });
  assert.match(csv, /"Read, then ""write"""/);
});

test('productivity analytics returns trends, completion rate, and best weekday', () => {
  const sessions = [
    session('monday', '2026-09-14T08:00:00.000Z', 30),
    session('monday-two', '2026-09-14T10:00:00.000Z', 20, { status: 'interrupted' }),
    session('tuesday', '2026-09-15T08:00:00.000Z', 60),
  ];
  const trend = getProductivityTrend(sessions, '2026-09-15', 2, 'UTC');
  assert.deepEqual(trend.map((point) => point.minutes), [50, 60]);
  assert.equal(getSessionCompletionRate(sessions), 0.667);
  assert.equal(getMostProductiveWeekday(sessions, 'UTC')?.weekday, 2);
});

test('achievement rules unlock progressively and expose progress', () => {
  const sessions = Array.from({ length: 5 }, (_, index) => session(
    `session-${index}`,
    `2026-09-${String(10 + index).padStart(2, '0')}T08:00:00.000Z`,
    index === 4 ? 60 : 25,
  ));
  const unlocked = evaluateAchievements(sessions, 25, '2026-09-14', 'UTC');
  assert.deepEqual(unlocked.map((item) => item.id), ['first-session', 'five-sessions', 'hundred-minutes', 'long-session']);
  const progress = getAchievementProgress('seven-day-streak', sessions, 25, '2026-09-14', 'UTC');
  assert.equal(progress.current, 5);
  assert.equal(progress.target, 7);
  assert.equal(getAchievementDefinitions().length, 6);
});

test('motion duration can be disabled for reduced motion', () => {
  assert.equal(getMotionDuration(240, false), 240);
  assert.equal(getMotionDuration(240, true), 0);
});

test('template titles are normalized for local storage', () => {
  assert.equal(sanitizeTemplateTitle('  Deep   work  '), 'Deep work');
  assert.equal(sanitizeTemplateTitle('   '), '');
  assert.equal(sanitizeTemplateTitle('x'.repeat(100)).length, 60);
});
