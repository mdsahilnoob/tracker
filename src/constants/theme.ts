import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#151412',
    background: '#FFF8F4',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FFF0E7',
    textSecondary: '#665E59',
    border: '#F0E1D8',
    muted: '#A39992',
    danger: '#C84C39',
    accentSoft: '#FFE2D3',
    navBackground: '#171615',
    navInactive: '#B7ADA7',
  },
  dark: {
    text: '#FFF8F3',
    background: '#211A18',
    backgroundElement: '#2D2421',
    backgroundSelected: '#3A2A25',
    textSecondary: '#C8B9B1',
    border: '#4A3831',
    muted: '#9C8980',
    danger: '#F07A6D',
    accentSoft: '#4C2A20',
    navBackground: '#0E0D0D',
    navInactive: '#9B8C85',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 92, android: 104, web: 96 }) ?? 104;
export const MaxContentWidth = 720;

export const AccentColors = ['#FF6B1A', '#E35D38', '#D65B83', '#7D70E8', '#438FCE', '#3BA478'];
