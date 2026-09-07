// test/components/progress/motion.test.ts
//
// The indeterminate animations against the Compose keyframes
// (ProgressIndicator.kt) and the wave's amplitude rule
// (WavyProgressIndicatorDefaults.indicatorAmplitude).
import { describe, test, expect } from 'bun:test';
import {
  cubicBezier,
  linearIndeterminateFrame,
  circularIndeterminateFrame,
  waveAmplitudeTarget,
  waveAmplitudeAt,
  emphasizedAccelerate,
  standardEasing,
} from '../../../src/components/progress/features/motion';
import { PROGRESS_MOTION } from '../../../src/components/progress/constants';

describe('easing', () => {
  test('a cubic bezier passes through its ends and solves y for x', () => {
    const linear = cubicBezier(0, 0, 1, 1);
    expect(linear(0)).toBe(0);
    expect(linear(1)).toBe(1);
    expect(linear(0.25)).toBeCloseTo(0.25, 3);
    expect(linear(0.5)).toBeCloseTo(0.5, 3);
    // emphasized accelerate starts slowly and ends fast
    expect(emphasizedAccelerate(0.25)).toBeLessThan(0.25);
    expect(emphasizedAccelerate(1)).toBe(1);
    // standard easing does the opposite
    expect(standardEasing(0.25)).toBeGreaterThan(0.25);
    expect(standardEasing(0)).toBe(0);
  });

  test('easings stay inside the unit square and never go backwards', () => {
    for (const ease of [emphasizedAccelerate, standardEasing]) {
      let previous = -1;
      for (let x = 0; x <= 1.0001; x += 0.02) {
        const y = ease(Math.min(1, x));
        expect(y).toBeGreaterThanOrEqual(-1e-6);
        expect(y).toBeLessThanOrEqual(1 + 1e-6);
        expect(y).toBeGreaterThanOrEqual(previous - 1e-6);
        previous = y;
      }
    }
  });
});

describe('linear indeterminate', () => {
  const m = PROGRESS_MOTION.LINEAR;

  test('each of the four lines waits for its delay, then eases to one', () => {
    expect(linearIndeterminateFrame(0)).toEqual({
      firstHead: 0,
      firstTail: 0,
      secondHead: 0,
      secondTail: 0,
    });
    // the first bar's head is the first to move, and reaches the end at 1000ms
    expect(linearIndeterminateFrame(1)!.firstHead).toBeGreaterThan(0);
    expect(linearIndeterminateFrame(m.FIRST_HEAD_DURATION).firstHead).toBe(1);
    // the tail waits 250ms
    expect(linearIndeterminateFrame(250).firstTail).toBe(0);
    expect(linearIndeterminateFrame(251).firstTail).toBeGreaterThan(0);
    expect(linearIndeterminateFrame(1250).firstTail).toBe(1);
    // the second bar starts at 650ms and its tail at 900ms
    expect(linearIndeterminateFrame(650).secondHead).toBe(0);
    expect(linearIndeterminateFrame(651).secondHead).toBeGreaterThan(0);
    expect(linearIndeterminateFrame(900).secondTail).toBe(0);
    expect(linearIndeterminateFrame(1500).secondHead).toBe(1);
    expect(linearIndeterminateFrame(1750).secondTail).toBe(0); // the cycle restarted
  });

  test('a bar never runs backwards, and the head always leads the tail', () => {
    for (let t = 0; t < m.DURATION; t += 25) {
      const frame = linearIndeterminateFrame(t);
      expect(frame.firstHead).toBeGreaterThanOrEqual(frame.firstTail);
      expect(frame.secondHead).toBeGreaterThanOrEqual(frame.secondTail);
      expect(frame.firstTail).toBeGreaterThanOrEqual(frame.secondHead - 1e-9);
    }
  });

  test('the cycle repeats every 1750ms', () => {
    expect(linearIndeterminateFrame(400)).toEqual(linearIndeterminateFrame(400 + m.DURATION));
    expect(linearIndeterminateFrame(400)).toEqual(linearIndeterminateFrame(400 + 4 * m.DURATION));
  });
});

describe('circular indeterminate', () => {
  const m = PROGRESS_MOTION.CIRCULAR;

  test('the arc grows to 87% by half way and shrinks back to 10%', () => {
    expect(circularIndeterminateFrame(0).sweep).toBeCloseTo(m.MIN_PROGRESS, 5);
    expect(circularIndeterminateFrame(m.DURATION / 2).sweep).toBeCloseTo(m.MAX_PROGRESS, 5);
    expect(circularIndeterminateFrame(m.DURATION - 1).sweep).toBeCloseTo(m.MIN_PROGRESS, 2);
    for (let t = 0; t < m.DURATION; t += 50) {
      const { sweep } = circularIndeterminateFrame(t);
      expect(sweep).toBeGreaterThanOrEqual(m.MIN_PROGRESS - 1e-6);
      expect(sweep).toBeLessThanOrEqual(m.MAX_PROGRESS + 1e-6);
    }
  });

  test('the arc turns 1440 degrees a cycle: 1080 of steady spin and four quarter turns', () => {
    expect(circularIndeterminateFrame(0).rotation).toBeCloseTo(0, 5);
    // each kick takes 300ms and then holds until the next 1500ms mark
    expect(circularIndeterminateFrame(300).rotation).toBeCloseTo(90 + 54, 0);
    expect(circularIndeterminateFrame(1499).rotation).toBeCloseTo(90 + 269.8, 0);
    expect(circularIndeterminateFrame(m.DURATION - 1).rotation).toBeCloseTo(1440, 0);
    // and it only ever moves forwards
    let previous = -1;
    for (let t = 0; t < m.DURATION; t += 25) {
      const { rotation } = circularIndeterminateFrame(t);
      expect(rotation).toBeGreaterThanOrEqual(previous);
      previous = rotation;
    }
  });

  test('the cycle repeats every 6 seconds', () => {
    const a = circularIndeterminateFrame(1234);
    const b = circularIndeterminateFrame(1234 + m.DURATION);
    expect(a.sweep).toBeCloseTo(b.sweep, 10);
    expect(a.rotation).toBeCloseTo(b.rotation, 10);
  });
});

describe('the wave', () => {
  test('flattens under 10% and over 95%, and is full in between', () => {
    expect(waveAmplitudeTarget(0)).toBe(0);
    expect(waveAmplitudeTarget(0.1)).toBe(0);
    expect(waveAmplitudeTarget(0.11)).toBe(1);
    expect(waveAmplitudeTarget(0.5)).toBe(1);
    expect(waveAmplitudeTarget(0.94)).toBe(1);
    expect(waveAmplitudeTarget(0.95)).toBe(0);
    expect(waveAmplitudeTarget(1)).toBe(0);
  });

  test('takes 500ms to appear or go, standard easing in, accelerate out', () => {
    expect(waveAmplitudeAt(0, 1, 0)).toBe(0);
    expect(waveAmplitudeAt(0, 1, 500)).toBe(1);
    expect(waveAmplitudeAt(0, 1, 900)).toBe(1);
    // in on the standard curve: past half way by the time a quarter has gone
    expect(waveAmplitudeAt(0, 1, 125)).toBeGreaterThan(0.25);
    // out on the accelerate curve: still most of the way up a quarter in
    expect(waveAmplitudeAt(1, 0, 125)).toBeGreaterThan(0.75);
    expect(waveAmplitudeAt(1, 0, 500)).toBe(0);
    expect(waveAmplitudeAt(0.5, 0.5, 10)).toBe(0.5);
  });
});
