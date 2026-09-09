import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getDateLabel, getDateKey, formatDuration, formatTime } from '@/lib/dates';
import { useFocusStore } from '@/stores/use-focus-store';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accent } = useAppTheme();
  const session = useFocusStore((state) => state.sessions.find((item) => item.id === id));
  const deleteSession = useFocusStore((state) => state.deleteSession);

  if (!session) return <AppScreen><Text style={[styles.title, { color: colors.text }]}>Session not found</Text><Button onPress={() => router.back()} variant="secondary" style={styles.backButton}>Go back</Button></AppScreen>;
  return <AppScreen><Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={[styles.back, { color: accent }]}>‹ Back to insights</Text></Pressable><Text style={[styles.eyebrow, { color: accent }]}>SESSION DETAILS</Text><Text style={[styles.title, { color: colors.text }]}>{session.taskTitle || 'Deep work'}</Text><Text style={[styles.subtle, { color: colors.textSecondary }]}>{getDateLabel(getDateKey(session.startedAt))}</Text><Card style={styles.card}><Info label="Status" value={session.status === 'completed' ? 'Completed' : 'Interrupted'} colors={colors} accent={accent} /><Info label="Date" value={new Date(session.startedAt).toLocaleDateString()} colors={colors} /><Info label="Start time" value={formatTime(session.startedAt)} colors={colors} /><Info label="Focus duration" value={formatDuration(session.actualDurationMinutes)} colors={colors} /><Info label="Planned duration" value={formatDuration(session.plannedDurationMinutes)} colors={colors} /></Card><Button onPress={() => Alert.alert('Delete session?', 'This will update your focus totals and streaks.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { void deleteSession(session.id); router.back(); } }])} variant="danger">Delete session</Button></AppScreen>;
}

function Info({ label, value, colors, accent }: { label: string; value: string; colors: { text: string; textSecondary: string }; accent?: string }) { return <View style={styles.info}><Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text><Text style={[styles.infoValue, { color: accent || colors.text }]}>{value}</Text></View>; }
const styles = StyleSheet.create({ back: { fontSize: 15, fontWeight: '700', marginBottom: 30 }, backButton: { marginTop: 20 }, eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.8 }, title: { fontSize: 30, fontWeight: '800', marginTop: 8, marginBottom: 7 }, subtle: { fontSize: 14 }, card: { marginVertical: 28 }, info: { paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#8884', flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, infoLabel: { fontSize: 14 }, infoValue: { fontSize: 15, fontWeight: '700', textAlign: 'right' }, });
