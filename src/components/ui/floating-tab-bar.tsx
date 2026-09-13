import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { Icon, type AppIconName } from './icon';

const tabs: { key: string; path: string; label: string; icon: AppIconName }[] = [
  { key: 'focus', path: '/', label: 'Focus', icon: { ios: 'timer', android: 'timer', web: 'timer' } },
  { key: 'tasks', path: '/tasks', label: 'Tasks', icon: { ios: 'checklist', android: 'checklist', web: 'checklist' } },
  { key: 'insights', path: '/insights', label: 'Insights', icon: { ios: 'chart.bar.xaxis', android: 'bar_chart', web: 'bar_chart' } },
  { key: 'settings', path: '/settings', label: 'Settings', icon: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' } },
];

export function FloatingTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  if (pathname.startsWith('/session/')) return null;

  const activeKey = pathname === '/' ? 'focus' : pathname.split('/')[1] ?? 'focus';
  return (
    <View pointerEvents="box-none" style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
      <View style={[styles.bar, { backgroundColor: colors.navBackground }]}>
        <NavButton tab={tabs[0]} active={activeKey === tabs[0].key} accent={accent} inactive={colors.navInactive} />
        <NavButton tab={tabs[1]} active={activeKey === tabs[1].key} accent={accent} inactive={colors.navInactive} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start a focus session"
          onPress={() => router.replace('/')}
          style={({ pressed }) => [styles.centerButton, { borderColor: accent, opacity: pressed ? 0.72 : 1 }]}
        >
          <Icon name={{ ios: 'plus', android: 'add', web: 'add' }} size={24} color={accent} label="Start a focus session" />
        </Pressable>
        <NavButton tab={tabs[2]} active={activeKey === tabs[2].key} accent={accent} inactive={colors.navInactive} />
        <NavButton tab={tabs[3]} active={activeKey === tabs[3].key} accent={accent} inactive={colors.navInactive} />
      </View>
    </View>
  );
}

function NavButton({ tab, active, accent, inactive }: { tab: (typeof tabs)[number]; active: boolean; accent: string; inactive: string }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      onPress={() => router.replace(tab.path as never)}
      style={({ pressed }) => [styles.navButton, { backgroundColor: active ? accent : 'transparent', opacity: pressed ? 0.72 : 1 }]}
    >
      <Icon name={tab.icon} size={21} color={active ? '#FFFFFF' : inactive} label={tab.label} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 18 },
  bar: { width: '100%', maxWidth: 360, minHeight: 64, borderRadius: 34, padding: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  navButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  centerButton: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
