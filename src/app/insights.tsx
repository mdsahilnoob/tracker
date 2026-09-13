import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getLast7Days, getLongestSession, getMonthlyStats, getMostProductiveWeekday, getProductivityTrend, getSessionCompletionRate, getTodayStats } from '@/lib/analytics';
import { getAchievementDefinitions, getAchievementProgress } from '@/lib/achievements';
import { formatDuration, formatTime, getDateKey, getDateLabel } from '@/lib/dates';
import { calculateCurrentStreak, calculateLongestStreak, didMeetGoalOnDate } from '@/lib/streaks';
import { useFocusStore } from '@/stores/use-focus-store';
import { useAchievementStore } from '@/stores/use-achievement-store';
import { useSettingsStore } from '@/stores/use-settings-store';

export default function InsightsScreen() {
  const { colors, accent } = useAppTheme();
  const sessions = useFocusStore((state) => state.sessions);
  const settings = useSettingsStore((state) => state.settings);
  const unlocks = useAchievementStore((state) => state.unlocks);
  const hydrateAchievements = useAchievementStore((state) => state.hydrate);
  const syncAchievements = useAchievementStore((state) => state.sync);
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
  const trend = getProductivityTrend(sessions, todayKey, 14);
  const trendMax = Math.max(1, ...trend.map((point) => point.minutes));
  const mostProductiveWeekday = getMostProductiveWeekday(sessions);
  const completionRate = getSessionCompletionRate(sessions);

  useEffect(() => { void hydrateAchievements(); }, [hydrateAchievements]);
  useEffect(() => { void syncAchievements(sessions, settings.dailyGoalMinutes, todayKey); }, [sessions, settings.dailyGoalMinutes, syncAchievements, todayKey]);

  return <AppScreen>
    <View style={styles.header}><Text style={[styles.eyebrow, { color: accent }]}>STATUS</Text><Text style={[styles.title, { color: colors.text }]}>Insights</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>See how your focus is adding up.</Text></View>
    {sessions.length === 0 ? <EmptyState title="No focus sessions yet" message="Complete your first focus session to see your productivity insights." actionLabel="Start focus" onAction={() => router.replace('/')} /> : <>
      <SectionHeader title="Today" />
      <Card><View style={styles.summaryGrid}><MetricBlock label="Focus" value={formatDuration(today.focusMinutes)} colors={colors} /><MetricBlock label="Sessions" value={String(today.sessionsCount)} colors={colors} accent={accent} /></View><View style={styles.goalLine}><Text style={[styles.goalCopy, { color: colors.textSecondary }]}>{Math.round(today.focusMinutes)} / {today.goalMinutes} min daily goal</Text><Text style={[styles.goalPercent, { color: accent }]}>{Math.min(100, Math.round((today.focusMinutes / today.goalMinutes) * 100))}%</Text></View><View style={[styles.goalTrack, { backgroundColor: colors.backgroundSelected }]}><View style={[styles.goalFill, { width: `${Math.min(100, Math.max(0, (today.focusMinutes / today.goalMinutes) * 100))}%`, backgroundColor: accent }]} /></View></Card>
      <SectionHeader title="Your focus progress" />
      <Card><View style={styles.chartHeader}><View><Text style={[styles.chartTitle, { color: colors.text }]}>Focus per day</Text><Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>Last 7 days · average {formatDuration(average)}</Text></View><View style={[styles.periodPill, { backgroundColor: accent }]}><Text style={styles.periodText}>Last 7 days</Text></View></View><View style={styles.chart}>{week.map((day) => <View key={day.dateKey} style={styles.barColumn}><Text style={[styles.barValue, { color: colors.textSecondary }]}>{day.minutes ? Math.round(day.minutes) : ''}</Text><View style={[styles.barTrack, { backgroundColor: colors.backgroundSelected }]}><View style={[styles.bar, { height: `${Math.max(day.minutes ? 10 : 2, (day.minutes / maxWeek) * 100)}%`, backgroundColor: day.minutes ? accent : colors.muted }]} /></View><Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day.label.slice(0, 2)}</Text></View>)}</View><View style={styles.metrics}><Metric label="Total" value={formatDuration(week.reduce((sum, day) => sum + day.minutes, 0))} colors={colors} /><Metric label="Active days" value={String(weekActiveDays)} colors={colors} /><Metric label="Longest" value={longest ? formatDuration(longest.actualDurationMinutes) : '—'} colors={colors} /></View></Card>
      <SectionHeader title="This month" />
      <Card><View style={styles.metrics}><Metric label="Focus time" value={formatDuration(month.focusMinutes)} colors={colors} /><Metric label="Sessions" value={String(month.sessionsCount)} colors={colors} /><Metric label="Active days" value={String(month.activeDays)} colors={colors} /></View></Card>
      <SectionHeader title="Momentum" />
      <Card><View style={styles.metrics}><Metric label="14-day focus" value={formatDuration(trend.reduce((sum, point) => sum + point.minutes, 0))} colors={colors} /><Metric label="Completion" value={`${Math.round(completionRate * 100)}%`} colors={colors} /><Metric label="Best day" value={mostProductiveWeekday?.label ?? '—'} colors={colors} /></View><View style={styles.trend}><View style={styles.trendBars}>{trend.map((point, index) => <View key={point.dateKey} style={styles.trendColumn}><View style={[styles.trendTrack, { backgroundColor: colors.backgroundSelected }]}><View style={[styles.trendBar, { height: `${Math.max(point.minutes ? 8 : 2, (point.minutes / trendMax) * 100)}%`, backgroundColor: point.minutes ? accent : colors.muted }]} /></View>{index % 2 === 0 ? <Text style={[styles.trendLabel, { color: colors.textSecondary }]}>{point.label.slice(0, 1)}</Text> : null}</View>)}</View></View></Card>
      <SectionHeader title="Daily goal streak" />
      <Card><View style={styles.streakTop}><MetricBlock label="Current streak" value={`${currentStreak} day${currentStreak === 1 ? '' : 's'}`} colors={colors} /><MetricBlock label="Best streak" value={`${longestStreak} day${longestStreak === 1 ? '' : 's'}`} colors={colors} accent={accent} /></View><View style={styles.weekDots}>{week.map((day) => { const met = didMeetGoalOnDate(sessions, day.dateKey, settings.dailyGoalMinutes); return <View key={day.dateKey} style={styles.dotDay}><View style={[styles.goalDot, { backgroundColor: met ? accent : colors.backgroundSelected, borderColor: met ? accent : colors.border }]}><Icon name={{ ios: met ? 'checkmark' : 'minus', android: met ? 'check' : 'remove', web: met ? 'check' : 'remove' }} size={14} color={met ? '#FFFFFF' : colors.muted} /></View><Text style={[styles.dotLabel, { color: colors.textSecondary }]}>{day.label.slice(0, 1)}</Text></View>; })}</View></Card>
      <SectionHeader title="Achievements" />
      <Card><Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>Small milestones for showing up consistently.</Text>{getAchievementDefinitions().map((definition) => { const progress = getAchievementProgress(definition.id, sessions, settings.dailyGoalMinutes, todayKey); const unlocked = unlocks.some((item) => item.id === definition.id) || progress.unlocked; return <View key={definition.id} style={[styles.achievementRow, { borderBottomColor: colors.border }]}><View style={[styles.achievementIcon, { backgroundColor: unlocked ? colors.accentSoft : colors.backgroundSelected }]}><Icon name={{ ios: unlocked ? 'star.fill' : 'star', android: unlocked ? 'star' : 'star_outline', web: unlocked ? 'star' : 'star_outline' }} size={17} color={unlocked ? accent : colors.muted} /></View><View style={styles.achievementCopy}><View style={styles.achievementTitleRow}><Text style={[styles.sessionTitle, { color: colors.text }]}>{definition.title}</Text><Text style={[styles.achievementStatus, { color: unlocked ? accent : colors.textSecondary }]}>{unlocked ? 'Unlocked' : `${Math.min(definition.target, Math.round(progress.current))}/${definition.target}`}</Text></View><Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>{definition.description}</Text>{!unlocked ? <ProgressBar progress={progress.current / definition.target} height={5} /> : null}</View></View>; })}</Card>
      <SectionHeader title="Session history" />
      {chronological.map((session, index) => <View key={session.id}>{index === 0 || getDateKey(session.startedAt) !== getDateKey(chronological[index - 1].startedAt) ? <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{getDateLabel(getDateKey(session.startedAt), todayKey)}</Text> : null}<Pressable accessibilityRole="button" accessibilityLabel={`View session for ${session.taskTitle || 'Deep work'}`} onPress={() => router.push(`/session/${session.id}`)} style={[styles.sessionRow, { borderBottomColor: colors.border }]}><View style={[styles.sessionMark, { backgroundColor: session.status === 'completed' ? colors.accentSoft : colors.backgroundSelected }]}><Icon name={{ ios: 'timer', android: 'timer', web: 'timer' }} size={18} color={session.status === 'completed' ? accent : colors.textSecondary} /></View><View style={styles.sessionMain}><Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>{session.taskTitle || 'Deep work'}</Text><Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>{formatDuration(session.actualDurationMinutes)} · {formatTime(session.startedAt)} · {session.status}</Text></View><Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={18} color={colors.textSecondary} /></Pressable></View>)}
    </>}
  </AppScreen>;
}

function MetricBlock({ label, value, colors, accent }: { label: string; value: string; colors: { text: string; textSecondary: string }; accent?: string }) { return <View><Text style={[styles.blockLabel, { color: colors.textSecondary }]}>{label}</Text><Text style={[styles.blockValue, { color: accent || colors.text }]}>{value}</Text></View>; }
function Metric({ label, value, colors }: { label: string; value: string; colors: { text: string; textSecondary: string } }) { return <View style={styles.metric}><Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text></View>; }

const styles = StyleSheet.create({
  header: { marginBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.7 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1.25, marginTop: 7 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  blockLabel: { fontSize: 13, fontWeight: '700', marginBottom: 5 },
  blockValue: { fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  goalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 },
  goalCopy: { fontSize: 13 },
  goalPercent: { fontSize: 13, fontWeight: '800' },
  goalTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 4 },
  chartHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  chartTitle: { fontSize: 17, fontWeight: '800' },
  chartSubtitle: { fontSize: 12, marginTop: 4 },
  periodPill: { borderRadius: 15, paddingHorizontal: 11, paddingVertical: 8 },
  periodText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  chart: { flexDirection: 'row', height: 180, alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 18 },
  barColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { height: 19, fontSize: 10 },
  barTrack: { width: '100%', maxWidth: 28, height: 125, borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 10 },
  dayLabel: { fontSize: 11, marginTop: 8 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, gap: 8 },
  metric: { flex: 1 },
  metricValue: { fontSize: 17, fontWeight: '800', marginBottom: 3 },
  metricLabel: { fontSize: 12 },
  streakTop: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  dotDay: { alignItems: 'center', gap: 7 },
  goalDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dotLabel: { fontSize: 12, fontWeight: '700' },
  historyDate: { fontSize: 13, fontWeight: '800', marginTop: 8, marginBottom: 6 },
  sessionRow: { minHeight: 70, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessionMark: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sessionMain: { flex: 1 },
  sessionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sessionMeta: { fontSize: 12 },
  trend: { height: 110, marginTop: 24 },
  trendBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3 },
  trendColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  trendTrack: { width: '100%', maxWidth: 15, height: 82, borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden' },
  trendBar: { width: '100%', borderRadius: 7 },
  trendLabel: { fontSize: 10, marginTop: 7 },
  achievementRow: { minHeight: 76, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  achievementIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  achievementCopy: { flex: 1 },
  achievementTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  achievementStatus: { fontSize: 11, fontWeight: '800' },
});
