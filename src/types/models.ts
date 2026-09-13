export type SessionStatus = 'completed' | 'interrupted';
export type TimerStatus = 'running' | 'paused';
export type ThemeMode = 'system' | 'light' | 'dark';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskRecurrenceFrequency = 'none' | 'daily' | 'weekdays' | 'weekly';
export type TimerMode = 'free' | 'pomodoro';
export type TimerPhase = 'focus' | 'short-break' | 'long-break';

export interface TaskRecurrence {
  frequency: TaskRecurrenceFrequency;
  interval?: number;
  weekdays?: number[];
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  startedAt: string;
  endedAt: string;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  status: SessionStatus;
  notes?: string;
  mode?: TimerMode;
  pomodoroCycle?: number;
}

export interface FocusTask {
  id: string;
  title: string;
  createdAt: string;
  completedAt?: string;
  isCompleted: boolean;
  priority?: TaskPriority;
  tags?: string[];
  recurrence?: TaskRecurrence;
  completedDates?: string[];
}

export interface UserSettings {
  defaultFocusMinutes: number;
  dailyGoalMinutes: number;
  theme: ThemeMode;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  accentColor: string;
  timerMode?: TimerMode;
  pomodoroWorkMinutes?: number;
  pomodoroShortBreakMinutes?: number;
  pomodoroLongBreakMinutes?: number;
  pomodoroCycles?: number;
  remindersEnabled?: boolean;
  animationsEnabled?: boolean;
}

export interface ActiveTimerState {
  sessionId: string;
  taskId?: string;
  taskTitle?: string;
  startedAt: string;
  expectedEndAt: string;
  plannedDurationMinutes: number;
  pausedAt?: string;
  accumulatedPausedMilliseconds: number;
  status: TimerStatus;
  notificationId?: string;
  mode?: TimerMode;
  phase?: TimerPhase;
  cycle?: number;
  totalCycles?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  pomodoroWorkMinutes?: number;
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
}

export interface DailyPlanItem {
  id: string;
  dateKey: string;
  taskId?: string;
  taskTitle: string;
  plannedMinutes: number;
  order: number;
}

export interface FocusTemplate {
  id: string;
  title: string;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cycles: number;
  mode: TimerMode;
}

export interface Reminder {
  id: string;
  title: string;
  hour: number;
  minute: number;
  weekdays: number[];
  taskId?: string;
  taskTitle?: string;
  enabled: boolean;
  notificationIds?: string[];
}

export interface ReminderOccurrence {
  reminderId: string;
  date: string;
  title: string;
  hour: number;
  minute: number;
}

export type AchievementId =
  | 'first-session'
  | 'five-sessions'
  | 'hundred-minutes'
  | 'seven-day-streak'
  | 'ten-focus-days'
  | 'long-session';

export interface AchievementUnlock {
  id: AchievementId;
  unlockedAt: string;
}
