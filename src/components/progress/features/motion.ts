// src/components/progress/features/motion.ts
//
// The indeterminate animations as pure functions of elapsed time, ported from
// Compose ProgressIndicator.kt. Everything here is deterministic, so the
// motion can be tested without a canvas or a clock.

import { PROGRESS_EASING, PROGRESS_MOTION, PROGRESS_WAVE } from "../constants";

/**
 * A cubic Bézier easing, as CSS and Compose define it: the curve through
 * (0,0), (x1,y1), (x2,y2), (1,1), solved for y at a given x.
 */
export const cubicBezier = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): ((t: number) => number) => {
  const curve = (a: number, b: number, t: number): number => {
    const u = 1 - t;
    return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
  };
  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Newton's method, then bisection for the stubborn cases
    let t = x;
    for (let i = 0; i < 8; i++) {
      const currentX = curve(x1, x2, t) - x;
      if (Math.abs(currentX) < 1e-5) return curve(y1, y2, t);
      const slope =
        3 * (1 - t) * (1 - t) * x1 +
        6 * (1 - t) * t * (x2 - x1) +
        3 * t * t * (1 - x2);
      if (Math.abs(slope) < 1e-6) break;
      t -= currentX / slope;
    }
    let low = 0;
    let high = 1;
    t = x;
    while (high - low > 1e-5) {
      if (curve(x1, x2, t) < x) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return curve(y1, y2, t);
  };
};

const easing = (points: readonly number[]): ((t: number) => number) =>
  cubicBezier(points[0]!, points[1]!, points[2]!, points[3]!);

export const emphasizedAccelerate = easing(PROGRESS_EASING.EMPHASIZED_ACCELERATE);
export const emphasizedDecelerate = easing(PROGRESS_EASING.EMPHASIZED_DECELERATE);
export const standardEasing = easing(PROGRESS_EASING.STANDARD);

/**
 * One of the four keyframed lines of the linear indeterminate animation: it
 * holds at 0 until its delay, eases to 1 over its duration, then holds.
 */
const line = (elapsed: number, delay: number, duration: number): number => {
  if (elapsed <= delay) return 0;
  if (elapsed >= delay + duration) return 1;
  return emphasizedAccelerate((elapsed - delay) / duration);
};

/** Where the two indeterminate bars are, as fractions of the track */
export interface LinearIndeterminateFrame {
  firstHead: number;
  firstTail: number;
  secondHead: number;
  secondTail: number;
}

/**
 * The linear indeterminate frame at `elapsed` milliseconds: two bars, each
 * from its tail to its head, on the Compose keyframes over a 1750ms cycle.
 */
export const linearIndeterminateFrame = (
  elapsed: number
): LinearIndeterminateFrame => {
  const m = PROGRESS_MOTION.LINEAR;
  const t = ((elapsed % m.DURATION) + m.DURATION) % m.DURATION;
  return {
    firstHead: line(t, m.FIRST_HEAD_DELAY, m.FIRST_HEAD_DURATION),
    firstTail: line(t, m.FIRST_TAIL_DELAY, m.FIRST_TAIL_DURATION),
    secondHead: line(t, m.SECOND_HEAD_DELAY, m.SECOND_HEAD_DURATION),
    secondTail: line(t, m.SECOND_TAIL_DELAY, m.SECOND_TAIL_DURATION),
  };
};

/** Interpolates a keyframe list of [time, value] pairs with one easing */
const keyframes = (
  elapsed: number,
  frames: readonly (readonly [number, number])[],
  ease: (t: number) => number = (t) => t
): number => {
  const first = frames[0]!;
  if (elapsed <= first[0]) return first[1];
  for (let i = 1; i < frames.length; i++) {
    const [time, value] = frames[i]!;
    const [prevTime, prevValue] = frames[i - 1]!;
    if (elapsed <= time) {
      const span = time - prevTime;
      const fraction = span <= 0 ? 1 : ease((elapsed - prevTime) / span);
      return prevValue + (value - prevValue) * fraction;
    }
  }
  return frames[frames.length - 1]![1];
};

/** How far round the arc has turned, and how much of the circle it covers */
export interface CircularIndeterminateFrame {
  /** Rotation of the arc's start, in degrees clockwise from 3 o'clock */
  rotation: number;
  /** Length of the arc as a fraction of the circle */
  sweep: number;
}

/**
 * The circular indeterminate frame at `elapsed` milliseconds: a 1080 degree
 * linear turn over the 6 second cycle, four 90 degree kicks on top of it, and
 * an arc that grows to 87% by half way and shrinks back to 10%.
 */
export const circularIndeterminateFrame = (
  elapsed: number
): CircularIndeterminateFrame => {
  const m = PROGRESS_MOTION.CIRCULAR;
  const t = ((elapsed % m.DURATION) + m.DURATION) % m.DURATION;

  const global = (t / m.DURATION) * m.GLOBAL_ROTATION;

  // 90 degrees every 1500ms, each kick taking 300ms on the decelerate curve
  const step = m.ADDITIONAL_ROTATION / 4;
  const completed = Math.floor(t / m.ROTATION_DELAY);
  const intoStep = t - completed * m.ROTATION_DELAY;
  const kick =
    intoStep >= m.ROTATION_DURATION
      ? step
      : step * emphasizedDecelerate(intoStep / m.ROTATION_DURATION);
  const additional = completed * step + kick;

  const half = m.DURATION / 2;
  const sweep =
    t <= half
      ? keyframes(t, [
          [0, m.MIN_PROGRESS],
          [half, m.MAX_PROGRESS],
        ])
      : keyframes(
          t,
          [
            [half, m.MAX_PROGRESS],
            [m.DURATION, m.MIN_PROGRESS],
          ],
          standardEasing
        );

  return { rotation: global + additional, sweep };
};

/**
 * How tall the wave is for a determinate value: flat at both ends of the
 * range, full in between (WavyProgressIndicatorDefaults.indicatorAmplitude).
 */
export const waveAmplitudeTarget = (progress: number): number =>
  progress <= PROGRESS_WAVE.AMPLITUDE_START || progress >= PROGRESS_WAVE.AMPLITUDE_END
    ? 0
    : 1;

/**
 * The wave's height part way through a change: standard easing on the way in,
 * emphasized accelerate on the way out, over 500ms either way.
 */
export const waveAmplitudeAt = (
  from: number,
  target: number,
  elapsed: number
): number => {
  if (from === target) return target;
  const fraction = Math.min(1, Math.max(0, elapsed / PROGRESS_WAVE.AMPLITUDE_DURATION));
  const ease = target > from ? standardEasing : emphasizedAccelerate;
  return from + (target - from) * ease(fraction);
};
