import type { ThemeMode, UserSettings } from '../types/models';
import { readJson, STORAGE_KEYS, writeJson } from './index';

export const DEFAULT_SETTINGS: UserSettings = {
  defaultFocusMinutes: 25,
  dailyGoalMinutes: 120,
  theme: 'system',
  soundEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: true,
  accentColor: '#FF7657',
  timerMode: 'free',
  pomodoroWorkMinutes: 25,
  pomodoroShortBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  pomodoroCycles: 4,
  remindersEnabled: true,
  animationsEnabled: true,
};

const validThemes: ThemeMode[] = ['system', 'light', 'dark'];
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export async function loadSettings(): Promise<UserSettings> {
  const value = await readJson<unknown>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  if (!value || typeof value !== 'object') return DEFAULT_SETTINGS;
  const settings = value as Partial<UserSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    defaultFocusMinutes: validMinutes(settings.defaultFocusMinutes, DEFAULT_SETTINGS.defaultFocusMinutes),
    dailyGoalMinutes: validGoal(settings.dailyGoalMinutes, DEFAULT_SETTINGS.dailyGoalMinutes),
    theme: validThemes.includes(settings.theme as ThemeMode) ? (settings.theme as ThemeMode) : DEFAULT_SETTINGS.theme,
    soundEnabled: settings.soundEnabled !== false,
    hapticsEnabled: settings.hapticsEnabled !== false,
    notificationsEnabled: settings.notificationsEnabled !== false,
    accentColor: typeof settings.accentColor === 'string' && HEX_COLOR_PATTERN.test(settings.accentColor)
      ? settings.accentColor
      : DEFAULT_SETTINGS.accentColor,
    timerMode: settings.timerMode === 'pomodoro' ? 'pomodoro' : DEFAULT_SETTINGS.timerMode,
    pomodoroWorkMinutes: validMinutes(settings.pomodoroWorkMinutes, DEFAULT_SETTINGS.pomodoroWorkMinutes ?? 25),
    pomodoroShortBreakMinutes: validSmallMinutes(settings.pomodoroShortBreakMinutes, 5),
    pomodoroLongBreakMinutes: validSmallMinutes(settings.pomodoroLongBreakMinutes, 15),
    pomodoroCycles: validCycles(settings.pomodoroCycles, 4),
    remindersEnabled: settings.remindersEnabled !== false,
    animationsEnabled: settings.animationsEnabled !== false,
  };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await writeJson(STORAGE_KEYS.settings, settings);
}

function validMinutes(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 180
    ? Math.round(value)
    : fallback;
}

function validGoal(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 1440
    ? Math.round(value)
    : fallback;
}

function validSmallMinutes(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 60 ? Math.round(value) : fallback;
}

function validCycles(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 12 ? Math.round(value) : fallback;
}
