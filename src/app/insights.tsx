import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getLast7Days, getMonthlyStats, getTodayStats, getLongestSession } from '@/lib/analytics';
import { getDateKey, getDateLabel, formatDuration, formatTime } from '@/lib/dates';
import { calculateCurrentStreak, calculateLongestStreak, didMeetGoalOnDate } from '@/lib/streaks';
import { useFocusStore } from '@/stores/use-focus-store';
import { useSettingsStore } from '@/stores/use-settings-store';

export default function InsightsScreen() {
  const { colors, accent } = useAppTheme();
  const sessions = useFocusStore((state) => state.sessions);
  const settings = useSettingsStore((state) => state.settings);
  const todayKey = getDateKey(new Date());
  const today = getTodayStats(sessions, todayKey, settings.dailyGoalMinutes);
  const week = getLast7Days(sessions, todayKey);
  const month = getMonthlyStats(sessions, todayKey);
  const longest = getLongestSession(sessions);
  const currentStreak = calculateCurrentStreak(sessions, settings.dailyGoalMinutes, todayKey);
  const longestStreak = calculateLongestStreak(sessions, settings.dailyGoalMinutes);
  const maxWeek = Math.max(1, ...week.map((day) => day.minutes));
  const weekActiveDays = week.filter((day) => day.minutes > 0).length;
  const average = weekActiveDays ? week.reduce((sum, day) => sum + day.minutes, 0) / weekActiveDays : 0;
  const chronological = useMemo(() => [...sessions].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt)), [sessions]);

  return <AppScreen>
    <View style={styles.header}><Text style={[styles.eyebrow, { color: accent }]}>YOUR RHYTHM</Text><Text style={[styles.title, { color: colors.text }]}>Insights</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>Small sessions add up to meaningful progress.</Text></View>
    {sessions.length === 0 ? <EmptyState title="No focus sessions yet" message="Complete your first focus session to see your productivity insights." /> : null}
    <SectionHeader title="Today" />
    <Card><View style={styles.summaryTop}><View><Text style={[styles.bigStat, { color: colors.text }]}>{formatDuration(today.focusMinutes)}</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>focused today</Text></View><View style={styles.rightStat}><Text style={[styles.bigStat, { color: accent }]}>{today.sessionsCount}</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>sessions</Text></View></View><ProgressBar progress={today.focusMinutes / today.goalMinutes} /><Text style={[styles.goalText, { color: colors.textSecondary }]}>{Math.round(today.focusMinutes)} / {today.goalMinutes} min daily goal</Text></Card>
    <SectionHeader title="Last 7 days" />
    <Card><View style={styles.chart}>{week.map((day) => <View key={day.dateKey} style={styles.barColumn}><Text style={[styles.barValue, { color: colors.textSecondary }]}>{day.minutes ? Math.round(day.minutes) : ''}</Text><View style={[styles.barTrack, { backgroundColor: colors.backgroundSelected }]}><View style={[styles.bar, { height: `${Math.max(day.minutes ? 9 : 2, (day.minutes / maxWeek) * 100)}%`, backgroundColor: day.minutes ? accent : colors.muted }]} /></View><Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day.label.slice(0, 2)}</Text></View>)}</View><View style={styles.metrics}><Metric label="Total" value={formatDuration(week.reduce((sum, day) => sum + day.minutes, 0))} colors={colors} /><Metric label="Avg active day" value={formatDuration(average)} colors={colors} /><Metric label="Longest" value={longest ? formatDuration(longest.actualDurationMinutes) : '—'} colors={colors} /></View></Card>
    <SectionHeader title="This month" />
    <Card><View style={styles.metrics}><Metric label="Focus time" value={formatDuration(month.focusMinutes)} colors={colors} /><Metric label="Sessions" value={String(month.sessionsCount)} colors={colors} /><Metric label="Active days" value={String(month.activeDays)} colors={colors} /></View></Card>
    <SectionHeader title="Daily goal streak" />
    <Card><View style={styles.streakTop}><View><Text style={[styles.bigStat, { color: colors.text }]}>{currentStreak} day{currentStreak === 1 ? '' : 's'}</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>current streak</Text></View><View style={styles.rightStat}><Text style={[styles.bigStat, { color: accent }]}>{longestStreak}</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>best streak</Text></View></View><View style={styles.weekDots}>{week.map((day) => { const met = didMeetGoalOnDate(sessions, day.dateKey, settings.dailyGoalMinutes); return <View key={day.dateKey} style={styles.dotDay}><View style={[styles.goalDot, { backgroundColor: met ? accent : colors.backgroundSelected, borderColor: met ? accent : colors.border }]}><Text style={{ color: met ? '#fff' : colors.muted, fontSize: 12 }}>{met ? '✓' : '·'}</Text></View><Text style={[styles.dotLabel, { color: colors.textSecondary }]}>{day.label.slice(0, 1)}</Text></View>; })}</View></Card>
    <SectionHeader title="Session history" />
    {chronological.length === 0 ? <Card><Text style={[styles.subtle, { color: colors.textSecondary }]}>No sessions recorded yet.</Text></Card> : chronological.map((session, index) => <View key={session.id}>{index === 0 || getDateKey(session.startedAt) !== getDateKey(chronological[index - 1].startedAt) ? <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{getDateLabel(getDateKey(session.startedAt), todayKey)}</Text> : null}<Pressable accessibilityRole="button" onPress={() => router.push(`/session/${session.id}`)} style={[styles.sessionRow, { borderBottomColor: colors.border }]}><View style={[styles.sessionMark, { backgroundColor: session.status === 'completed' ? `${accent}22` : colors.backgroundSelected }]}><Text style={{ color: session.status === 'completed' ? accent : colors.textSecondary }}>◷</Text></View><View style={styles.sessionMain}><Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>{session.taskTitle || 'Deep work'}</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>{formatDuration(session.actualDurationMinutes)} · {formatTime(session.startedAt)}</Text></View><Text style={{ color: colors.textSecondary }}>›</Text></Pressable></View>)}
  </AppScreen>;
}

function Metric({ label, value, colors }: { label: string; value: string; colors: { text: string; textSecondary: string } }) { return <View style={styles.metric}><Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>{label}</Text></View>; }

const styles = StyleSheet.create({ header: { marginBottom: 28 }, eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.8 }, title: { fontSize: 34, fontWeight: '800', letterSpacing: -1, marginTop: 7 }, subtle: { fontSize: 14, lineHeight: 20 }, summaryTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }, rightStat: { alignItems: 'flex-end' }, bigStat: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 }, goalText: { marginTop: 10, fontSize: 13 }, chart: { flexDirection: 'row', height: 180, alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }, barColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }, barValue: { height: 19, fontSize: 10 }, barTrack: { width: '100%', maxWidth: 28, height: 125, borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' }, bar: { width: '100%', borderRadius: 10 }, dayLabel: { fontSize: 11, marginTop: 8 }, metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, gap: 8 }, metric: { flex: 1 }, metricValue: { fontSize: 17, fontWeight: '800', marginBottom: 3 }, streakTop: { flexDirection: 'row', justifyContent: 'space-between' }, weekDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }, dotDay: { alignItems: 'center', gap: 7 }, goalDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, dotLabel: { fontSize: 12, fontWeight: '700' }, historyDate: { fontSize: 13, fontWeight: '800', marginTop: 8, marginBottom: 6 }, sessionRow: { minHeight: 70, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 }, sessionMark: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, sessionMain: { flex: 1 }, sessionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 } });
