import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
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
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<FocusTask | null>(null);
  const [title, setTitle] = useState('');
  const active = tasks.filter((task) => !task.isCompleted);
  const completed = tasks.filter((task) => task.isCompleted);

  function openCreate() { setEditingTask(null); setTitle(''); setModalVisible(true); }
  function openEdit(task: FocusTask) { setEditingTask(task); setTitle(task.title); setModalVisible(true); }
  async function save() {
    if (!title.trim()) return;
    if (editingTask) await updateTask(editingTask.id, title); else await addTask(title);
    setModalVisible(false);
  }

  function remove(task: FocusTask) {
    Alert.alert('Delete task?', 'Past focus sessions will keep the task name snapshot.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { void deleteTask(task.id); } }]);
  }

  return (
    <AppScreen>
      <View style={styles.header}><View><Text style={[styles.eyebrow, { color: accent }]}>YOUR WORK</Text><Text style={[styles.title, { color: colors.text }]}>Tasks</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>A short list for a clear mind.</Text></View><Button onPress={openCreate} style={styles.addButton}>＋ Add</Button></View>
      {tasks.length === 0 ? <EmptyState title="No tasks yet" message="Create your first task and start focusing on what matters." actionLabel="Create Task" onAction={openCreate} /> : <>
        <SectionHeader title={`Active · ${active.length}`} />
        {active.length === 0 ? <Text style={[styles.emptyLine, { color: colors.textSecondary }]}>All clear. Restore a completed task when you are ready.</Text> : active.map((task) => <TaskCard key={task.id} task={task} sessions={sessions} accent={accent} colors={colors} onStart={() => router.push(`/?taskId=${encodeURIComponent(task.id)}`)} onToggle={() => { void setCompleted(task.id, true); void triggerHaptic(hapticsEnabled, 'success'); }} onEdit={() => openEdit(task)} onDelete={() => remove(task)} />)}
        {completed.length > 0 ? <><SectionHeader title={`Completed · ${completed.length}`} /><Card>{completed.map((task) => <View key={task.id} style={styles.completedRow}><Pressable accessibilityRole="button" onPress={() => { void setCompleted(task.id, false); }} style={styles.completedTitle}><Text style={[styles.check, { color: accent }]}>✓</Text><Text style={[styles.completedText, { color: colors.textSecondary }]}>{task.title}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${task.title}`} onPress={() => remove(task)}><Text style={{ color: colors.muted, fontSize: 20 }}>×</Text></Pressable></View>)}</Card></> : null}
      </>}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}><View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.45)' }]}><View style={[styles.modal, { backgroundColor: colors.backgroundElement }]}><Text style={[styles.modalTitle, { color: colors.text }]}>{editingTask ? 'Edit task' : 'New task'}</Text><TextInput autoFocus accessibilityLabel="Task name" placeholder="What do you want to focus on?" placeholderTextColor={colors.muted} maxLength={120} value={title} onChangeText={setTitle} onSubmitEditing={() => void save()} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} /><View style={styles.modalActions}><Button onPress={() => setModalVisible(false)} variant="ghost" style={styles.modalButton}>Cancel</Button><Button onPress={() => void save()} style={styles.modalButton}>Save task</Button></View></View></View></Modal>
    </AppScreen>
  );
}

function TaskCard({ task, sessions, accent, colors, onStart, onToggle, onEdit, onDelete }: { task: FocusTask; sessions: ReturnType<typeof useFocusStore.getState>['sessions']; accent: string; colors: { text: string; textSecondary: string; border: string; background: string; backgroundSelected: string }; onStart: () => void; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const stats = getTaskStats(sessions, task.id);
  return <Card style={styles.taskCard}><View style={styles.taskTop}><Pressable accessibilityRole="button" accessibilityLabel={`Complete ${task.title}`} onPress={onToggle} style={[styles.checkbox, { borderColor: accent }]}><Text style={{ color: accent }}>○</Text></Pressable><Text style={[styles.taskName, { color: colors.text }]} numberOfLines={2}>{task.title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Edit ${task.title}`} onPress={onEdit}><Text style={{ color: colors.textSecondary, fontSize: 21 }}>···</Text></Pressable></View><View style={styles.taskMeta}><Text style={{ color: colors.textSecondary }}>{formatDuration(stats.focusMinutes)} focused</Text><Text style={{ color: colors.textSecondary }}>{stats.sessionsCount} {stats.sessionsCount === 1 ? 'session' : 'sessions'}</Text></View><View style={styles.taskActions}><Button onPress={onStart} style={styles.startSmall}>Start focus</Button><Button onPress={onDelete} variant="ghost" style={styles.deleteSmall}>Delete</Button></View></Card>;
}

const styles = StyleSheet.create({ header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }, eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.8 }, title: { fontSize: 34, fontWeight: '800', letterSpacing: -1, marginTop: 7 }, subtle: { fontSize: 14, lineHeight: 20 }, addButton: { minHeight: 44, paddingHorizontal: 14 }, taskCard: { marginBottom: 12 }, taskTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, checkbox: { width: 28, height: 28, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, taskName: { flex: 1, fontSize: 17, fontWeight: '700' }, taskMeta: { flexDirection: 'row', gap: 14, marginTop: 12, marginLeft: 39, fontSize: 13 }, taskActions: { flexDirection: 'row', gap: 8, marginTop: 16, marginLeft: 39 }, startSmall: { flex: 1, minHeight: 44 }, deleteSmall: { minHeight: 44 }, emptyLine: { marginBottom: 20 }, completedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#8884' }, completedTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }, check: { fontSize: 20 }, completedText: { textDecorationLine: 'line-through', fontSize: 15 }, modalBackdrop: { flex: 1, justifyContent: 'flex-end' }, modal: { padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28 }, modalTitle: { fontSize: 24, fontWeight: '800', marginBottom: 18 }, input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, minHeight: 54, fontSize: 16 }, modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 }, modalButton: { flex: 1 } });
