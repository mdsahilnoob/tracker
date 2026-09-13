import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FieldSheet } from '@/components/ui/field-sheet';
import { Icon } from '@/components/ui/icon';
import { SectionHeader } from '@/components/ui/section-header';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getTaskStats } from '@/lib/analytics';
import { formatDuration } from '@/lib/dates';
import { triggerHaptic } from '@/services/haptics';
import { useFocusStore } from '@/stores/use-focus-store';
import { useSettingsStore } from '@/stores/use-settings-store';
import { useTasksStore } from '@/stores/use-tasks-store';
import type { FocusTask } from '@/types/models';

export default function TasksScreen() {
  const { colors, accent } = useAppTheme();
  const tasks = useTasksStore((state) => state.tasks);
  const addTask = useTasksStore((state) => state.addTask);
  const updateTask = useTasksStore((state) => state.updateTask);
  const deleteTask = useTasksStore((state) => state.deleteTask);
  const setCompleted = useTasksStore((state) => state.setCompleted);
  const sessions = useFocusStore((state) => state.sessions);
  const hapticsEnabled = useSettingsStore((state) => state.settings.hapticsEnabled);
  const [sheetMode, setSheetMode] = useState<'create' | 'edit' | null>(null);
  const [editingTask, setEditingTask] = useState<FocusTask | null>(null);
  const [title, setTitle] = useState('');
  const active = tasks.filter((task) => !task.isCompleted);
  const completed = tasks.filter((task) => task.isCompleted);

  function openCreate() { setEditingTask(null); setTitle(''); setSheetMode('create'); }
  function openEdit(task: FocusTask) { setEditingTask(task); setTitle(task.title); setSheetMode('edit'); }

  async function save() {
    if (!title.trim()) return;
    if (editingTask) await updateTask(editingTask.id, title);
    else await addTask(title);
    setSheetMode(null);
  }

  function remove(task: FocusTask) {
    Alert.alert('Delete task?', 'Past focus sessions keep the task name snapshot.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void deleteTask(task.id); } },
    ]);
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <View><Text style={[styles.eyebrow, { color: accent }]}>YOUR WORK</Text><Text style={[styles.title, { color: colors.text }]}>Tasks</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>A short list for a clear mind.</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Add task" onPress={openCreate} style={[styles.addButton, { backgroundColor: accent }]}><Icon name={{ ios: 'plus', android: 'add', web: 'add' }} size={20} color="#FFFFFF" /><Text style={styles.addLabel}>Add</Text></Pressable>
      </View>
      {tasks.length === 0 ? <EmptyState title="No tasks yet" message="Create your first task and start focusing on what matters." actionLabel="Create task" onAction={openCreate} /> : <>
        <SectionHeader title={`Active · ${active.length}`} />
        {active.length === 0 ? <Text style={[styles.emptyLine, { color: colors.textSecondary }]}>All clear. Restore a completed task when you are ready.</Text> : active.map((task) => <TaskCard key={task.id} task={task} sessions={sessions} accent={accent} colors={colors} onStart={() => router.push(`/?taskId=${encodeURIComponent(task.id)}`)} onToggle={() => { void setCompleted(task.id, true); void triggerHaptic(hapticsEnabled, 'success'); }} onEdit={() => openEdit(task)} onDelete={() => remove(task)} />)}
        {completed.length > 0 ? <><SectionHeader title={`Completed · ${completed.length}`} /><Card>{completed.map((task) => <View key={task.id} style={[styles.completedRow, { borderBottomColor: colors.border }]}><Pressable accessibilityRole="button" accessibilityLabel={`Restore ${task.title}`} onPress={() => { void setCompleted(task.id, false); }} style={styles.completedTitle}><View style={[styles.completedMark, { backgroundColor: accent }]}><Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={14} color="#FFFFFF" /></View><Text style={[styles.completedText, { color: colors.textSecondary }]}>{task.title}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${task.title}`} onPress={() => remove(task)} style={styles.smallIcon}><Icon name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }} size={18} color={colors.textSecondary} /></Pressable></View>)}</Card></> : null}
      </>}
      <FieldSheet visible={sheetMode !== null} title={sheetMode === 'edit' ? 'Edit task' : 'New task'} value={title} placeholder="What do you want to focus on?" submitLabel={sheetMode === 'edit' ? 'Save changes' : 'Create task'} helperText="Keep it simple. You can change this later." onChangeText={setTitle} onCancel={() => setSheetMode(null)} onSubmit={() => { void save(); }} />
    </AppScreen>
  );
}

function TaskCard({ task, sessions, accent, colors, onStart, onToggle, onEdit, onDelete }: { task: FocusTask; sessions: ReturnType<typeof useFocusStore.getState>['sessions']; accent: string; colors: { text: string; textSecondary: string; border: string; accentSoft: string }; onStart: () => void; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const stats = getTaskStats(sessions, task.id);
  return <Card style={styles.taskCard}>
    <View style={styles.taskTop}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Complete ${task.title}`} onPress={onToggle} style={[styles.checkbox, { borderColor: accent }]}><Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={15} color={accent} /></Pressable>
      <Text style={[styles.taskName, { color: colors.text }]} numberOfLines={2}>{task.title}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${task.title}`} onPress={onEdit} style={styles.smallIcon}><Icon name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }} size={20} color={colors.textSecondary} /></Pressable>
    </View>
    <View style={styles.taskMeta}><Text style={{ color: colors.textSecondary }}>{formatDuration(stats.focusMinutes)} focused</Text><Text style={{ color: colors.textSecondary }}>{stats.sessionsCount} {stats.sessionsCount === 1 ? 'session' : 'sessions'}</Text></View>
    <View style={styles.taskActions}><Button onPress={onStart} style={styles.startSmall}>Start focus</Button><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${task.title}`} onPress={onDelete} style={styles.deleteButton}><Icon name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }} size={19} color={colors.textSecondary} /></Pressable></View>
  </Card>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.7 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.25, marginTop: 7 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  addButton: { minHeight: 44, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  addLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  emptyLine: { marginBottom: 20 },
  taskCard: { marginBottom: 12 },
  taskTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  checkbox: { width: 30, height: 30, borderWidth: 1.5, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  taskName: { flex: 1, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  smallIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  taskMeta: { flexDirection: 'row', gap: 16, marginTop: 12, marginLeft: 41, fontSize: 13 },
  taskActions: { flexDirection: 'row', gap: 8, marginTop: 15, marginLeft: 41 },
  startSmall: { flex: 1, minHeight: 44 },
  deleteButton: { width: 46, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  completedRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  completedTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  completedMark: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  completedText: { flex: 1, textDecorationLine: 'line-through', fontSize: 15 },
});
