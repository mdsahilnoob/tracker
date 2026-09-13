import type { DailyPlanItem, FocusTask, TaskPriority } from '../types/models';

export interface TaskFilters {
  priority: TaskPriority | 'all';
  tag: string | 'all';
  sort: 'priority' | 'title' | 'created';
}

export type TaskDueState = 'due' | 'complete' | 'upcoming';

export function getTaskDueState(task: FocusTask, dateKey: string): TaskDueState {
  const recurrence = task.recurrence?.frequency ?? 'none';
  if (recurrence === 'none') return task.isCompleted ? 'complete' : 'due';
  if (dateKey < task.createdAt.slice(0, 10)) return 'upcoming';
  if (task.completedDates?.includes(dateKey)) return 'complete';

  const weekday = getWeekday(dateKey);
  if (recurrence === 'weekdays' && (weekday === 0 || weekday === 6)) return 'upcoming';
  if (recurrence === 'weekly') {
    const recurrenceDays = task.recurrence?.weekdays?.length ? task.recurrence.weekdays : [getWeekday(task.createdAt.slice(0, 10))];
    if (!recurrenceDays.includes(weekday)) return 'upcoming';
    const interval = task.recurrence?.interval ?? 1;
    const daysSinceCreation = Math.floor((dateToUtcMs(dateKey) - dateToUtcMs(task.createdAt.slice(0, 10))) / 86_400_000);
    if (Math.floor(daysSinceCreation / 7) % interval !== 0) return 'upcoming';
  }
  return 'due';
}

export function getFilteredTasks(tasks: FocusTask[], query: string, filters: TaskFilters): FocusTask[] {
  const normalizedQuery = query.trim().toLowerCase();
  return tasks
    .filter((task) => {
      const matchesQuery = !normalizedQuery || task.title.toLowerCase().includes(normalizedQuery) || (task.tags ?? []).some((tag) => tag.includes(normalizedQuery));
      const matchesPriority = filters.priority === 'all' || (task.priority ?? 'medium') === filters.priority;
      const matchesTag = filters.tag === 'all' || (task.tags ?? []).includes(filters.tag);
      return matchesQuery && matchesPriority && matchesTag;
    })
    .sort((a, b) => {
      if (filters.sort === 'title') return a.title.localeCompare(b.title);
      if (filters.sort === 'created') return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      return priorityRank(b.priority) - priorityRank(a.priority) || Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
}

export function getPlanMinutes(items: DailyPlanItem[]): number {
  return items.reduce((total, item) => total + Math.max(0, item.plannedMinutes), 0);
}

export function priorityRank(priority: TaskPriority | undefined): number {
  return priority === 'high' ? 3 : priority === 'low' ? 1 : 2;
}

function getWeekday(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00.000Z`).getUTCDay();
}

function dateToUtcMs(dateKey: string): number {
  return Date.parse(`${dateKey}T00:00:00.000Z`);
}
