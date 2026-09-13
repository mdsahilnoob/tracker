import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AccentColors } from '@/constants/theme';
import { AppScreen } from '@/components/ui/app-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldSheet } from '@/components/ui/field-sheet';
import { Icon } from '@/components/ui/icon';
import { SectionHeader } from '@/components/ui/section-header';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useFocusStore } from '@/stores/use-focus-store';
import { useSettingsStore } from '@/stores/use-settings-store';
import { useTasksStore } from '@/stores/use-tasks-store';

export default function SettingsScreen() {
  const { colors, accent } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const resetSettings = useSettingsStore((state) => state.resetSettings);
  const clearSessions = useFocusStore((state) => state.clearSessions);
  const clearTasks = useTasksStore((state) => state.clearTasks);
  const sessionsCount = useFocusStore((state) => state.sessions.length);
  const [editor, setEditor] = useState<'focus' | 'goal' | null>(null);
  const [editorValue, setEditorValue] = useState('');
  const [editorError, setEditorError] = useState('');

  function openEditor(type: 'focus' | 'goal') {
    setEditor(type);
    setEditorValue(String(type === 'focus' ? settings.defaultFocusMinutes : settings.dailyGoalMinutes));
    setEditorError('');
  }

  async function saveEditor() {
    const value = Number(editorValue);
    const maximum = editor === 'focus' ? 180 : 1440;
    if (!editor || !Number.isFinite(value) || value < 1 || value > maximum) {
      setEditorError(`Choose a value between 1 and ${maximum} minutes.`);
      return;
    }
    await updateSettings(editor === 'focus' ? { defaultFocusMinutes: Math.round(value) } : { dailyGoalMinutes: Math.round(value) });
    setEditor(null);
  }

  async function deleteAllData() {
    await Promise.all([clearSessions(), clearTasks(), resetSettings()]);
  }

  function deleteAll() {
    Alert.alert('Delete all focus data?', 'This permanently removes your tasks, sessions, and streak history stored on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete everything', style: 'destructive', onPress: () => { void deleteAllData(); } },
    ]);
  }

  return <AppScreen>
    <View style={styles.header}><Text style={[styles.eyebrow, { color: accent }]}>PERSONALIZE</Text><Text style={[styles.title, { color: colors.text }]}>Settings</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Keep FocusFlow tuned to your rhythm.</Text></View>
    <SectionHeader title="Focus" />
    <Card><SettingRow icon={{ ios: 'timer', android: 'timer', web: 'timer' }} label="Default focus duration" value={`${settings.defaultFocusMinutes} min`} colors={colors} onPress={() => openEditor('focus')} /><PresetChips values={[15, 25, 45, 60]} selected={settings.defaultFocusMinutes} onSelect={(value) => void updateSettings({ defaultFocusMinutes: value })} colors={colors} accent={accent} /><SettingRow icon={{ ios: 'target', android: 'track_changes', web: 'track_changes' }} label="Daily focus goal" value={`${settings.dailyGoalMinutes} min`} colors={colors} onPress={() => openEditor('goal')} /><PresetChips values={[30, 60, 90, 120, 180, 240]} selected={settings.dailyGoalMinutes} onSelect={(value) => void updateSettings({ dailyGoalMinutes: value })} colors={colors} accent={accent} /></Card>
    <SectionHeader title="Timer" />
    <Card><ToggleRow icon={{ ios: 'speaker.wave.2', android: 'volume_up', web: 'volume_up' }} label="Completion sound" value={settings.soundEnabled} colors={colors} onPress={() => void updateSettings({ soundEnabled: !settings.soundEnabled })} /><ToggleRow icon={{ ios: 'hand.tap', android: 'vibration', web: 'vibration' }} label="Haptic feedback" value={settings.hapticsEnabled} colors={colors} onPress={() => void updateSettings({ hapticsEnabled: !settings.hapticsEnabled })} /><ToggleRow icon={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }} label="Notifications" value={settings.notificationsEnabled} colors={colors} onPress={() => void updateSettings({ notificationsEnabled: !settings.notificationsEnabled })} /></Card>
    <SectionHeader title="Appearance" />
    <Card><Text style={[styles.optionLabel, { color: colors.textSecondary }]}>Theme</Text><View style={styles.segmented}>{(['system', 'light', 'dark'] as const).map((theme) => <Pressable key={theme} accessibilityRole="button" accessibilityState={{ selected: settings.theme === theme }} onPress={() => void updateSettings({ theme })} style={[styles.segment, { backgroundColor: settings.theme === theme ? accent : colors.backgroundSelected }]}><Text style={{ color: settings.theme === theme ? '#FFFFFF' : colors.text, fontWeight: '800', textTransform: 'capitalize' }}>{theme}</Text></Pressable>)}</View><Text style={[styles.optionLabel, { color: colors.textSecondary, marginTop: 20 }]}>Accent color</Text><View style={styles.colors}>{AccentColors.map((color) => <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Use accent ${color}`} accessibilityState={{ selected: settings.accentColor === color }} onPress={() => void updateSettings({ accentColor: color })} style={[styles.colorSwatch, { backgroundColor: color, borderColor: settings.accentColor === color ? colors.text : 'transparent' }]}><Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={15} color="#FFFFFF" /></Pressable>)}</View></Card>
    <SectionHeader title="Data" />
    <Card><Text style={[styles.dataCount, { color: colors.text }]}>{sessionsCount} session{sessionsCount === 1 ? '' : 's'} stored locally</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your data never leaves this device.</Text><Button onPress={deleteAll} variant="danger" style={styles.deleteButton}>Delete all focus data</Button></Card>
    <SectionHeader title="About" />
    <Card><Text style={[styles.aboutName, { color: colors.text }]}>FocusFlow</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Version {Constants.expoConfig?.version ?? '1.0.0'} · Offline by design</Text><Text style={[styles.privacy, { color: colors.textSecondary }]}>Your focus data stays on your device. FocusFlow does not require an account and does not upload your productivity data.</Text></Card>
    <FieldSheet visible={editor !== null} title={editor === 'focus' ? 'Default focus duration' : 'Daily focus goal'} value={editorValue} placeholder="Minutes" submitLabel="Save" helperText={editor === 'focus' ? 'Choose between 1 and 180 minutes.' : 'Choose between 1 and 1,440 minutes.'} errorText={editorError} keyboardType="number-pad" onChangeText={(value) => { setEditorValue(value); setEditorError(''); }} onCancel={() => setEditor(null)} onSubmit={() => { void saveEditor(); }} />
  </AppScreen>;
}

function SettingRow({ icon, label, value, colors, onPress }: { icon: Parameters<typeof Icon>[0]['name']; label: string; value: string; colors: { text: string; textSecondary: string; border: string }; onPress: () => void }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.row, { borderBottomColor: colors.border }]}><View style={styles.rowLead}><Icon name={icon} size={19} color={colors.textSecondary} /><Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text></View><View style={styles.rowValue}><Text style={{ color: colors.textSecondary, fontSize: 14 }}>{value}</Text><Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={17} color={colors.textSecondary} /></View></Pressable>; }
function ToggleRow({ icon, label, value, colors, onPress }: { icon: Parameters<typeof Icon>[0]['name']; label: string; value: boolean; colors: { text: string; textSecondary: string; backgroundSelected: string }; onPress: () => void }) { return <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={onPress} style={styles.row}><View style={styles.rowLead}><Icon name={icon} size={19} color={colors.textSecondary} /><Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text></View><View style={[styles.toggle, { backgroundColor: value ? '#42A878' : colors.backgroundSelected }]}><View style={[styles.toggleKnob, { alignSelf: value ? 'flex-end' : 'flex-start' }]} /></View></Pressable>; }
function PresetChips({ values, selected, onSelect, colors, accent }: { values: number[]; selected: number; onSelect: (value: number) => void; colors: { text: string; backgroundSelected: string }; accent: string }) { return <View style={styles.presetWrap}>{values.map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: selected === value }} onPress={() => onSelect(value)} style={[styles.preset, { backgroundColor: selected === value ? accent : colors.backgroundSelected }]}><Text style={{ color: selected === value ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '800' }}>{value}m</Text></Pressable>)}</View>; }

const styles = StyleSheet.create({
  header: { marginBottom: 6 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.7 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.25, marginTop: 7 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  rowLead: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  toggle: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  optionLabel: { fontSize: 13, fontWeight: '800' },
  segmented: { flexDirection: 'row', gap: 8, marginTop: 10 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 13 },
  presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12 },
  preset: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  colors: { flexDirection: 'row', gap: 12, marginTop: 12 },
  colorSwatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  dataCount: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  deleteButton: { marginTop: 18 },
  aboutName: { fontSize: 20, fontWeight: '800' },
  privacy: { fontSize: 14, lineHeight: 21, marginTop: 18 },
});
