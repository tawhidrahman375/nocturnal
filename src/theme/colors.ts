export const colors = {
  background: {
    primary: '#0A0E1A',
    secondary: '#111827',
  },
  surface: {
    // Depth now comes from this being just a shade off the background, not a stroke.
    card: '#0F1628',
    cardElevated: '#1E2840',
    translucent: 'rgba(26, 32, 53, 0.72)',
  },
  border: {
    default: '#2A3350',
    subtle: 'rgba(42, 51, 80, 0.6)',
  },
  accent: {
    primary: '#6C8EFF',
    secondary: '#A78BFA',
    primaryMuted: 'rgba(108, 142, 255, 0.14)',
    primaryBorder: 'rgba(108, 142, 255, 0.32)',
  },
  status: {
    lucid: '#34D399',
    lucidMuted: 'rgba(52, 211, 153, 0.12)',
    danger: '#F87171',
  },
  text: {
    primary: '#F0F4FF',
    secondary: '#8B9CC7',
    tertiary: '#4B5A7A',
    onAccent: '#FFFFFF',
  },
} as const;
