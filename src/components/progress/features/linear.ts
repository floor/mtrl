// src/components/progress/features/linear.ts
//
// The linear indicator, after Compose ProgressIndicator.kt and
// WavyProgressIndicator.kt: an active indicator from the leading edge, a
// track after it with a gap between the two, a stop indicator at the trailing
// end, and, when indeterminate, two bars running the track on keyframes.
// Everything is measured in fractions of the width, as Compose does, so the
// port stays close to the source.

import { CanvasContext } from "./canvas";
import { ProgressColors } from "./colors";
import { linearIndeterminateFrame } from "./motion";
import { PROGRESS_MEASUREMENTS, PROGRESS_WAVE } from "../constants";

/** What a frame of the linear indicator needs */
export interface LinearFrame {
  /** Progress from 0 to 1; ignored when indeterminate */
  progress: number;
  /** Buffer from 0 to 1, this library's own extension; 0 for none */
  buffer: number;
  indeterminate: boolean;
  /** Track and indicator thickness in pixels */
  strokeWidth: number;
  /** Milliseconds since the animation started */
  time: number;
  /** Wave height in pixels; 0 draws a flat indicator */
  waveAmplitude: number;
  /** Right to left, in which case the indicator runs from the right */
  rtl: boolean;
  colors: ProgressColors;
  /** Whether to mark the end of the track with a dot */
  showStopIndicator: boolean;
}

/**
 * A bar between two fractions of the width. Round caps are kept inside the
 * canvas, as Compose does, so the ends are not clipped.
 */
const drawBar = (
  ctx: CanvasRenderingContext2D,
  width: number,
  centerY: number,
  strokeWidth: number,
  from: number,
  to: number,
  color: string,
  rtl: boolean,
  wave?: { amplitude: number; wavelength: number; phase: number }
): void => {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  if (end - start <= 0) return;

  const cap = strokeWidth / 2;
  const toX = (fraction: number): number => {
    const f = rtl ? 1 - fraction : fraction;
    return Math.min(Math.max(f * width, cap), width - cap);
  };
  const x0 = toX(start);
  const x1 = toX(end);
  if (Math.abs(x1 - x0) < 1e-6 && start !== end) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  if (!wave || wave.amplitude <= 0) {
    ctx.moveTo(Math.min(x0, x1), centerY);
    ctx.lineTo(Math.max(x0, x1), centerY);
    ctx.stroke();
    return;
  }

  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const step = Math.max(1, wave.wavelength / 24);
  for (let x = left; x <= right; x += step) {
    const y = centerY + wave.amplitude * Math.sin((2 * Math.PI * (x - wave.phase)) / wave.wavelength);
    if (x === left) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  const endY =
    centerY + wave.amplitude * Math.sin((2 * Math.PI * (right - wave.phase)) / wave.wavelength);
  ctx.lineTo(right, endY);
  ctx.stroke();
};

/**
 * The dot that marks the end of the track. It is required whenever the track
 * has less than 3:1 contrast with its surroundings, so it is drawn by
 * default (M3 progress indicator accessibility).
 */
const drawStopIndicator = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  rtl: boolean
): void => {
  const size = Math.min(PROGRESS_MEASUREMENTS.LINEAR.STOP_INDICATOR, height);
  const offset = Math.min((height - size) / 2, PROGRESS_MEASUREMENTS.LINEAR.STOP_TRAILING_SPACE);
  const x = rtl ? size / 2 + offset : width - size / 2 - offset;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, height / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();
};

/**
 * Draws one frame of the linear indicator.
 */
export const drawLinearProgress = (
  context: CanvasContext,
  frame: LinearFrame
): void => {
  const { ctx, width, height } = context;
  const { strokeWidth, colors, rtl, indeterminate, waveAmplitude } = frame;
  if (width <= 0 || height <= 0) return;

  const centerY = height / 2;
  ctx.clearRect(0, 0, width, height);

  // Round caps put half a stroke beyond each end, so the gap has to clear it
  const gapPx = PROGRESS_MEASUREMENTS.LINEAR.GAP + strokeWidth;
  const gap = width > 0 ? gapPx / width : 0;

  const wavelength = indeterminate
    ? PROGRESS_WAVE.LINEAR.INDETERMINATE_WAVELENGTH
    : PROGRESS_WAVE.LINEAR.WAVELENGTH;
  const wave =
    waveAmplitude > 0
      ? {
          amplitude: waveAmplitude,
          wavelength,
          phase: ((frame.time / 1000) * PROGRESS_WAVE.SPEED * wavelength) % wavelength,
        }
      : undefined;

  const bar = (from: number, to: number, color: string, wavy = false): void =>
    drawBar(ctx, width, centerY, strokeWidth, from, to, color, rtl, wavy ? wave : undefined);

  if (indeterminate) {
    const { firstHead, firstTail, secondHead, secondTail } = linearIndeterminateFrame(frame.time);

    // Track ahead of the leading bar
    if (firstHead < 1 - gap) {
      bar(firstHead > 0 ? firstHead + gap : 0, 1, colors.track);
    }
    // Leading bar
    if (firstHead - firstTail > 0) {
      bar(firstTail, firstHead, colors.indicator, true);
    }
    // Track between the two bars
    if (firstTail > gap) {
      bar(
        secondHead > 0 ? secondHead + gap : 0,
        firstTail < 1 ? firstTail - gap : 1,
        colors.track
      );
    }
    // Trailing bar
    if (secondHead - secondTail > 0) {
      bar(secondTail, secondHead, colors.indicator, true);
    }
    // Track behind the trailing bar
    if (secondTail > gap) {
      bar(0, secondTail - gap, colors.track);
    }
    return;
  }

  const progress = Math.min(1, Math.max(0, frame.progress));

  // Track after the active indicator, with the gap taken out of it
  const trackStart = progress + Math.min(progress, gap);
  if (trackStart <= 1) {
    bar(trackStart, 1, colors.track);
  }

  // The buffer, this library's extension, sits over the track
  if (frame.buffer > progress) {
    const bufferEnd = Math.min(1, frame.buffer);
    if (bufferEnd > trackStart) bar(trackStart, bufferEnd, colors.buffer);
  }

  // The active indicator. At 0 the round cap alone shows as the dot the
  // guidelines ask for at low percentages.
  bar(0, progress, colors.indicator, true);

  if (frame.showStopIndicator) {
    drawStopIndicator(ctx, width, height, colors.stop, rtl);
  }
};
