// src/components/loading-indicator/features/motion.ts
//
// The clock, after Compose LoadingIndicator.kt: every 650ms a morph to the
// next shape runs on a bouncy spring (damping 0.6, stiffness 200) and turns
// the shape a quarter turn, while a slow linear rotation adds a full turn
// every 4666ms. The spring is treated as finished, as Compose does, once it
// is within the visibility threshold of the target with little velocity,
// which for this spring is at the top of its overshoot; the shape then
// snaps to the next index and holds until the interval ends. Determinate
// indicators morph from a circle to a soft burst with the value and turn
// half a circle counter-clockwise over the range.

import { LOADING_INDICATOR_DEFAULTS, LOADING_INDICATOR_SPRING } from '../constants';

/** Closed-form unit step of an underdamped spring: position and velocity at time t (seconds) */
const spring = (t: number): [number, number] => {
  const zeta = LOADING_INDICATOR_SPRING.DAMPING;
  const omega = Math.sqrt(LOADING_INDICATOR_SPRING.STIFFNESS);
  const omegaD = omega * Math.sqrt(1 - zeta * zeta);
  const decay = Math.exp(-zeta * omega * t);
  const position = 1 - decay * (Math.cos(omegaD * t) + ((zeta * omega) / omegaD) * Math.sin(omegaD * t));
  const velocity = decay * ((omega * omega) / omegaD) * Math.sin(omegaD * t);
  return [position, velocity];
};

/**
 * When the spring counts as finished. Compose (SpringEstimation) takes the
 * time after which the spring's envelope, the amplitude of its decaying
 * oscillation, is under the visibility threshold; for this spring that is
 * just past the top of its first overshoot, where the value then snaps to
 * the target.
 */
const settleTime = (): number => {
  const threshold = LOADING_INDICATOR_SPRING.THRESHOLD;
  const zeta = LOADING_INDICATOR_SPRING.DAMPING;
  const omega = Math.sqrt(LOADING_INDICATOR_SPRING.STIFFNESS);
  const omegaD = omega * Math.sqrt(1 - zeta * zeta);
  // unit displacement, no initial velocity
  const c1 = 1;
  const c2 = (zeta * omega * c1) / omegaD;
  const amplitude = Math.sqrt(c1 * c1 + c2 * c2);
  return Math.log(amplitude / threshold) / (zeta * omega);
};

/** Seconds from the start of a morph to its end */
export const MORPH_SETTLE_SECONDS = settleTime();

/** Morph progress at `elapsed` milliseconds into an interval */
export const morphProgress = (elapsed: number): number => {
  const t = elapsed / 1000;
  if (t >= MORPH_SETTLE_SECONDS) return 1;
  return spring(t)[0];
};

/** The indeterminate frame at `elapsed` milliseconds since the animation started */
export const indeterminateFrame = (elapsed: number, shapeCount: number): { index: number; progress: number; rotation: number } => {
  const interval = LOADING_INDICATOR_DEFAULTS.MORPH_INTERVAL;
  const cycles = Math.floor(elapsed / interval);
  const inCycle = elapsed - cycles * interval;
  const index = cycles % shapeCount;
  const progress = morphProgress(inCycle);
  // Compose starts at a quarter turn and adds one per completed morph
  const morphRotation = LOADING_INDICATOR_DEFAULTS.MORPH_ROTATION * (cycles + 1) + progress * LOADING_INDICATOR_DEFAULTS.MORPH_ROTATION;
  const globalRotation = ((elapsed % LOADING_INDICATOR_DEFAULTS.ROTATION_DURATION) / LOADING_INDICATOR_DEFAULTS.ROTATION_DURATION) * 360;
  return { index, progress, rotation: (morphRotation + globalRotation) % 360 };
};

/** The still frame reduced motion shows: the shape for this interval, unrotated */
export const reducedMotionFrame = (elapsed: number, shapeCount: number): { index: number; progress: number; rotation: number } => ({
  index: Math.floor(elapsed / LOADING_INDICATOR_DEFAULTS.MORPH_INTERVAL) % shapeCount,
  progress: 0,
  rotation: 0,
});

/** The determinate frame for a value from 0 to 1 */
export const determinateFrame = (value: number): { index: number; progress: number; rotation: number } => ({
  index: 0,
  progress: value,
  rotation: -value * 180,
});
