import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  sessions: 'focusflow:v2:sessions',
  tasks: 'focusflow:v2:tasks',
  settings: 'focusflow:v2:settings',
  activeTimer: 'focusflow:v2:active-timer',
  dailyPlans: 'focusflow:v2:daily-plans',
  templates: 'focusflow:v2:templates',
  reminders: 'focusflow:v2:reminders',
  achievements: 'focusflow:v2:achievements',
} as const;

const LEGACY_STORAGE_KEYS = {
  sessions: 'focusflow:v1:sessions',
  tasks: 'focusflow:v1:tasks',
  settings: 'focusflow:v1:settings',
  activeTimer: 'focusflow:v1:active-timer',
} as const;

const MIGRATION_KEY = 'focusflow:storage-version';
let migrationPromise: Promise<void> | null = null;

export function ensureStorageMigrated(): Promise<void> {
  migrationPromise ??= migrateLegacyStorage();
  return migrationPromise;
}

async function migrateLegacyStorage(): Promise<void> {
  try {
    if ((await AsyncStorage.getItem(MIGRATION_KEY)) === '2') return;
    const migrations: [string, string, unknown][] = [
      [STORAGE_KEYS.sessions, LEGACY_STORAGE_KEYS.sessions, []],
      [STORAGE_KEYS.tasks, LEGACY_STORAGE_KEYS.tasks, []],
      [STORAGE_KEYS.settings, LEGACY_STORAGE_KEYS.settings, {}],
      [STORAGE_KEYS.activeTimer, LEGACY_STORAGE_KEYS.activeTimer, null],
    ];
    for (const [currentKey, legacyKey, fallback] of migrations) {
      const [current, legacy] = await AsyncStorage.multiGet([currentKey, legacyKey]);
      if (current[1] !== null || legacy[1] === null) continue;
      let value = fallback;
      try {
        value = JSON.parse(legacy[1]);
      } catch {
        // The corresponding loader will use the same safe fallback for corrupt JSON.
      }
      await AsyncStorage.setItem(currentKey, JSON.stringify(value));
      await AsyncStorage.removeItem(legacyKey);
    }
    await AsyncStorage.setItem(MIGRATION_KEY, '2');
  } catch {
    // A storage failure must never prevent the app from loading in memory.
  }
}

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  await ensureStorageMigrated();
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence should never take the app down. The in-memory state remains usable.
  }
}

export async function removeValue(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Persistence should never take the app down.
  }
}

export async function clearFocusData(): Promise<void> {
  await Promise.all([
    ...Object.values(STORAGE_KEYS),
    ...Object.values(LEGACY_STORAGE_KEYS),
    MIGRATION_KEY,
  ].map(removeValue));
  migrationPromise = null;
}
