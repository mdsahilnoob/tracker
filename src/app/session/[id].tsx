import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatDuration, formatTime, getDateKey, getDateLabel } from '@/lib/dates';
import { useFocusStore } from '@/stores/use-focus-store';
import { sanitizeSessionNotes } from '@/lib/sessions';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accent } = useAppTheme();
  const session = useFocusStore((state) => state.sessions.find((item) => item.id === id));
  const deleteSession = useFocusStore((state) => state.deleteSession);
  const updateSessionNotes = useFocusStore((state) => state.updateSessionNotes);
  const [notes, setNotes] = useState(() => session?.notes ?? '');

  if (!session) return <AppScreen><View style={styles.notFound}><Text style={[styles.title, { color: colors.text }]}>Session not found</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>This local session may have been deleted.</Text><Button onPress={() => router.back()} variant="secondary" style={styles.backButton}>Go back</Button></View></AppScreen>;
  const selectedSession = session;

  function remove() {
    Alert.alert('Delete session?', 'This will update your focus totals and streaks.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void deleteSession(selectedSession.id); router.back(); } },
    ]);
  }

  return <AppScreen>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to insights" onPress={() => router.back()} style={styles.back}><Icon name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={18} color={accent} /><Text style={[styles.backText, { color: accent }]}>Back to insights</Text></Pressable>
    <Text style={[styles.eyebrow, { color: accent }]}>SESSION DETAILS</Text>
    <Text style={[styles.title, { color: colors.text }]}>{selectedSession.taskTitle || 'Deep work'}</Text>
    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{getDateLabel(getDateKey(selectedSession.startedAt))}</Text>
    <Card style={styles.card}>
      <Info label="Status" value={selectedSession.status === 'completed' ? 'Completed' : 'Interrupted'} colors={colors} accent={selectedSession.status === 'completed' ? accent : undefined} />
      <Info label="Date" value={new Date(selectedSession.startedAt).toLocaleDateString()} colors={colors} />
      <Info label="Start time" value={formatTime(selectedSession.startedAt)} colors={colors} />
      <Info label="Focus duration" value={formatDuration(selectedSession.actualDurationMinutes)} colors={colors} accent={accent} />
      <Info label="Planned duration" value={formatDuration(selectedSession.plannedDurationMinutes)} colors={colors} />
      <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>SESSION NOTE</Text>
      <TextInput accessibilityLabel="Session notes" multiline value={notes} onChangeText={(value) => setNotes(value.slice(0, 1000))} placeholder="What helped you focus?" placeholderTextColor={colors.muted} style={[styles.notesInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]} />
      <Button onPress={() => { void updateSessionNotes(selectedSession.id, sanitizeSessionNotes(notes)); }} variant="secondary" style={styles.saveNotes}>Save note</Button>
    </Card>
    <Button onPress={remove} variant="danger">Delete session</Button>
  </AppScreen>;
}

function Info({ label, value, colors, accent }: { label: string; value: string; colors: { text: string; textSecondary: string; border?: string }; accent?: string }) { return <View style={[styles.info, { borderBottomColor: colors.border ?? '#00000018' }]}><Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text><Text style={[styles.infoValue, { color: accent || colors.text }]}>{value}</Text></View>; }

const styles = StyleSheet.create({
  notFound: { paddingTop: 80 },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 },
  backText: { fontSize: 14, fontWeight: '800' },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.7 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 8, marginBottom: 7 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  card: { marginVertical: 26 },
  info: { minHeight: 56, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  infoLabel: { fontSize: 14 },
  infoValue: { flex: 1, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  notesLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 20, marginBottom: 8 },
  notesInput: { minHeight: 92, borderWidth: 1, borderRadius: 15, padding: 13, fontSize: 14, textAlignVertical: 'top' },
  saveNotes: { marginTop: 10 },
  backButton: { marginTop: 22 },
});
