import type { PropsWithChildren } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export function AppScreen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const contentStyle = [styles.content, {
    paddingTop: Math.max(insets.top, Spacing.three),
    paddingBottom: insets.bottom + (Platform.OS === 'web' ? 100 : BottomTabInset) + Spacing.four,
  }];
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View pointerEvents="none" style={[styles.ambient, { backgroundColor: colors.accentSoft }]} />
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.inner, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, overflow: 'hidden' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  ambient: { position: 'absolute', width: 460, height: 340, borderRadius: 230, top: -190, right: -180, opacity: 0.62 },
});
