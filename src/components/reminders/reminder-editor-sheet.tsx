import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatReminderTime } from '@/lib/reminders';
import type { Reminder } from '@/types/models';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function ReminderEditorSheet({ visible, reminder, colors, accent, onCancel, onSave }: { visible: boolean; reminder?: Reminder | null; colors: { text: string; textSecondary: string; muted: string; background: string; backgroundElement: string; backgroundSelected: string; border: string; danger: string }; accent: string; onCancel: () => void; onSave: (input: { title: string; hour: number; minute: number; weekdays: number[]; taskTitle?: string; enabled?: boolean }) => void }) {
  const [title, setTitle] = useState(() => reminder?.title ?? 'Focus time');
  const [time, setTime] = useState(() => reminder ? `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}` : '09:00');
  const [weekdays, setWeekdays] = useState<number[]>(() => reminder?.weekdays ?? [1, 2, 3, 4, 5]);
  const [error, setError] = useState('');

  function save() {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
    const hour = match ? Number(match[1]) : -1;
    const minute = match ? Number(match[2]) : -1;
    if (!title.trim() || hour < 0 || hour > 23 || minute < 0 || minute > 59 || weekdays.length === 0) {
      setError('Add a title, valid time, and at least one day.');
      return;
    }
    onSave({ title: title.trim(), hour, minute, weekdays, ...(reminder?.taskTitle ? { taskTitle: reminder.taskTitle } : {}), enabled: reminder?.enabled ?? true });
  }

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}><View style={styles.backdrop}><View style={[styles.sheet, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}><View style={styles.header}><View><Text style={[styles.eyebrow, { color: accent }]}>LOCAL REMINDER</Text><Text style={[styles.title, { color: colors.text }]}>{reminder ? 'Edit reminder' : 'New reminder'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close reminder editor" onPress={onCancel} style={styles.close}><Icon name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} color={colors.textSecondary} /></Pressable></View><TextInput autoFocus accessibilityLabel="Reminder title" value={title} onChangeText={setTitle} placeholder="What should you remember?" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: error ? colors.danger : colors.border }]} /><TextInput accessibilityLabel="Reminder time" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" placeholder="09:00" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]} /><Text style={[styles.hint, { color: colors.textSecondary }]}>At {(() => { const match = /^(\d{1,2}):(\d{2})$/.exec(time); return match ? formatReminderTime(Number(match[1]), Number(match[2])) : 'your chosen time'; })()}</Text><Text style={[styles.label, { color: colors.textSecondary }]}>REPEAT ON</Text><View style={styles.days}>{WEEKDAYS.map((day, index) => <Pressable key={`${day}-${index}`} accessibilityRole="button" accessibilityState={{ selected: weekdays.includes(index) }} onPress={() => setWeekdays((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index].sort())} style={[styles.day, { backgroundColor: weekdays.includes(index) ? accent : colors.backgroundSelected }]}><Text style={{ color: weekdays.includes(index) ? '#FFFFFF' : colors.textSecondary, fontWeight: '900' }}>{day}</Text></Pressable>)}</View>{error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}<View style={styles.actions}><Button onPress={onCancel} variant="ghost" style={styles.action}>Cancel</Button><Button onPress={save} style={styles.action}>{reminder ? 'Save changes' : 'Add reminder'}</Button></View></View></View></Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20, 13, 10, 0.42)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 24, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6, marginTop: 4 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, fontSize: 16, marginBottom: 9 },
  hint: { fontSize: 12, marginTop: -2, marginBottom: 13 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 12, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  action: { flex: 1 },
});
