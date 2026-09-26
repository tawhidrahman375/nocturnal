import { Easing } from 'react-native';

// The seven motion tokens from DESIGN.md section 10. Every animated interaction in the
// app should map to one of these — don't hand-roll a new duration/curve elsewhere.

export const EASE_OUT = Easing.out(Easing.cubic);
export const EASE_IN_OUT = Easing.inOut(Easing.cubic);
export const EASE_AMBIENT = Easing.inOut(Easing.sin);

export const DURATIONS = {
  arrive: 320,
  micro: 150,
  cross: 200,
  reveal: 650,
  stage: 260,
  // Errors/notices use Arrive's curve but a touch faster — they're small, not a whole
  // screen settling in.
  notice: 200,
  // Ambient's half-cycle: slow enough to read as drift, not a pulse.
  ambient: 7000,
} as const;

type SpringPreset = { friction: number; tension: number };

export const SETTLE_SPRING: SpringPreset = {
  friction: 9,
  tension: 80,
};

export const RELEASE_SPRING: SpringPreset = {
  friction: 8,
  tension: 120,
};

export const POP_SPRING: SpringPreset = {
  friction: 6,
  tension: 200,
};

// Vertical/horizontal travel distance for Arrive and the stage-slide Cross variant.
export const ARRIVE_SLIDE_PX = 14;
export const STAGE_SLIDE_PX = 16;
export const NOTICE_SLIDE_PX = 6;
