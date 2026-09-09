import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { TimerRing } from '@/components/focus/timer-ring';
import { AppScreen } from '@/components/ui/app-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  const remainingSeconds = activeTimer ? Math.max(0, Math.ceil((Date.parse(activeTimer.expectedEndAt) - (activeTimer.status === 'paused' && activeTimer.pausedAt ? Date.parse(activeTimer.pausedAt) : now)) / 1000)) : 0;
  const progress = activeTimer ? Math.min(1, Math.max(0, 1 - remainingSeconds / (activeTimer.plannedDurationMinutes * 60))) : 0;
  const displayDuration = useMemo(() => {
    const parsed = Number(duration);
    return Number.isFinite(parsed) ? Math.min(180, Math.max(1, Math.round(parsed))) : 25;
  }, [duration]);

  async function begin() {
    if (activeTimer) return;
    const timer = await startTimer({ plannedDurationMinutes: displayDuration, taskId: selectedTask?.id, taskTitle: selectedTask?.title });
    if (!timer) return;
    void triggerHaptic(settings.hapticsEnabled, 'medium');
  }

  async function pause() {
    await pauseTimer();
    await triggerHaptic(settings.hapticsEnabled, 'light');
  }

  async function resume() {
    await resumeTimer();
    await triggerHaptic(settings.hapticsEnabled, 'light');
  }

  async function finish(recordInterrupted: boolean) {
    await finishTimer(recordInterrupted);
  }

  function endSession() {
    Alert.alert('End this focus session?', 'You can save the time as an interrupted session or discard it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { void finish(false); } },
      { text: 'End Session', onPress: () => { void finish(true); } },
    ]);
  }

  return (
    <AppScreen>
      <View style={styles.header}><View><Text style={[styles.eyebrow, { color: accent }]}>FOCUSFLOW</Text><Text style={[styles.greeting, { color: colors.text }]}>Ready to focus?</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>{activeTimer ? 'Stay with the moment.' : 'Make a little room for what matters.'}</Text></View><View style={[styles.liveDot, { backgroundColor: `${accent}22` }]}><View style={[styles.dot, { backgroundColor: accent }]} /></View></View>
      {activeTimer ? (
        <Card style={styles.timerCard}>
          <Text style={[styles.taskLabel, { color: colors.textSecondary }]}>CURRENT TASK</Text>
          <Text style={[styles.activeTask, { color: colors.text }]} numberOfLines={2}>{activeTimer.taskTitle || 'Deep work'}</Text>
          <TimerRing time={formatCountdown(remainingSeconds)} progress={progress} status={activeTimer.status === 'paused' ? 'Paused' : 'In focus'} />
          <ProgressBar progress={progress} />
          <View style={styles.timerActions}>{activeTimer.status === 'running' ? <Button onPress={() => { void pause(); }} variant="secondary" style={styles.halfButton}>Pause</Button> : <Button onPress={() => { void resume(); }} style={styles.halfButton}>Resume</Button>}<Button onPress={endSession} variant="ghost" style={styles.halfButton}>Stop</Button></View>
        </Card>
      ) : (
        <Card style={styles.startCard}>
          <Text style={[styles.taskLabel, { color: colors.textSecondary }]}>FOCUS DURATION</Text>
          <View style={styles.durationRow}>{PRESETS.map((preset) => <Pressable key={preset} accessibilityRole="button" accessibilityLabel={`${preset} minutes`} onPress={() => setDuration(String(preset))} style={[styles.preset, { backgroundColor: Number(duration) === preset ? accent : colors.backgroundSelected }]}><Text style={{ color: Number(duration) === preset ? '#fff' : colors.text, fontWeight: '700' }}>{preset}m</Text></Pressable>)}</View>
          <View style={styles.customRow}><Text style={[styles.customLabel, { color: colors.textSecondary }]}>Custom</Text><TextInput accessibilityLabel="Custom focus duration in minutes" keyboardType="number-pad" maxLength={3} value={duration} onChangeText={setDuration} style={[styles.durationInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} /><Text style={[styles.customLabel, { color: colors.textSecondary }]}>min</Text></View>
          <Text style={[styles.taskLabel, { color: colors.textSecondary, marginTop: 22 }]}>OPTIONAL TASK</Text>
          <View style={styles.taskChips}>{tasks.length === 0 ? <Text style={[styles.subtle, { color: colors.textSecondary }]}>No active tasks yet. You can still start a session.</Text> : tasks.slice(0, 4).map((task) => <Pressable key={task.id} accessibilityRole="button" onPress={() => setSelectedTaskId(selectedTaskId === task.id ? undefined : task.id)} style={[styles.taskChip, { borderColor: selectedTaskId === task.id ? accent : colors.border, backgroundColor: selectedTaskId === task.id ? `${accent}15` : 'transparent' }]}><Text style={{ color: colors.text }} numberOfLines={1}>{task.title}</Text></Pressable>)}</View>
          <Button onPress={begin} style={styles.startButton}>Start Focus</Button>
        </Card>
      )}
      <SectionHeader title="Today" />
      <Card><View style={styles.statsRow}><View><Text style={[styles.statValue, { color: colors.text }]}>{formatDuration(today.focusMinutes)}</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>Focus time</Text></View><View><Text style={[styles.statValue, { color: colors.text }]}>{today.sessionsCount}</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>Sessions</Text></View><View><Text style={[styles.statValue, { color: accent }]}>{Math.min(100, Math.round((today.focusMinutes / today.goalMinutes) * 100))}%</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>Goal</Text></View></View><ProgressBar progress={today.focusMinutes / today.goalMinutes} /><Text style={[styles.goalText, { color: colors.textSecondary }]}>{Math.round(today.focusMinutes)} / {today.goalMinutes} min daily goal</Text></Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }, eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2 }, greeting: { fontSize: 34, fontWeight: '800', letterSpacing: -1.2, marginTop: 8 }, subtle: { fontSize: 14, lineHeight: 20 }, liveDot: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }, dot: { width: 10, height: 10, borderRadius: 5 }, timerCard: { alignItems: 'center', paddingVertical: 24, marginBottom: 28 }, taskLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, activeTask: { fontSize: 20, fontWeight: '800', marginTop: 8, marginBottom: 20, textAlign: 'center' }, timerActions: { flexDirection: 'row', width: '100%', gap: 10, marginTop: 18 }, halfButton: { flex: 1 }, startCard: { marginBottom: 28 }, durationRow: { flexDirection: 'row', gap: 8, marginTop: 14 }, preset: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 }, customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }, customLabel: { fontSize: 14 }, durationInput: { width: 68, height: 42, borderWidth: 1, borderRadius: 12, textAlign: 'center', fontWeight: '700' }, taskChips: { gap: 8, marginTop: 12 }, taskChip: { borderWidth: 1, borderRadius: 12, padding: 12 }, startButton: { marginTop: 20 }, statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }, statValue: { fontSize: 24, fontWeight: '800' }, goalText: { fontSize: 13, marginTop: 10 } });
