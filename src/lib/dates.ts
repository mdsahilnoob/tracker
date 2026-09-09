const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

export function getDateKey(value: Date | string | number, timeZone?: string): string {
  if (typeof value === 'string' && DATE_KEY_PATTERN.test(value)) return value;

  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getDateKeyOffset(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!DATE_KEY_PATTERN.test(dateKey) || !Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(days)) return '';
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getDateLabel(dateKey: string, todayKey = getDateKey(new Date())): string {
  if (dateKey === todayKey) return 'Today';
  if (dateKey === getDateKeyOffset(todayKey, -1)) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00.000Z`));
}

export function getWeekdayLabel(dateKey: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00.000Z`));
}

export function formatTime(value: string | Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(toDate(value));
}

export function formatDuration(minutes: number): string {
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
