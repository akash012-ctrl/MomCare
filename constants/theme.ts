import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { Platform } from 'react-native';

const palette = {
  primary: '#E91E63',
  secondary: '#9C27B0',
  accent: '#FF9800',
  background: '#FFF0F3',
  surface: '#FFF8FA',
  textPrimary: '#1A0A0D',
  textSecondary: '#4A2A32',
  success: '#66BB6A',
  warning: '#FFA726',
  danger: '#EF5350',
  shadow: '#D81B60',
};

export const MotherhoodTheme = {
  colors: {
    ...palette,
    mutedPink: '#F48FB1',
    lavender: '#BA68C8',
    peach: '#FFB74D',
    mint: '#81C784',
    lilac: '#AB47BC',
    blush: '#EC407A',
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
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    soft: {
      shadowColor: '#C2185B',
      shadowOpacity: 0.2,
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
    border: '#F06292',
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
