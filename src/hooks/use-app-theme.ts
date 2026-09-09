import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useSettingsStore } from '@/stores/use-settings-store';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const preference = useSettingsStore((state) => state.settings.theme);
  const mode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  return { mode, colors: Colors[mode], accent: useSettingsStore((state) => state.settings.accentColor) };
}
