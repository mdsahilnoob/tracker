import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import AppTabs from '@/components/app-tabs';
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
    const fallbackTimer = setTimeout(() => {
      if (mounted) setReady(true);
    }, 3000);

    async function bootstrap() {
      await Promise.allSettled([hydrateFocus(), hydrateTasks(), hydrateSettings()]);
      clearTimeout(fallbackTimer);
      if (mounted) setReady(true);
    }
    void bootstrap();
    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [hydrateFocus, hydrateTasks, hydrateSettings]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;
  return (
    <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <AppTabs />
    </ThemeProvider>
  );
}
