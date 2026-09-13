import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { SectionHeader } from '@/components/ui/section-header';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getTaskStats } from '@/lib/analytics';
import { getDateKey } from '@/lib/dates';
import { getFilteredTasks, getPlanMinutes, getTaskDueState, type TaskFilters } from '@/lib/tasks';
import { Colors } from '@/constants/theme';
import { triggerHaptic } from '@/services/haptics';
import { useFocusStore } from '@/stores/use-focus-store';
import { usePlanStore } from '@/stores/use-plan-store';
import { useSettingsStore } from '@/stores/use-settings-store';
import { useTasksStore } from '@/stores/use-tasks-store';
import type { FocusTask, TaskPriority, TaskRecurrenceFrequency } from '@/types/models';

const todayKey = getDateKey(new Date());
const PRIORITIES: (TaskPriority | 'all')[] = ['all', 'high', 'medium', 'low'];
const RECURRENCES: TaskRecurrenceFrequency[] = ['none', 'daily', 'weekdays', 'weekly'];
type AppColors = { [Key in keyof typeof Colors.light]: string };

export default function TasksScreen() {
  const { colors, accent } = useAppTheme();
  const tasks = useTasksStore((state) => state.tasks);
  const addTask = useTasksStore((state) => state.addTask);
  const updateTask = useTasksStore((state) => state.updateTask);
  const deleteTask = useTasksStore((state) => state.deleteTask);
  const setCompleted = useTasksStore((state) => state.setCompleted);
  const sessions = useFocusStore((state) => state.sessions);
  const hapticsEnabled = useSettingsStore((state) => state.settings.hapticsEnabled);
  const defaultMinutes = useSettingsStore((state) => state.settings.defaultFocusMinutes);
  const planItems = usePlanStore((state) => state.items);
  const hydratePlan = usePlanStore((state) => state.hydrate);
  const addPlanItem = usePlanStore((state) => state.addItem);
  const removePlanItem = usePlanStore((state) => state.removeItem);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({ priority: 'all', tag: 'all', sort: 'priority' });
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<FocusTask | null>(null);
  const [title, setTitle] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurrence, setRecurrence] = useState<TaskRecurrenceFrequency>('none');
  const [error, setError] = useState('');

  useEffect(() => { void hydratePlan(todayKey); }, [hydratePlan]);

  const tags = useMemo(() => [...new Set(tasks.flatMap((task) => task.tags ?? []))].sort(), [tasks]);
  const active = useMemo(() => getFilteredTasks(
    tasks.filter((task) => !task.isCompleted), query, filters,
  ), [filters, query, tasks]);
  const completed = tasks.filter((task) => task.isCompleted && (task.recurrence?.frequency ?? 'none') === 'none');

  function openCreate() {
    setEditingTask(null); setTitle(''); setTagsText(''); setPriority('medium'); setRecurrence('none'); setError(''); setSheetVisible(true);
  }

  function openEdit(task: FocusTask) {
    setEditingTask(task); setTitle(task.title); setTagsText((task.tags ?? []).join(', ')); setPriority(task.priority ?? 'medium'); setRecurrence(task.recurrence?.frequency ?? 'none'); setError(''); setSheetVisible(true);
  }

  async function save() {
    const cleaned = title.trim();
    if (!cleaned) { setError('Give this task a name first.'); return; }
    const details = { title: cleaned, priority, tags: tagsText.split(','), recurrence: { frequency: recurrence } as const };
    if (editingTask) await updateTask(editingTask.id, details);
    else await addTask(details);
    setSheetVisible(false);
  }

  function remove(task: FocusTask) {
    Alert.alert('Delete task?', 'Past focus sessions keep the task name snapshot.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void deleteTask(task.id); } },
    ]);
  }

  function toggle(task: FocusTask) {
    void setCompleted(task.id, true, todayKey);
    void triggerHaptic(hapticsEnabled, 'success');
  }

  async function addToPlan(task: FocusTask) {
    if (planItems.some((item) => item.taskId === task.id)) return;
    await addPlanItem(task, defaultMinutes);
    void triggerHaptic(hapticsEnabled, 'light');
  }

  return <AppScreen>
    <View style={styles.header}>
      <View><Text style={[styles.eyebrow, { color: accent }]}>YOUR WORK</Text><Text style={[styles.title, { color: colors.text }]}>Tasks</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>A short list for a clear mind.</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Add task" onPress={openCreate} style={[styles.addButton, { backgroundColor: accent }]}><Icon name={{ ios: 'plus', android: 'add', web: 'add' }} size={20} color="#FFFFFF" /><Text style={styles.addLabel}>Add</Text></Pressable>
    </View>

    <Card style={styles.planCard}>
      <View style={styles.planHeader}><View><Text style={[styles.sectionEyebrow, { color: accent }]}>TODAY&apos;S PLAN</Text><Text style={[styles.planTitle, { color: colors.text }]}>{planItems.length ? `${planItems.length} focus block${planItems.length === 1 ? '' : 's'}` : 'Plan your focus'}</Text></View><Text style={[styles.planTotal, { color: accent }]}>{getPlanMinutes(planItems)}m</Text></View>
      {planItems.length === 0 ? <Text style={[styles.planHint, { color: colors.textSecondary }]}>Add active tasks below to decide what deserves your attention today.</Text> : planItems.map((item) => <View key={item.id} style={[styles.planRow, { borderBottomColor: colors.border }]}><Icon name={{ ios: 'checkmark.circle', android: 'task_alt', web: 'task_alt' }} size={18} color={accent} /><Text style={[styles.planItemTitle, { color: colors.text }]} numberOfLines={1}>{item.taskTitle}</Text><Text style={[styles.planMinutes, { color: colors.textSecondary }]}>{item.plannedMinutes}m</Text><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.taskTitle} from today's plan`} onPress={() => { void removePlanItem(item.id); }} style={styles.iconHit}><Icon name={{ ios: 'xmark', android: 'close', web: 'close' }} size={16} color={colors.textSecondary} /></Pressable></View>)}
    </Card>

    {tasks.length === 0 ? <EmptyState title="No tasks yet" message="Create your first task and start focusing on what matters." actionLabel="Create task" onAction={openCreate} /> : <>
      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}><Icon name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={18} color={colors.textSecondary} /><TextInput accessibilityLabel="Search tasks" value={query} onChangeText={setQuery} placeholder="Search tasks or tags" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.text }]} /><Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')}><Icon name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} size={18} color={colors.muted} /></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {PRIORITIES.map((value) => <FilterChip key={value} label={value === 'all' ? 'All priority' : value} selected={filters.priority === value} accent={accent} colors={colors} onPress={() => setFilters((current) => ({ ...current, priority: value }))} />)}
        {tags.map((tag) => <FilterChip key={tag} label={`#${tag}`} selected={filters.tag === tag} accent={accent} colors={colors} onPress={() => setFilters((current) => ({ ...current, tag: current.tag === tag ? 'all' : tag }))} />)}
        <FilterChip label="A–Z" selected={filters.sort === 'title'} accent={accent} colors={colors} onPress={() => setFilters((current) => ({ ...current, sort: current.sort === 'title' ? 'priority' : 'title' }))} />
      </ScrollView>
      <SectionHeader title={`Active · ${active.length}`} />
      {active.length === 0 ? <Text style={[styles.emptyLine, { color: colors.textSecondary }]}>Nothing matches these filters.</Text> : active.map((task) => <TaskCard key={task.id} task={task} dueState={getTaskDueState(task, todayKey)} sessions={sessions} accent={accent} colors={colors} planned={planItems.some((item) => item.taskId === task.id)} onStart={() => router.push(`/?taskId=${encodeURIComponent(task.id)}`)} onToggle={() => toggle(task)} onPlan={() => { void addToPlan(task); }} onEdit={() => openEdit(task)} onDelete={() => remove(task)} />)}
      {completed.length > 0 ? <><SectionHeader title={`Completed · ${completed.length}`} /><Card>{completed.map((task) => <View key={task.id} style={[styles.completedRow, { borderBottomColor: colors.border }]}><Pressable accessibilityRole="button" accessibilityLabel={`Restore ${task.title}`} onPress={() => { void setCompleted(task.id, false); }} style={styles.completedTitle}><View style={[styles.completedMark, { backgroundColor: accent }]}><Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={14} color="#FFFFFF" /></View><Text style={[styles.completedText, { color: colors.textSecondary }]}>{task.title}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${task.title}`} onPress={() => remove(task)} style={styles.iconHit}><Icon name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }} size={18} color={colors.textSecondary} /></Pressable></View>)}</Card></> : null}
    </>}
    <TaskEditor visible={sheetVisible} title={title} tagsText={tagsText} priority={priority} recurrence={recurrence} editing={Boolean(editingTask)} error={error} colors={colors} accent={accent} onTitleChange={(value) => { setTitle(value); setError(''); }} onTagsChange={setTagsText} onPriorityChange={setPriority} onRecurrenceChange={setRecurrence} onCancel={() => setSheetVisible(false)} onSave={() => { void save(); }} />
  </AppScreen>;
}

function FilterChip({ label, selected, accent, colors, onPress }: { label: string; selected: boolean; accent: string; colors: AppColors; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.filterChip, { backgroundColor: selected ? colors.accentSoft : colors.backgroundElement, borderColor: selected ? accent : colors.border }]}><Text style={{ color: selected ? accent : colors.textSecondary, fontSize: 12, fontWeight: '800' }}>{label}</Text></Pressable>;
}

function TaskCard({ task, dueState, sessions, accent, colors, planned, onStart, onToggle, onPlan, onEdit, onDelete }: { task: FocusTask; dueState: 'due' | 'complete' | 'upcoming'; sessions: ReturnType<typeof useFocusStore.getState>['sessions']; accent: string; colors: AppColors; planned: boolean; onStart: () => void; onToggle: () => void; onPlan: () => void; onEdit: () => void; onDelete: () => void }) {
  const stats = getTaskStats(sessions, task.id);
  const priorityColor = task.priority === 'high' ? colors.danger ?? accent : task.priority === 'low' ? colors.muted : accent;
  return <Card style={styles.taskCard}>
    <View style={styles.taskTop}><Pressable accessibilityRole="button" accessibilityLabel={`${dueState === 'complete' ? 'Restore' : 'Complete'} ${task.title}`} onPress={onToggle} style={[styles.checkbox, { borderColor: priorityColor, backgroundColor: dueState === 'complete' ? priorityColor : 'transparent' }]}>{dueState === 'complete' ? <Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={15} color="#FFFFFF" /> : null}</Pressable><Text style={[styles.taskName, { color: colors.text }]} numberOfLines={2}>{task.title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Edit ${task.title}`} onPress={onEdit} style={styles.iconHit}><Icon name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }} size={20} color={colors.textSecondary} /></Pressable></View>
    <View style={styles.badgeRow}><Text style={[styles.priorityBadge, { color: priorityColor, backgroundColor: colors.accentSoft }]}>{task.priority ?? 'medium'} priority</Text>{task.recurrence?.frequency !== 'none' ? <Text style={[styles.metaBadge, { color: colors.textSecondary, backgroundColor: colors.backgroundSelected }]}>{task.recurrence?.frequency}</Text> : null}{(task.tags ?? []).map((tag) => <Text key={tag} style={[styles.metaBadge, { color: colors.textSecondary, backgroundColor: colors.backgroundSelected }]}>#{tag}</Text>)}</View>
    <View style={styles.taskMeta}><Text style={{ color: colors.textSecondary }}>{formatTaskTime(stats.focusMinutes)} focused</Text><Text style={{ color: colors.textSecondary }}>{stats.sessionsCount} {stats.sessionsCount === 1 ? 'session' : 'sessions'}</Text>{dueState === 'upcoming' ? <Text style={{ color: colors.textSecondary }}>upcoming</Text> : null}</View>
    <View style={styles.taskActions}><Button onPress={onStart} style={styles.startSmall}>Start focus</Button><Pressable accessibilityRole="button" accessibilityLabel={planned ? `${task.title} is in today's plan` : `Add ${task.title} to today's plan`} onPress={onPlan} disabled={planned} style={[styles.planButton, { borderColor: planned ? colors.border : accent }]}><Icon name={{ ios: planned ? 'checkmark' : 'calendar.badge.plus', android: planned ? 'check' : 'event_available', web: planned ? 'check' : 'event_available' }} size={17} color={planned ? colors.muted : accent} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${task.title}`} onPress={onDelete} style={styles.deleteButton}><Icon name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }} size={19} color={colors.textSecondary} /></Pressable></View>
  </Card>;
}

function TaskEditor({ visible, title, tagsText, priority, recurrence, editing, error, colors, accent, onTitleChange, onTagsChange, onPriorityChange, onRecurrenceChange, onCancel, onSave }: { visible: boolean; title: string; tagsText: string; priority: TaskPriority; recurrence: TaskRecurrenceFrequency; editing: boolean; error: string; colors: AppColors; accent: string; onTitleChange: (value: string) => void; onTagsChange: (value: string) => void; onPriorityChange: (value: TaskPriority) => void; onRecurrenceChange: (value: TaskRecurrenceFrequency) => void; onCancel: () => void; onSave: () => void }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}><View style={styles.backdrop}><View style={[styles.editor, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}><View style={styles.editorHeader}><View><Text style={[styles.editorEyebrow, { color: accent }]}>TASK DETAILS</Text><Text style={[styles.editorTitle, { color: colors.text }]}>{editing ? 'Edit task' : 'New task'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close task editor" onPress={onCancel} style={styles.iconHit}><Icon name={{ ios: 'xmark', android: 'close', web: 'close' }} size={19} color={colors.textSecondary} /></Pressable></View><TextInput autoFocus accessibilityLabel="Task name" value={title} onChangeText={onTitleChange} placeholder="What do you want to focus on?" placeholderTextColor={colors.textSecondary} style={[styles.editorInput, { color: colors.text, backgroundColor: colors.background, borderColor: error ? colors.danger : colors.border }]} />{error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}<Text style={[styles.editorLabel, { color: colors.textSecondary }]}>TAGS</Text><TextInput accessibilityLabel="Task tags" value={tagsText} onChangeText={onTagsChange} placeholder="work, study, personal" placeholderTextColor={colors.textSecondary} style={[styles.editorInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]} /><Text style={[styles.editorLabel, { color: colors.textSecondary }]}>PRIORITY</Text><View style={styles.optionRow}>{(['high', 'medium', 'low'] as TaskPriority[]).map((value) => <ChoiceChip key={value} label={value} selected={priority === value} accent={accent} colors={colors} onPress={() => onPriorityChange(value)} />)}</View><Text style={[styles.editorLabel, { color: colors.textSecondary }]}>REPEAT</Text><View style={styles.optionRow}>{RECURRENCES.map((value) => <ChoiceChip key={value} label={value === 'none' ? 'never' : value} selected={recurrence === value} accent={accent} colors={colors} onPress={() => onRecurrenceChange(value)} />)}</View><View style={styles.editorActions}><Button onPress={onCancel} variant="ghost" style={styles.editorAction}>Cancel</Button><Button onPress={onSave} style={styles.editorAction}>{editing ? 'Save changes' : 'Create task'}</Button></View></View></View></Modal>;
}

function ChoiceChip({ label, selected, accent, colors, onPress }: { label: string; selected: boolean; accent: string; colors: AppColors; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.choiceChip, { backgroundColor: selected ? colors.accentSoft : colors.backgroundSelected, borderColor: selected ? accent : colors.border }]}><Text style={{ color: selected ? accent : colors.textSecondary, fontWeight: '800', fontSize: 12 }}>{label}</Text></Pressable>;
}

function formatTaskTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.7 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.25, marginTop: 7 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  addButton: { minHeight: 44, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  addLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  planCard: { marginBottom: 18 },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sectionEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  planTitle: { fontSize: 18, fontWeight: '800', marginTop: 5 },
  planTotal: { fontSize: 18, fontWeight: '900' },
  planHint: { fontSize: 13, lineHeight: 19, marginTop: 13 },
  planRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  planItemTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  planMinutes: { fontSize: 12, fontWeight: '800' },
  searchBox: { minHeight: 48, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: { gap: 8, paddingVertical: 12 },
  filterChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 9 },
  emptyLine: { marginBottom: 20 },
  taskCard: { marginBottom: 12 },
  taskTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  checkbox: { width: 30, height: 30, borderWidth: 1.5, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  taskName: { flex: 1, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  iconHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 13, marginLeft: 41 },
  priorityBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
  metaBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '800' },
  taskMeta: { flexDirection: 'row', gap: 16, marginTop: 12, marginLeft: 41 },
  taskActions: { flexDirection: 'row', gap: 8, marginTop: 15, marginLeft: 41 },
  startSmall: { flex: 1, minHeight: 44 },
  planButton: { width: 46, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deleteButton: { width: 46, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  completedRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  completedTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  completedMark: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  completedText: { flex: 1, textDecorationLine: 'line-through', fontSize: 15 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20, 13, 10, 0.42)' },
  editor: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 24, paddingBottom: 32 },
  editorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  editorEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  editorTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6, marginTop: 4 },
  editorInput: { minHeight: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, fontSize: 16, marginBottom: 10 },
  editorLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 10, marginBottom: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 9 },
  editorActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  editorAction: { flex: 1 },
  error: { fontSize: 12, marginBottom: 4 },
});
