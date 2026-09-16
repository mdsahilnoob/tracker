export type KeyboardAvoidingBehavior = 'height' | 'padding';

export function getKeyboardAvoidingBehavior(platform: string): KeyboardAvoidingBehavior {
  return platform === 'ios' ? 'padding' : 'height';
}
