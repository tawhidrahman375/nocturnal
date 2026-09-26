import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  // Every heading-tier variant below uses this one serif weight; body/label/caption stay Figtree.
  serif: 'Fraunces_600SemiBold',
} as const;

type TextVariant = TextStyle & { fontFamily: string };

// Inter's default tracking reads loose at display sizes, so headings tighten as they grow.
export const typography: Record<
  | 'clock'
  | 'stat'
  | 'heroTitle'
  | 'displayLg'
  | 'displayMd'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyMedium'
  | 'label'
  | 'caption'
  | 'overline',
  TextVariant
> = {
  clock: {
    fontFamily: fontFamily.serif,
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  stat: {
    fontFamily: fontFamily.serif,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  // Reserved for the one hero moment per key screen (Home greeting, Insights title,
  // the Journal empty state) — heavier and bigger than displayLg so it actually dominates.
  heroTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1,
  },
  displayLg: { fontFamily: fontFamily.serif, fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  displayMd: { fontFamily: fontFamily.serif, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  heading: { fontFamily: fontFamily.serif, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  subheading: { fontFamily: fontFamily.serif, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 24, letterSpacing: -0.1 },
  label: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};
