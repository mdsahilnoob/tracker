import { Platform } from 'react-native';

import { validateBackup, serializeBackupCsv, type FocusFlowBackup } from '../lib/backup';
import { clearActiveTimer, loadActiveTimer, saveActiveTimer } from '../storage/active-timer';
import { loadAllPlans, saveAllPlans } from '../storage/plans';
import { loadAchievements, saveAchievements } from '../storage/achievements';
import { loadReminders, saveReminders } from '../storage/reminders';
import { loadSessions, saveSessions } from '../storage/sessions';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../storage/settings';
import { loadTasks, saveTasks } from '../storage/tasks';
import { loadTemplates, saveTemplates } from '../storage/templates';

export async function buildBackupSnapshot(): Promise<FocusFlowBackup> {
  const [sessions, tasks, settings, activeTimer, dailyPlans, templates, reminders, achievements] = await Promise.all([
    loadSessions(), loadTasks(), loadSettings(), loadActiveTimer(), loadAllPlans(), loadTemplates(), loadReminders(), loadAchievements(),
  ]);
  return { schemaVersion: 2, exportedAt: new Date().toISOString(), sessions, tasks, settings, activeTimer, dailyPlans, templates, reminders, achievements };
}

export async function restoreBackup(snapshot: FocusFlowBackup): Promise<boolean> {
  const validated = validateBackup(snapshot);
  if (!validated) return false;
  await Promise.all([
    saveSessions(validated.sessions),
    saveTasks(validated.tasks),
    saveSettings({ ...DEFAULT_SETTINGS, ...validated.settings }),
    validated.activeTimer ? saveActiveTimer(validated.activeTimer) : clearActiveTimer(),
    saveAllPlans(validated.dailyPlans),
    saveTemplates(validated.templates),
    saveReminders(validated.reminders),
    saveAchievements(validated.achievements),
  ]);
  return true;
}

export async function exportBackup(format: 'json' | 'csv'): Promise<boolean> {
  const snapshot = await buildBackupSnapshot();
  const content = format === 'json' ? JSON.stringify(snapshot, null, 2) : serializeBackupCsv(snapshot);
  const filename = `focusflow-backup-${new Date().toISOString().slice(0, 10)}.${format}`;
  if (Platform.OS === 'web') {
    downloadOnWeb(content, filename, format === 'json' ? 'application/json' : 'text/csv');
    return true;
  }
  try {
    const [{ File, Paths }, Sharing] = await Promise.all([import('expo-file-system'), import('expo-sharing')]);
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(content);
    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(file.uri, { dialogTitle: 'Export FocusFlow backup' });
    return true;
  } catch {
    return false;
  }
}

export async function importBackupFromPicker(): Promise<'restored' | 'cancelled' | 'invalid' | 'unavailable'> {
  if (Platform.OS === 'web') return importBackupOnWeb();
  try {
    const { File } = await import('expo-file-system');
    const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/json'] });
    if (picked.canceled || !picked.result) return 'cancelled';
    const parsed: unknown = JSON.parse(picked.result.textSync());
    const validated = validateBackup(parsed);
    return validated && await restoreBackup(validated) ? 'restored' : 'invalid';
  } catch {
    return 'invalid';
  }
}

function downloadOnWeb(content: string, filename: string, mimeType: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importBackupOnWeb(): Promise<'restored' | 'cancelled' | 'invalid' | 'unavailable'> {
  if (typeof document === 'undefined') return Promise.resolve('unavailable');
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve('cancelled'); return; }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const parsed: unknown = JSON.parse(String(reader.result));
          const validated = validateBackup(parsed);
          resolve(validated && await restoreBackup(validated) ? 'restored' : 'invalid');
        } catch {
          resolve('invalid');
        }
      };
      reader.onerror = () => resolve('invalid');
      reader.readAsText(file);
    };
    input.click();
  });
}
