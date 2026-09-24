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
  // Scrollable tab screens pad their bottom by this so content clears the floating tab bar.
  tabBarClearance: 120,
} as const;

export const radius = {
  card: 12,
  button: 12,
  sheet: 24,
  pill: 999,
} as const;
