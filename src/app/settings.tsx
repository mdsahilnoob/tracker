import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ReminderEditorSheet } from '@/components/reminders/reminder-editor-sheet';
import { AppScreen } from '@/components/ui/app-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldSheet } from '@/components/ui/field-sheet';
import { Icon } from '@/components/ui/icon';
import { SectionHeader } from '@/components/ui/section-header';
import { AccentColors, Colors } from '@/constants/theme';
import { CREATOR_NAME } from '@/constants/branding';
import { useAppTheme } from '@/hooks/use-app-theme';
import { exportBackup, importBackupFromPicker } from '@/services/backup';
import { clearFocusData } from '@/storage';
import { useFocusStore } from '@/stores/use-focus-store';
import { useAchievementStore } from '@/stores/use-achievement-store';
import { usePlanStore } from '@/stores/use-plan-store';
import { useReminderStore } from '@/stores/use-reminder-store';
import { useSettingsStore } from '@/stores/use-settings-store';
import { useTasksStore } from '@/stores/use-tasks-store';
import { useTemplateStore } from '@/stores/use-template-store';
import type { Reminder, TimerMode } from '@/types/models';

type Editor = 'focus' | 'pomodoroWork' | 'goal' | 'shortBreak' | 'longBreak' | 'cycles' | null;
type AppColors = { [Key in keyof typeof Colors.light]: string };

export default function SettingsScreen() {
  const { colors, accent } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const resetSettings = useSettingsStore((state) => state.resetSettings);
  const refreshSettings = useSettingsStore((state) => state.refresh);
  const refreshFocus = useFocusStore((state) => state.refresh);
  const refreshTasks = useTasksStore((state) => state.refresh);
  const sessionsCount = useFocusStore((state) => state.sessions.length);
  const refreshPlan = usePlanStore((state) => state.refresh);
  const refreshTemplates = useTemplateStore((state) => state.refresh);
  const refreshAchievements = useAchievementStore((state) => state.refresh);
  const reminders = useReminderStore((state) => state.reminders);
  const hydrateReminders = useReminderStore((state) => state.hydrate);
  const refreshReminders = useReminderStore((state) => state.refresh);
  const addReminder = useReminderStore((state) => state.addReminder);
  const updateReminder = useReminderStore((state) => state.updateReminder);
  const deleteReminder = useReminderStore((state) => state.deleteReminder);
  const syncReminderNotifications = useReminderStore((state) => state.syncNotifications);
  const [editor, setEditor] = useState<Editor>(null);
  const [editorValue, setEditorValue] = useState('');
  const [editorError, setEditorError] = useState('');
  const [reminderEditorVisible, setReminderEditorVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  useEffect(() => { void hydrateReminders(); }, [hydrateReminders]);

  function openEditor(type: Exclude<Editor, null>) {
    const values: Record<Exclude<Editor, null>, number> = {
      focus: settings.defaultFocusMinutes,
      pomodoroWork: settings.pomodoroWorkMinutes ?? settings.defaultFocusMinutes,
      goal: settings.dailyGoalMinutes,
      shortBreak: settings.pomodoroShortBreakMinutes ?? 5,
      longBreak: settings.pomodoroLongBreakMinutes ?? 15,
      cycles: settings.pomodoroCycles ?? 4,
    };
    setEditor(type); setEditorValue(String(values[type])); setEditorError('');
  }

  async function saveEditor() {
    if (!editor) return;
    const value = Number(editorValue);
    const maximum = editor === 'goal' ? 1440 : editor === 'focus' || editor === 'pomodoroWork' ? 180 : editor === 'cycles' ? 12 : 60;
    if (!Number.isFinite(value) || value < 1 || value > maximum) { setEditorError(`Choose a value between 1 and ${maximum}.`); return; }
    const rounded = Math.round(value);
    const patch = editor === 'focus' ? { defaultFocusMinutes: rounded } : editor === 'pomodoroWork' ? { pomodoroWorkMinutes: rounded } : editor === 'goal' ? { dailyGoalMinutes: rounded } : editor === 'shortBreak' ? { pomodoroShortBreakMinutes: rounded } : editor === 'longBreak' ? { pomodoroLongBreakMinutes: rounded } : { pomodoroCycles: rounded };
    await updateSettings(patch);
    setEditor(null);
  }

  async function deleteAllData() {
    await clearFocusData();
    await resetSettings();
    await Promise.all([refreshFocus(), refreshTasks(), refreshSettings(), refreshReminders(), refreshPlan(), refreshTemplates(), refreshAchievements()]);
  }

  function deleteAll() {
    Alert.alert('Delete all focus data?', 'This permanently removes your tasks, sessions, plans, reminders, and streak history stored on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete everything', style: 'destructive', onPress: () => { void deleteAllData(); } },
    ]);
  }

  async function handleImport() {
    const result = await importBackupFromPicker();
    if (result === 'restored') {
      await Promise.all([refreshFocus(), refreshTasks(), refreshSettings(), refreshReminders(), refreshPlan(), refreshTemplates(), refreshAchievements()]);
      Alert.alert('Backup restored', 'Your local FocusFlow data is back on this device.');
    } else if (result === 'invalid') Alert.alert('Could not restore backup', 'Choose a valid FocusFlow JSON backup file.');
  }

  function saveReminder(input: { title: string; hour: number; minute: number; weekdays: number[]; taskTitle?: string; enabled?: boolean }) {
    const notificationsEnabled = settings.remindersEnabled !== false;
    if (editingReminder) void updateReminder(editingReminder.id, input, notificationsEnabled).then(() => setReminderEditorVisible(false));
    else void addReminder(input, notificationsEnabled).then(() => setReminderEditorVisible(false));
  }

  return <AppScreen>
    <View style={styles.header}><Text style={[styles.eyebrow, { color: accent }]}>PERSONALIZE</Text><Text style={[styles.title, { color: colors.text }]}>Settings</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Keep FocusFlow tuned to your rhythm.</Text></View>
    <SectionHeader title="Focus" />
    <Card><SettingRow icon={{ ios: 'timer', android: 'timer', web: 'timer' }} label="Default focus duration" value={`${settings.defaultFocusMinutes} min`} colors={colors} onPress={() => openEditor('focus')} /><PresetChips values={[15, 25, 45, 60]} selected={settings.defaultFocusMinutes} suffix="m" onSelect={(value) => void updateSettings({ defaultFocusMinutes: value })} colors={colors} accent={accent} /><SettingRow icon={{ ios: 'target', android: 'track_changes', web: 'track_changes' }} label="Daily focus goal" value={`${settings.dailyGoalMinutes} min`} colors={colors} onPress={() => openEditor('goal')} /><PresetChips values={[30, 60, 90, 120, 180, 240]} selected={settings.dailyGoalMinutes} suffix="m" onSelect={(value) => void updateSettings({ dailyGoalMinutes: value })} colors={colors} accent={accent} /></Card>
    <SectionHeader title="Timer" />
    <Card><Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Default mode</Text><ModeSegments value={settings.timerMode ?? 'free'} colors={colors} accent={accent} onChange={(timerMode) => void updateSettings({ timerMode })} /><ToggleRow icon={{ ios: 'speaker.wave.2', android: 'volume_up', web: 'volume_up' }} label="Completion sound" value={settings.soundEnabled} colors={colors} onPress={() => void updateSettings({ soundEnabled: !settings.soundEnabled })} /><ToggleRow icon={{ ios: 'hand.tap', android: 'vibration', web: 'vibration' }} label="Haptic feedback" value={settings.hapticsEnabled} colors={colors} onPress={() => void updateSettings({ hapticsEnabled: !settings.hapticsEnabled })} /><ToggleRow icon={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }} label="Notifications" value={settings.notificationsEnabled} colors={colors} onPress={() => void updateSettings({ notificationsEnabled: !settings.notificationsEnabled })} /><ToggleRow icon={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} label="Animations" value={settings.animationsEnabled !== false} colors={colors} onPress={() => void updateSettings({ animationsEnabled: settings.animationsEnabled === false })} /></Card>
    <SectionHeader title="Pomodoro" />
    <Card><SettingRow icon={{ ios: 'timer', android: 'timer', web: 'timer' }} label="Work interval" value={`${settings.pomodoroWorkMinutes ?? settings.defaultFocusMinutes} min`} colors={colors} onPress={() => openEditor('pomodoroWork')} /><SettingRow icon={{ ios: 'pause.circle', android: 'pause_circle_outline', web: 'pause_circle_outline' }} label="Short break" value={`${settings.pomodoroShortBreakMinutes ?? 5} min`} colors={colors} onPress={() => openEditor('shortBreak')} /><SettingRow icon={{ ios: 'moon.zzz', android: 'bedtime', web: 'bedtime' }} label="Long break" value={`${settings.pomodoroLongBreakMinutes ?? 15} min`} colors={colors} onPress={() => openEditor('longBreak')} /><SettingRow icon={{ ios: 'repeat', android: 'autorenew', web: 'autorenew' }} label="Cycles" value={`${settings.pomodoroCycles ?? 4}`} colors={colors} onPress={() => openEditor('cycles')} /><PresetChips values={[2, 4, 6, 8]} selected={settings.pomodoroCycles ?? 4} suffix=" cycles" onSelect={(value) => void updateSettings({ pomodoroCycles: value })} colors={colors} accent={accent} /></Card>
    <SectionHeader title="Reminders" />
    <Card><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Local reminders stay on this device and never use an account.</Text><ToggleRow icon={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }} label="Schedule reminders" value={settings.remindersEnabled !== false} colors={colors} onPress={() => { const enabled = settings.remindersEnabled === false; void updateSettings({ remindersEnabled: enabled }).then(() => syncReminderNotifications(enabled)); }} />{reminders.map((reminder) => <View key={reminder.id} style={[styles.reminderRow, { borderBottomColor: colors.border }]}><View style={styles.reminderCopy}><Text style={[styles.rowLabel, { color: colors.text }]}>{reminder.title}</Text><Text style={[styles.reminderMeta, { color: colors.textSecondary }]}>{formatReminderDays(reminder.weekdays)} · {formatReminderTime(reminder.hour, reminder.minute)}</Text></View><Pressable accessibilityRole="switch" accessibilityState={{ checked: reminder.enabled }} onPress={() => { void updateReminder(reminder.id, { enabled: !reminder.enabled }, settings.remindersEnabled !== false); }} style={[styles.toggle, { backgroundColor: reminder.enabled ? '#42A878' : colors.backgroundSelected }]}><View style={[styles.toggleKnob, { alignSelf: reminder.enabled ? 'flex-end' : 'flex-start' }]} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Edit ${reminder.title}`} onPress={() => { setEditingReminder(reminder); setReminderEditorVisible(true); }} style={styles.iconHit}><Icon name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={17} color={colors.textSecondary} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${reminder.title}`} onPress={() => { void deleteReminder(reminder.id); }} style={styles.iconHit}><Icon name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }} size={17} color={colors.textSecondary} /></Pressable></View>)}<Button onPress={() => { setEditingReminder(null); setReminderEditorVisible(true); }} variant="secondary" style={styles.reminderButton}>Add reminder</Button></Card>
    <SectionHeader title="Appearance" />
    <Card><Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Theme</Text><View style={styles.segmented}>{(['system', 'light', 'dark'] as const).map((theme) => <Pressable key={theme} accessibilityRole="button" accessibilityState={{ selected: settings.theme === theme }} onPress={() => void updateSettings({ theme })} style={[styles.segment, { backgroundColor: settings.theme === theme ? accent : colors.backgroundSelected }]}><Text style={{ color: settings.theme === theme ? '#FFFFFF' : colors.text, fontWeight: '800', textTransform: 'capitalize' }}>{theme}</Text></Pressable>)}</View><Text style={[styles.optionLabel, { color: colors.textSecondary, marginTop: 20 }]}>Accent color</Text><View style={styles.colors}>{AccentColors.map((color) => <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Use accent ${color}`} accessibilityState={{ selected: settings.accentColor === color }} onPress={() => void updateSettings({ accentColor: color })} style={[styles.colorSwatch, { backgroundColor: color, borderColor: settings.accentColor === color ? colors.text : 'transparent' }]}><Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={15} color="#FFFFFF" /></Pressable>)}</View></Card>
    <SectionHeader title="Data" />
    <Card><Text style={[styles.dataCount, { color: colors.text }]}>{sessionsCount} session{sessionsCount === 1 ? '' : 's'} stored locally</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your data never leaves this device.</Text><View style={styles.dataActions}><Button onPress={() => { void exportBackup('json'); }} variant="secondary" style={styles.dataButton}>Export JSON</Button><Button onPress={() => { void exportBackup('csv'); }} variant="secondary" style={styles.dataButton}>Export CSV</Button></View><Button onPress={() => { void handleImport(); }} variant="secondary" style={styles.dataButton}>Import backup</Button><Button onPress={deleteAll} variant="danger" style={styles.deleteButton}>Delete all focus data</Button></Card>
    <SectionHeader title="About" />
    <Card>
      <View style={styles.aboutBrand}>
        <Image accessibilityLabel="FocusFlow logo" source={require('../../assets/images/icon.png')} resizeMode="contain" style={styles.aboutLogo} />
        <View style={styles.aboutCopy}>
          <Text style={[styles.aboutName, { color: colors.text }]}>FocusFlow</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Version {Constants.expoConfig?.version ?? '1.0.0'} · Offline by design</Text>
        </View>
      </View>
      <View style={[styles.creatorCredit, { borderTopColor: colors.border }]}>
        <Image accessibilityLabel="Noob AI creator logo" source={require('../../assets/images/mdsahilnoob_logo.png')} resizeMode="cover" style={styles.creatorLogo} />
        <View style={styles.creatorCopy}>
          <Text style={[styles.creatorLabel, { color: colors.textSecondary }]}>Created by</Text>
          <Text style={[styles.creatorName, { color: colors.text }]}>{CREATOR_NAME}</Text>
        </View>
      </View>
      <Text style={[styles.privacy, { color: colors.textSecondary }]}>Your focus data stays on your device. FocusFlow does not require an account and does not upload your productivity data.</Text>
    </Card>
    <FieldSheet visible={editor !== null} title={editor === 'focus' ? 'Focus minutes' : editor === 'pomodoroWork' ? 'Pomodoro work interval' : editor === 'goal' ? 'Daily focus goal' : editor === 'shortBreak' ? 'Short break' : editor === 'longBreak' ? 'Long break' : 'Pomodoro cycles'} value={editorValue} placeholder="Value" submitLabel="Save" helperText="This setting is stored locally." errorText={editorError} keyboardType="number-pad" onChangeText={(value) => { setEditorValue(value); setEditorError(''); }} onCancel={() => setEditor(null)} onSubmit={() => { void saveEditor(); }} />
    <ReminderEditorSheet key={reminderEditorVisible ? editingReminder?.id ?? 'new' : 'closed'} visible={reminderEditorVisible} reminder={editingReminder} colors={colors} accent={accent} onCancel={() => setReminderEditorVisible(false)} onSave={saveReminder} />
  </AppScreen>;
}

function SettingRow({ icon, label, value, colors, onPress }: { icon: Parameters<typeof Icon>[0]['name']; label: string; value: string; colors: AppColors; onPress: () => void }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.row, { borderBottomColor: colors.border }]}><View style={styles.rowLead}><Icon name={icon} size={19} color={colors.textSecondary} /><Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text></View><View style={styles.rowValue}><Text style={{ color: colors.textSecondary, fontSize: 14 }}>{value}</Text><Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={17} color={colors.textSecondary} /></View></Pressable>; }
function ToggleRow({ icon, label, value, colors, onPress }: { icon: Parameters<typeof Icon>[0]['name']; label: string; value: boolean; colors: AppColors; onPress: () => void }) { return <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={onPress} style={styles.row}><View style={styles.rowLead}><Icon name={icon} size={19} color={colors.textSecondary} /><Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text></View><View style={[styles.toggle, { backgroundColor: value ? '#42A878' : colors.backgroundSelected }]}><View style={[styles.toggleKnob, { alignSelf: value ? 'flex-end' : 'flex-start' }]} /></View></Pressable>; }
function ModeSegments({ value, colors, accent, onChange }: { value: TimerMode; colors: AppColors; accent: string; onChange: (value: TimerMode) => void }) { return <View style={[styles.segmented, { marginBottom: 8 }]}>{(['free', 'pomodoro'] as TimerMode[]).map((mode) => <Pressable key={mode} accessibilityRole="button" accessibilityState={{ selected: value === mode }} onPress={() => onChange(mode)} style={[styles.segment, { backgroundColor: value === mode ? accent : colors.backgroundSelected }]}><Text style={{ color: value === mode ? '#FFFFFF' : colors.text, fontWeight: '800', textTransform: 'capitalize' }}>{mode}</Text></Pressable>)}</View>; }
function PresetChips({ values, selected, suffix, onSelect, colors, accent }: { values: number[]; selected: number; suffix: string; onSelect: (value: number) => void; colors: AppColors; accent: string }) { return <View style={styles.presetWrap}>{values.map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: selected === value }} onPress={() => onSelect(value)} style={[styles.preset, { backgroundColor: selected === value ? accent : colors.backgroundSelected }]}><Text style={{ color: selected === value ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '800' }}>{value}{suffix}</Text></Pressable>)}</View>; }
function formatReminderTime(hour: number, minute: number): string { const suffix = hour >= 12 ? 'PM' : 'AM'; return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`; }
function formatReminderDays(days: number[]): string { if (days.length === 7) return 'Every day'; if (days.length === 5 && days.every((day) => day > 0 && day < 6)) return 'Weekdays'; return days.map((day) => 'SMTWTFS'[day]).join(' '); }

const styles = StyleSheet.create({
  header: { marginBottom: 6 }, eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.7 }, title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.25, marginTop: 7 }, subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 }, row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth }, rowLead: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }, rowLabel: { fontSize: 15, fontWeight: '700' }, rowValue: { flexDirection: 'row', alignItems: 'center', gap: 5 }, toggle: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' }, toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' }, optionLabel: { fontSize: 13, fontWeight: '800' }, segmented: { flexDirection: 'row', gap: 8, marginTop: 10 }, segment: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 13 }, presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12 }, preset: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 }, colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }, colorSwatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, alignItems: 'center', justifyContent: 'center' }, dataCount: { fontSize: 17, fontWeight: '800', marginBottom: 2 }, dataActions: { flexDirection: 'row', gap: 8, marginTop: 18 }, dataButton: { flex: 1, marginTop: 8 }, deleteButton: { marginTop: 18 }, aboutBrand: { flexDirection: 'row', alignItems: 'center', gap: 14 }, aboutLogo: { width: 64, height: 64, borderRadius: 16 }, aboutCopy: { flex: 1 }, aboutName: { fontSize: 20, fontWeight: '800' }, creatorCredit: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth }, creatorLogo: { width: 88, height: 60, borderRadius: 12 }, creatorCopy: { flex: 1 }, creatorLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }, creatorName: { fontSize: 18, fontWeight: '800', marginTop: 4 }, privacy: { fontSize: 14, lineHeight: 21, marginTop: 18 }, reminderRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, gap: 5 }, reminderCopy: { flex: 1 }, reminderMeta: { fontSize: 12, marginTop: 4 }, reminderButton: { marginTop: 16 }, iconHit: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
});
