import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export async function triggerHaptic(enabled: boolean, kind: 'light' | 'medium' | 'success' | 'warning') {
  if (!enabled || Platform.OS === 'web') return;
  try {
    if (kind === 'success' || kind === 'warning') {
      await Haptics.notificationAsync(
        kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      );
      return;
    }
    await Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics are an enhancement and may be unavailable on some devices.
  }
}
