import type { ActiveTimerState, AchievementUnlock, DailyPlanItem, FocusSession, FocusTask, FocusTemplate, Reminder, UserSettings } from '../types/models.ts';

export interface FocusFlowBackup {
  schemaVersion: 2;
  exportedAt: string;
  sessions: FocusSession[];
  tasks: FocusTask[];
  settings: Partial<UserSettings>;
  activeTimer: ActiveTimerState | null;
  dailyPlans: Record<string, DailyPlanItem[]>;
  templates: FocusTemplate[];
  reminders: Reminder[];
  achievements: AchievementUnlock[];
}

export function validateBackup(value: unknown): FocusFlowBackup | null {
  if (!value || typeof value !== 'object') return null;
  const backup = value as Partial<FocusFlowBackup>;
  if (backup.schemaVersion !== 2 || typeof backup.exportedAt !== 'string' || !Number.isFinite(Date.parse(backup.exportedAt))) return null;
  if (!Array.isArray(backup.sessions) || !Array.isArray(backup.tasks) || !Array.isArray(backup.templates) || !Array.isArray(backup.reminders) || !Array.isArray(backup.achievements)) return null;
  if (!backup.settings || typeof backup.settings !== 'object' || !backup.dailyPlans || typeof backup.dailyPlans !== 'object') return null;
  if (backup.activeTimer !== null && (!backup.activeTimer || typeof backup.activeTimer !== 'object')) return null;
  return backup as FocusFlowBackup;
}

export function serializeBackupCsv(backup: FocusFlowBackup): string {
  const rows: string[][] = [
    ['Sessions'],
    ['id', 'task', 'startedAt', 'endedAt', 'plannedMinutes', 'actualMinutes', 'status', 'notes'],
    ...backup.sessions.map((session) => [session.id, session.taskTitle ?? '', session.startedAt, session.endedAt, String(session.plannedDurationMinutes), String(session.actualDurationMinutes), session.status, session.notes ?? '']),
    [],
    ['Tasks'],
    ['id', 'title', 'priority', 'tags', 'recurrence', 'completed'],
    ...backup.tasks.map((task) => [task.id, task.title, task.priority ?? 'medium', (task.tags ?? []).join('|'), task.recurrence?.frequency ?? 'none', String(task.isCompleted)]),
  ];
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
}

function escapeCsv(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
