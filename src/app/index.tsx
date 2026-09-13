import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { TimerRing } from '@/components/focus/timer-ring';
import { AppScreen } from '@/components/ui/app-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getTodayStats } from '@/lib/analytics';
import { formatCountdown, formatDuration } from '@/lib/dates';
import { shouldCelebrateGoal } from '@/lib/goals';
import { triggerHaptic } from '@/services/haptics';
import { useFocusStore } from '@/stores/use-focus-store';
import { useSettingsStore } from '@/stores/use-settings-store';
import { useTasksStore } from '@/stores/use-tasks-store';

const PRESETS = [15, 25, 45, 60];

export default function FocusScreen() {
  const { colors, accent } = useAppTheme();
  const { taskId: taskParam } = useLocalSearchParams<{ taskId?: string }>();
  const sessions = useFocusStore((state) => state.sessions);
  const activeTimer = useFocusStore((state) => state.activeTimer);
  const startTimer = useFocusStore((state) => state.startTimer);
  const pauseTimer = useFocusStore((state) => state.pauseTimer);
  const resumeTimer = useFocusStore((state) => state.resumeTimer);
  const finishTimer = useFocusStore((state) => state.finishTimer);
  const completeTimer = useFocusStore((state) => state.completeTimer);
  const tasks = useTasksStore((state) => state.tasks).filter((task) => !task.isCompleted);
  const settings = useSettingsStore((state) => state.settings);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(() => taskParam);
  const [duration, setDuration] = useState(String(settings.defaultFocusMinutes));
  const [durationError, setDurationError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const completionInFlight = useRef(false);
  const previousGoalMinutes = useRef<number | null>(null);
  const today = getTodayStats(sessions, new Date(now), settings.dailyGoalMinutes);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  useEffect(() => {
    if (!activeTimer || activeTimer.status !== 'running') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  useEffect(() => {
    if (!activeTimer || activeTimer.status !== 'running' || now < Date.parse(activeTimer.expectedEndAt) || completionInFlight.current) return;
    completionInFlight.current = true;
    completeTimer().then((completed) => {
      if (completed) {
        void triggerHaptic(settings.hapticsEnabled, 'success');
        Alert.alert('Session complete', 'Great work. Your focus session was saved locally.');
      }
    }).finally(() => { completionInFlight.current = false; });
  }, [activeTimer, now, completeTimer, settings.hapticsEnabled]);

  useEffect(() => {
    if (shouldCelebrateGoal(previousGoalMinutes.current, today.focusMinutes, settings.dailyGoalMinutes) && sessions.length > 0) {
      Alert.alert('Daily goal reached', 'A quiet win. Keep the momentum going.');
      void triggerHaptic(settings.hapticsEnabled, 'success');
    }
    previousGoalMinutes.current = today.focusMinutes;
  }, [today.focusMinutes, settings.dailyGoalMinutes, settings.hapticsEnabled, sessions.length]);

  useEffect(() => {
    if (!taskParam) return;
    // The URL is an external navigation input; syncing a changed task deep-link is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedTaskId(taskParam);
  }, [taskParam]);

  const remainingSeconds = activeTimer
    ? Math.max(0, Math.ceil((Date.parse(activeTimer.expectedEndAt) - (activeTimer.status === 'paused' && activeTimer.pausedAt ? Date.parse(activeTimer.pausedAt) : now)) / 1000))
    : 0;
  const progress = activeTimer ? Math.min(1, Math.max(0, 1 - remainingSeconds / (activeTimer.plannedDurationMinutes * 60))) : 0;
  const displayDuration = useMemo(() => {
    const parsed = Number(duration);
    return Number.isFinite(parsed) ? Math.min(180, Math.max(1, Math.round(parsed))) : settings.defaultFocusMinutes;
  }, [duration, settings.defaultFocusMinutes]);
  const goalProgress = today.goalMinutes ? today.focusMinutes / today.goalMinutes : 0;

  async function begin() {
    const parsed = Number(duration);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 180) {
      setDurationError('Choose a duration between 1 and 180 minutes.');
      return;
    }
    if (activeTimer) return;
    setDurationError('');
    const timer = await startTimer({
      plannedDurationMinutes: Math.round(parsed),
      taskId: selectedTask?.id,
      taskTitle: selectedTask?.title,
      notificationsEnabled: settings.notificationsEnabled,
      soundEnabled: settings.soundEnabled,
    });
    if (!timer) return;
    void triggerHaptic(settings.hapticsEnabled, 'medium');
  }

  async function pause() {
    await pauseTimer();
    await triggerHaptic(settings.hapticsEnabled, 'light');
  }

  async function resume() {
    await resumeTimer({ notificationsEnabled: settings.notificationsEnabled, soundEnabled: settings.soundEnabled });
    await triggerHaptic(settings.hapticsEnabled, 'light');
  }

  async function finish(recordInterrupted: boolean) {
    await finishTimer(recordInterrupted);
  }

  function endSession() {
    Alert.alert('End this focus session?', 'Save the time as an interrupted session or discard it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { void finish(false); } },
      { text: 'End Session', onPress: () => { void finish(true); } },
    ]);
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={[styles.brandMark, { backgroundColor: accent }]}><Icon name={{ ios: 'timer', android: 'timer', web: 'timer' }} size={17} color="#FFFFFF" /></View>
          <Text style={[styles.brand, { color: colors.text }]}>FocusFlow</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <Icon name={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }} size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.titleBlock}>
        <Text style={[styles.eyebrow, { color: accent }]}>TODAY</Text>
        <Text style={[styles.title, { color: colors.text }]}>{activeTimer ? 'Stay with the moment.' : 'Ready to focus?'}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{activeTimer ? 'Your time is moving with you.' : 'Make a little room for what matters.'}</Text>
      </View>

      {activeTimer ? (
        <Card style={styles.timerCard} elevated>
          <View style={styles.taskHeader}>
            <View style={[styles.taskIcon, { backgroundColor: colors.accentSoft }]}><Icon name={{ ios: 'wand.and.stars', android: 'auto_awesome', web: 'auto_awesome' }} size={19} color={accent} /></View>
            <View style={styles.taskCopy}>
              <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>CURRENT TASK</Text>
              <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>{activeTimer.taskTitle || 'Deep work'}</Text>
            </View>
            <Text style={[styles.planned, { color: colors.textSecondary }]}>{activeTimer.plannedDurationMinutes}m</Text>
          </View>
          <TimerRing time={formatCountdown(remainingSeconds)} progress={progress} status={activeTimer.status === 'paused' ? 'Paused' : 'In focus'} />
          <Text style={[styles.ringHint, { color: colors.textSecondary }]}>{activeTimer.status === 'paused' ? 'Take your time. Resume when ready.' : 'Keep your attention here.'}</Text>
          <ProgressBar progress={progress} />
          <View style={styles.timerActions}>
            <Button onPress={() => { void (activeTimer.status === 'running' ? pause() : resume()); }} variant="secondary" style={styles.actionButton}>{activeTimer.status === 'running' ? 'Pause' : 'Resume'}</Button>
            <Button onPress={endSession} variant="ghost" style={styles.actionButton}>End session</Button>
          </View>
        </Card>
      ) : (
        <>
          <Card style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <View style={[styles.taskIcon, { backgroundColor: colors.accentSoft }]}><Icon name={{ ios: 'wand.and.stars', android: 'auto_awesome', web: 'auto_awesome' }} size={19} color={accent} /></View>
              <View style={styles.taskCopy}><Text style={[styles.miniLabel, { color: colors.textSecondary }]}>FOCUS SESSION</Text><Text style={[styles.taskTitle, { color: colors.text }]}>{selectedTask?.title || 'Choose your next focus'}</Text></View>
              <Text style={[styles.planned, { color: colors.textSecondary }]}>{displayDuration}m</Text>
            </View>
            <View style={styles.durationRow}>{PRESETS.map((preset) => <Pressable key={preset} accessibilityRole="button" accessibilityState={{ selected: Number(duration) === preset }} onPress={() => { setDuration(String(preset)); setDurationError(''); }} style={[styles.preset, { backgroundColor: Number(duration) === preset ? accent : colors.backgroundSelected }]}><Text style={{ color: Number(duration) === preset ? '#FFFFFF' : colors.text, fontWeight: '800' }}>{preset}m</Text></Pressable>)}</View>
            <View style={styles.customRow}><Text style={[styles.customLabel, { color: colors.textSecondary }]}>Custom</Text><TextInput accessibilityLabel="Custom focus duration in minutes" keyboardType="number-pad" maxLength={3} value={duration} onChangeText={(value) => { setDuration(value); setDurationError(''); }} style={[styles.durationInput, { color: colors.text, borderColor: durationError ? colors.danger : colors.border, backgroundColor: colors.background }]} /><Text style={[styles.customLabel, { color: colors.textSecondary }]}>min</Text></View>
            {durationError ? <Text style={[styles.error, { color: colors.danger }]}>{durationError}</Text> : null}
            <Text style={[styles.miniLabel, { color: colors.textSecondary, marginTop: 18 }]}>OPTIONAL TASK</Text>
            <View style={styles.taskChips}>{tasks.length === 0 ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>No tasks yet. You can still focus freely.</Text> : tasks.slice(0, 4).map((task) => <Pressable key={task.id} accessibilityRole="button" accessibilityState={{ selected: selectedTaskId === task.id }} onPress={() => setSelectedTaskId(selectedTaskId === task.id ? undefined : task.id)} style={[styles.taskChip, { borderColor: selectedTaskId === task.id ? accent : colors.border, backgroundColor: selectedTaskId === task.id ? colors.accentSoft : 'transparent' }]}><Text style={{ color: colors.text }} numberOfLines={1}>{task.title}</Text></Pressable>)}</View>
          </Card>
          <Card style={styles.timerCard} elevated>
            <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>FOCUS PROGRESS</Text>
            <TimerRing time={formatCountdown(displayDuration * 60)} progress={0} status="Ready" />
            <Text style={[styles.ringHint, { color: colors.textSecondary }]}>Stay focused for {displayDuration} min</Text>
            <Button onPress={() => { void begin(); }} style={styles.startButton}>Start focus</Button>
          </Card>
        </>
      )}

      <SectionHeader title="Today" />
      <Card>
        <View style={styles.statsRow}>
          <View><Text style={[styles.statValue, { color: colors.text }]}>{formatDuration(today.focusMinutes)}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Focus time</Text></View>
          <View><Text style={[styles.statValue, { color: colors.text }]}>{today.sessionsCount}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text></View>
          <View><Text style={[styles.statValue, { color: accent }]}>{Math.min(100, Math.round(goalProgress * 100))}%</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Daily goal</Text></View>
        </View>
        <ProgressBar progress={goalProgress} />
        <Text style={[styles.goalText, { color: colors.textSecondary }]}>{Math.round(today.focusMinutes)} / {today.goalMinutes} min daily goal</Text>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { marginBottom: 24 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.7, marginBottom: 7 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.25 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  timerCard: { alignItems: 'center', marginBottom: 4, paddingVertical: 22 },
  taskCard: { marginBottom: 12 },
  taskHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 11 },
  taskIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  taskCopy: { flex: 1 },
  miniLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.25 },
  taskTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.25, marginTop: 4 },
  planned: { fontSize: 14, fontWeight: '800' },
  durationRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  preset: { flex: 1, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  customLabel: { fontSize: 13, fontWeight: '700' },
  durationInput: { width: 66, height: 40, borderWidth: 1, borderRadius: 13, textAlign: 'center', fontWeight: '800' },
  error: { width: '100%', fontSize: 12, marginTop: 8 },
  taskChips: { gap: 8, marginTop: 10 },
  taskChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11 },
  ringHint: { fontSize: 13, fontWeight: '700', marginBottom: 14 },
  timerActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 18 },
  actionButton: { flex: 1 },
  startButton: { width: '100%', marginTop: 6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  statValue: { fontSize: 23, fontWeight: '800', letterSpacing: -0.7 },
  statLabel: { fontSize: 12, marginTop: 3 },
  goalText: { fontSize: 12, marginTop: 9 },
});
