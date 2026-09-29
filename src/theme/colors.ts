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
  // Gradient stops for the NightSky background (src/components/NightSky.tsx), not a
  // general-purpose surface/accent — used only behind hero content.
  nightSky: {
    deep: '#0D0B2B',
    mid: '#1A1550',
    glow: 'rgba(108, 142, 255, 0.25)',
  },
  // Fill and text for the dream-category pill on Journal cards (src/components/
  // DreamCategoryPill.tsx). Translucent tints so they sit on the card the way the Lucid
  // badge always has, except sleep paralysis, which is deliberately a solid warning tag.
  dreamCategory: {
    lucid: { fill: 'rgba(52, 211, 153, 0.12)', text: '#34D399' },
    nightmare: { fill: 'rgba(127, 29, 29, 0.42)', text: '#E8A0A0' },
    adventure: { fill: 'rgba(15, 118, 110, 0.4)', text: '#7DE3D6' },
    emotional: { fill: 'rgba(190, 120, 140, 0.2)', text: '#E8A7B8' },
    surreal: { fill: 'rgba(108, 142, 255, 0.3)', text: '#B4C4FF' },
    mundane: { fill: 'rgba(160, 174, 210, 0.24)', text: '#CBD3EA' },
    recurring: { fill: 'rgba(251, 146, 60, 0.14)', text: '#FDBA74' },
    'sleep paralysis': { fill: '#E11D2E', text: '#FFFFFF' },
    'astral projection': { fill: 'rgba(109, 40, 217, 0.4)', text: '#C4B5FD' },
    unknown: { fill: 'rgba(139, 156, 199, 0.12)', text: '#8B9CC7' },
    // Soft violet halo for astral projection only. Static, so it costs nothing per frame.
    astralGlow: 'rgba(167, 139, 250, 0.55)',
    // The same idea in red, so the sleep paralysis warning tag reads as a warning at a glance.
    sleepParalysisGlow: 'rgba(239, 68, 68, 0.7)',
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
