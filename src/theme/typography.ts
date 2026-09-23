import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

type TextVariant = TextStyle & { fontFamily: string };

export const typography: Record<
  | 'clock'
  | 'displayLg'
  | 'displayMd'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyMedium'
  | 'label'
  | 'caption',
  TextVariant
> = {
  clock: {
    fontFamily: fontFamily.semibold,
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  displayLg: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 40 },
  displayMd: { fontFamily: fontFamily.bold, fontSize: 26, lineHeight: 33 },
  heading: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 27 },
  subheading: { fontFamily: fontFamily.medium, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
};
