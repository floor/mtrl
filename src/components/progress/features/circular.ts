// src/components/progress/features/circular.ts
//
// The circular indicator, after Compose ProgressIndicator.kt and
// WavyProgressIndicator.kt: an arc from 12 o'clock clockwise, a track around
// the rest with a gap at both ends of the arc, and, when indeterminate, an
// arc that grows and shrinks as it turns. A circular indeterminate indicator
// has no track (ProgressIndicatorDefaults.circularIndeterminateTrackColor is
// transparent).

import { CanvasContext } from "./canvas";
import { ProgressColors } from "./colors";
import { circularIndeterminateFrame } from "./motion";
import { PROGRESS_MEASUREMENTS, PROGRESS_WAVE } from "../constants";

/** What a frame of the circular indicator needs */
export interface CircularFrame {
  /** Progress from 0 to 1; ignored when indeterminate */
  progress: number;
  indeterminate: boolean;
  /** Arc thickness in pixels */
  strokeWidth: number;
  /** Milliseconds since the animation started */
  time: number;
  /** Wave height in pixels; 0 draws a flat arc */
  waveAmplitude: number;
  colors: ProgressColors;
}

const TWO_PI = Math.PI * 2;
/** 12 o'clock, where a circular indicator starts */
const START_ANGLE = -Math.PI / 2;

/**
 * An arc, flat or waved. The wave runs along the arc at one wavelength per
 * second, displacing it towards and away from the centre.
 */
const drawArc = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  from: number,
  sweep: number,
  color: string,
  strokeWidth: number,
  wave?: { amplitude: number; wavelength: number; phase: number }
): void => {
  if (sweep <= 0 || radius <= 0) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  if (!wave || wave.amplitude <= 0) {
    ctx.arc(centerX, centerY, radius, from, from + sweep);
    ctx.stroke();
    return;
  }

  // One point every few pixels along the arc, so the wave stays smooth
  const arcLength = sweep * radius;
  const steps = Math.max(8, Math.ceil(arcLength / Math.max(1, wave.wavelength / 24)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = from + sweep * t;
    const along = t * arcLength;
    const r =
      radius + wave.amplitude * Math.sin((TWO_PI * (along - wave.phase)) / wave.wavelength);
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
};

/**
 * Draws one frame of the circular indicator.
 */
export const drawCircularProgress = (
  context: CanvasContext,
  frame: CircularFrame
): void => {
  const { ctx, width, height } = context;
  const { strokeWidth, colors, indeterminate, waveAmplitude } = frame;
  if (width <= 0 || height <= 0) return;

  const size = Math.min(width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = size / 2 - strokeWidth / 2 - waveAmplitude;
  if (radius <= 0) return;

  ctx.clearRect(0, 0, width, height);

  // The wavelength is a fixed 15dp at the default 40dp size and grows with it,
  // so the waveform keeps its proportions (M3: "the waveform should scale
  // with the size")
  const scale = size / PROGRESS_MEASUREMENTS.CIRCULAR.SIZE;
  const wavelength = PROGRESS_WAVE.CIRCULAR.WAVELENGTH * scale;
  const wave =
    waveAmplitude > 0
      ? {
          amplitude: waveAmplitude,
          wavelength,
          phase: ((frame.time / 1000) * PROGRESS_WAVE.SPEED * wavelength) % wavelength,
        }
      : undefined;

  // Round caps add half a stroke at each end of the arc, so the gap clears it
  const gapPx = PROGRESS_MEASUREMENTS.CIRCULAR.GAP + strokeWidth;
  const gapSweep = size > 0 ? (gapPx / (Math.PI * size)) * TWO_PI : 0;

  if (indeterminate) {
    const { rotation, sweep } = circularIndeterminateFrame(frame.time);
    const start = (rotation * Math.PI) / 180;
    drawArc(ctx, centerX, centerY, radius, start, sweep * TWO_PI, colors.indicator, strokeWidth, wave);
    return;
  }

  const progress = Math.min(1, Math.max(0, frame.progress));
  const sweep = progress * TWO_PI;
  const gap = Math.min(sweep, gapSweep);

  // Track around the rest of the circle, clear of both ends of the arc
  const trackSweep = TWO_PI - sweep - gap * 2;
  if (trackSweep > 0) {
    drawArc(
      ctx,
      centerX,
      centerY,
      radius,
      START_ANGLE + sweep + gap,
      trackSweep,
      colors.track,
      strokeWidth
    );
  }

  // The active arc. Nothing shows at 0; at a low value the round caps alone
  // read as the dot the guidelines ask for.
  drawArc(ctx, centerX, centerY, radius, START_ANGLE, sweep, colors.indicator, strokeWidth, wave);
};
