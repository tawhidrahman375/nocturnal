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
    // Frosted-glass fill for floating controls and secondary surfaces (design.md section 4).
    glass: 'rgba(255, 255, 255, 0.10)',
    // A quieter glass for example/preview cards that are not interactive.
    glassSoft: 'rgba(255, 255, 255, 0.08)',
    // The glass fill one step brighter, for a focused glass input.
    glassFocused: 'rgba(255, 255, 255, 0.16)',
    // The unselected circle on an option card: a faint white, barely lifted off the card.
    indicator: 'rgba(255, 255, 255, 0.15)',
    // The empty track of a progress bar.
    track: 'rgba(255, 255, 255, 0.15)',
    // A faint accent wash over a selected glass card.
    selectedTint: 'rgba(108, 142, 255, 0.15)',
  },
  border: {
    default: '#2A3350',
    subtle: 'rgba(42, 51, 80, 0.6)',
    // Hairline edge for the one dark-pill override on the Home WBTB card.
    glass: 'rgba(255, 255, 255, 0.15)',
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
  // The Welcome screen's one-off moonlit scene (src/screens/auth/WelcomeScreen.tsx), not a
  // general-purpose palette — the sky gradient, the moon and its halo, the stars, and the
  // silhouetted hills at the bottom.
  moonlit: {
    skyTop: '#2B3178',
    skyBottom: '#12143A',
    moon: '#F5F3F0',
    moonCore: '#F0EEE8',
    moonEdge: '#C8CCE0',
    moonCrater: 'rgba(180, 185, 210, 0.15)',
    moonGlow: 'rgba(245, 243, 240, 0.08)',
    hill: '#1E2456',
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
    // Dark navy: white on the #6C8EFF accent fails 4.5:1 (design.md section 3f).
    onAccent: '#12143A',
  },
} as const;
