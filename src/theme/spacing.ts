const unit = 8;

export const spacing = {
  unit,
  xs: unit / 2, // 4
  sm: unit, // 8
  md: unit * 2, // 16
  lg: unit * 3, // 24
  xl: unit * 4, // 32
  xxl: unit * 6, // 48
  screenPadding: 20,
  cardPadding: 16,
} as const;

export const radius = {
  card: 12,
  button: 8,
  pill: 24,
} as const;
