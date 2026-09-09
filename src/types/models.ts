export type SessionStatus = 'completed' | 'interrupted';
export type TimerStatus = 'running' | 'paused';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  startedAt: string;
  endedAt: string;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  status: SessionStatus;
}

export interface FocusTask {
  id: string;
  title: string;
  createdAt: string;
  completedAt?: string;
  isCompleted: boolean;
}

export interface UserSettings {
  defaultFocusMinutes: number;
  dailyGoalMinutes: number;
  theme: ThemeMode;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  accentColor: string;
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
}
