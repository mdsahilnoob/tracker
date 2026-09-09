import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import AppTabs from '@/components/app-tabs';
import { cancelFocusCompletion, configureNotifications } from '@/services/notifications';
import { useFocusStore } from '@/stores/use-focus-store';
import { useSettingsStore } from '@/stores/use-settings-store';
import { useTasksStore } from '@/stores/use-tasks-store';
import { useAppTheme } from '@/hooks/use-app-theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const { mode } = useAppTheme();
  const [ready, setReady] = useState(false);
  const hydrateFocus = useFocusStore((state) => state.hydrate);
  const hydrateTasks = useTasksStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      await Promise.all([hydrateFocus(), hydrateTasks(), hydrateSettings(), configureNotifications()]);
      const activeTimer = useFocusStore.getState().activeTimer;
      if (!activeTimer || activeTimer.status !== 'running') await cancelFocusCompletion();
      if (!mounted) return;
      setReady(true);
      SplashScreen.hideAsync().catch(() => undefined);
    }
    bootstrap().catch(() => {
      if (!mounted) return;
      setReady(true);
      SplashScreen.hideAsync().catch(() => undefined);
    });
    return () => { mounted = false; };
  }, [hydrateFocus, hydrateTasks, hydrateSettings]);

  if (!ready) return null;
  return (
    <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <AppTabs />
    </ThemeProvider>
  );
}
