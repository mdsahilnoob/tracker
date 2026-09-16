import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { getKeyboardAvoidingBehavior } from '@/lib/keyboard';
import { Icon } from './icon';
import { Button } from './button';

export function FieldSheet({ visible, title, value, placeholder, submitLabel, helperText, errorText, keyboardType = 'default', onChangeText, onCancel, onSubmit }: {
  visible: boolean;
  title: string;
  value: string;
  placeholder: string;
  submitLabel: string;
  helperText?: string;
  errorText?: string;
  keyboardType?: 'default' | 'number-pad';
  onChangeText: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={getKeyboardAvoidingBehavior(Platform.OS)} style={styles.keyboardAvoiding}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onCancel} style={styles.closeButton}>
                <Icon name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              autoFocus
              accessibilityLabel={title}
              placeholder={placeholder}
              placeholderTextColor={colors.muted}
              keyboardType={keyboardType}
              value={value}
              onChangeText={onChangeText}
              onSubmitEditing={onSubmit}
              returnKeyType="done"
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: errorText ? colors.danger : colors.border }]}
            />
            {errorText ? <Text style={[styles.helper, { color: colors.danger }]}>{errorText}</Text> : helperText ? <Text style={[styles.helper, { color: colors.textSecondary }]}>{helperText}</Text> : null}
            <View style={styles.actions}>
              <Button onPress={onCancel} variant="ghost" style={styles.action}>Cancel</Button>
              <Button onPress={onSubmit} style={styles.action}>{submitLabel}</Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20, 13, 10, 0.42)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 24, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 23, fontWeight: '800', letterSpacing: -0.6 },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, fontSize: 17 },
  helper: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  action: { flex: 1 },
});
