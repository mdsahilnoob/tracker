import type { AchievementUnlock } from '../types/models';
import { readJson, STORAGE_KEYS, writeJson } from './index';

export async function loadAchievements(): Promise<AchievementUnlock[]> {
  const value = await readJson<unknown>(STORAGE_KEYS.achievements, []);
  return Array.isArray(value) ? value.filter(isAchievementUnlock) : [];
}

export async function saveAchievements(achievements: AchievementUnlock[]): Promise<void> {
  await writeJson(STORAGE_KEYS.achievements, achievements);
}

function isAchievementUnlock(value: unknown): value is AchievementUnlock {
  if (!value || typeof value !== 'object') return false;
  const achievement = value as Partial<AchievementUnlock>;
  return typeof achievement.id === 'string' && typeof achievement.unlockedAt === 'string' && Number.isFinite(Date.parse(achievement.unlockedAt));
}
