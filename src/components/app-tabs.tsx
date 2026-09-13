import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FloatingTabBar } from '@/components/ui/floating-tab-bar';

export default function AppTabs() {
  return (
    <View style={styles.shell}>
      <Slot />
      <FloatingTabBar />
    </View>
  );
}

const styles = StyleSheet.create({ shell: { flex: 1 } });
