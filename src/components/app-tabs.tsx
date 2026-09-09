import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function AppTabs() {
  const { colors } = useAppTheme();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index"><NativeTabs.Trigger.Label>Focus</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="tasks"><NativeTabs.Trigger.Label>Tasks</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="insights"><NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label></NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings"><NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    </NativeTabs>
  );
}
