import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

type TextVariant = TextStyle & { fontFamily: string };

// Inter's default tracking reads loose at display sizes, so headings tighten as they grow.
export const typography: Record<
  | 'clock'
  | 'stat'
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
    fontFamily: fontFamily.semibold,
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  stat: {
    fontFamily: fontFamily.bold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  displayLg: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  displayMd: { fontFamily: fontFamily.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  heading: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  subheading: { fontFamily: fontFamily.medium, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
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
