import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { Platform } from 'react-native';

const palette = {
  primary: '#F8BBD0',
  secondary: '#CE93D8',
  accent: '#FFDAB9',
  background: '#FFF5F7',
  surface: '#FFFFFF',
  textPrimary: '#2F1A1C',
  textSecondary: '#704C57',
  success: '#A5D6A7',
  warning: '#FFCC80',
  danger: '#EF9A9A',
  shadow: '#F2C9D6',
};

export const MotherhoodTheme = {
  colors: {
    ...palette,
    mutedPink: '#FCE4EC',
    lavender: '#E1BEE7',
    peach: '#FFE0C2',
    mint: '#D0F0D0',
    lilac: '#DCC6ED',
    blush: '#F9C9D5',
  },
  radii: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  shadows: {
    card: {
      shadowColor: palette.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    soft: {
      shadowColor: '#FAD0D7',
      shadowOpacity: 0.15,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 4,
    },
  },
  typography: {
    display: 32,
    headline: 24,
    title: 20,
    subtitle: 18,
    body: 16,
    label: 14,
    caption: 12,
  },
};

export const NavigationTheme = {
  ...NavigationDefaultTheme,
  dark: false,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: palette.primary,
    background: palette.background,
    card: palette.surface,
    text: palette.textPrimary,
    border: '#F5D6DB',
    notification: palette.secondary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
