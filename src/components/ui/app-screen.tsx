import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export function AppScreen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const contentStyle = [styles.content, {
    paddingTop: Math.max(insets.top, Spacing.three),
    paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
  }];
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
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
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
});
