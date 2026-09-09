import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  sessions: 'focusflow:v1:sessions',
  tasks: 'focusflow:v1:tasks',
  settings: 'focusflow:v1:settings',
  activeTimer: 'focusflow:v1:active-timer',
} as const;

export async function readJson<T>(key: string, fallback: T): Promise<T> {
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
  await Promise.all(Object.values(STORAGE_KEYS).map(removeValue));
}
