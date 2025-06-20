/**
 * Circular progress drawing functionality
 */

import { ProgressConfig, ProgressShape } from "../types";
import { PROGRESS_MEASUREMENTS, PROGRESS_WAVE } from "../constants";
import { getThemeColor } from "../../../core/utils";
import { getStrokeWidth, getWaveAmplitude, CanvasContext } from "./canvas";

/**
 * Draws a wavy arc by modulating the radius with a smooth wave pattern
 * Uses a modified sine wave to create rounded peaks
 */
const drawWavyArc = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  baseRadius: number,
  startAngle: number,
  endAngle: number,
  waveAmplitude: number,
  waveFrequency: number,
  animationTime: number
): void => {
  const steps = Math.max(100, Math.abs(endAngle - startAngle) * 50); // More steps for smoother curves
  const angleStep = (endAngle - startAngle) / steps;

  // Convert rotations per second to radians per millisecond
  const waveSpeed = (PROGRESS_WAVE.CIRCULAR.SPEED * 2 * Math.PI) / 1000;

  ctx.beginPath();

  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + angleStep * i;

    // Generate base sine wave
    const phase = angle * waveFrequency + animationTime * waveSpeed;
    const sineWave = Math.sin(phase);

    // Apply smoothing to create rounder peaks (same as linear)
    const smoothedWave =
      Math.sign(sineWave) *
      Math.pow(Math.abs(sineWave), PROGRESS_WAVE.CIRCULAR.POWER);

    // Apply wave to radius
    const radiusModulation = smoothedWave * waveAmplitude;
    const currentRadius = baseRadius + radiusModulation;

    const x = centerX + currentRadius * Math.cos(angle);
    const y = centerY + currentRadius * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
};

/**
 * Draws circular progress on canvas
 */
export const drawCircularProgress = (
  context: CanvasContext,
  config: ProgressConfig,
  value: number,
  max: number,
  isIndeterminate: boolean,
  animationTime: number = 0,
  currentShape: ProgressShape = "flat"
): void => {
  const { ctx, width, height } = context;
  const strokeWidth = getStrokeWidth(config.thickness);
  const isWavy = currentShape === "wavy";

  // Calculate size and radius
  const componentSize = Math.min(width, height);

  const amplitudePercent = isIndeterminate
    ? PROGRESS_WAVE.CIRCULAR.INDETERMINATE_AMPLITUDE
    : PROGRESS_WAVE.CIRCULAR.AMPLITUDE;

  // Calculate wave amplitude proportional to the radius
  // This ensures consistent visual appearance across all sizes
  const baseRadius = componentSize / 2 - strokeWidth / 2;

  // Apply the percentage to get base amplitude (divide by 100 to convert to decimal)
  const baseAmplitude = baseRadius * (amplitudePercent / 100);

  // Apply subtle stroke width scaling
  const waveAmplitude = isWavy
    ? getWaveAmplitude(strokeWidth, baseAmplitude)
    : 0;

  const radius = baseRadius - waveAmplitude;
  const centerX = width / 2;
  const centerY = height / 2;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Calculate gap angle
  const topGapPx = PROGRESS_MEASUREMENTS.CIRCULAR.GAP + 2 * strokeWidth;
  const topGapAngle = topGapPx / radius; // Gap at 12 o'clock
  const startAngle = -Math.PI / 2; // 12 o'clock
  const maxAngle = 2 * Math.PI - topGapAngle;

  // Set line properties
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Wave frequency - use constant frequency for all sizes
  const waveFrequency = isIndeterminate
    ? PROGRESS_WAVE.CIRCULAR.INDETERMINATE_FREQUENCY
    : PROGRESS_WAVE.CIRCULAR.FREQUENCY;

  if (isIndeterminate) {
    // Material Design 3 indeterminate animation specs
    const arcDuration = 1333; // milliseconds
    const arcTime = (animationTime % arcDuration) / arcDuration;

    // Helper functions for indeterminate animation
    const getArcLength = (time: number): number => {
      const expandFraction = time <= 0.5 ? time * 2 : 2 - time * 2;
      const eased =
        expandFraction < 0.5
          ? 2 * expandFraction * expandFraction
          : 1 - Math.pow(-2 * expandFraction + 2, 2) / 2;
      return 0.028 + (0.75 - 0.028) * eased;
    };

    const getRotation = (): number => {
      // Continuous rotation with accumulated travel from contraction
      const baseRotation = (animationTime / 1568) * 2 * Math.PI;
      const cyclesCompleted = Math.floor(animationTime / arcDuration);
      const cycleProgress = (animationTime % arcDuration) / arcDuration;

      let currentCycleTravel = 0;
      if (cycleProgress > 0.5) {
        const contractionProgress = (cycleProgress - 0.5) * 2;
        const eased =
          contractionProgress < 0.5
            ? 2 * contractionProgress * contractionProgress
            : 1 - Math.pow(-2 * contractionProgress + 2, 2) / 2;
        currentCycleTravel = 0.722 * eased;
      }

      return (
        baseRotation +
        (cyclesCompleted * 0.722 + currentCycleTravel) * 2 * Math.PI
      );
    };

    // Calculate current arc parameters
    const arcLength = getArcLength(arcTime) * 2 * Math.PI;
    const rotation = getRotation();

    // Calculate arc positions for track drawing
    const arcStart = startAngle + rotation;
    const arcEnd = arcStart + arcLength;

    // Draw the track in the remaining portion (gap between arc end and start)
    // Track is never wavy
    ctx.strokeStyle = getThemeColor("sys-color-primary-rgb", {
      alpha: 0.12,
      fallback: "rgba(103, 80, 164, 0.12)",
    });

    // Draw the track from where the arc ends to where it starts
    // This creates the visual gap effect
    ctx.beginPath();
    // Add a small gap for visual separation (similar to determinate progress)
    const trackGapAngle = topGapAngle / 2;
    ctx.arc(
      centerX,
      centerY,
      radius,
      arcEnd + trackGapAngle,
      arcStart - trackGapAngle + 2 * Math.PI
    );
    ctx.stroke();

    // Draw the indeterminate arc
    ctx.strokeStyle = getThemeColor("sys-color-primary", {
      fallback: "#6750A4",
    });

    if (isWavy) {
      drawWavyArc(
        ctx,
        centerX,
        centerY,
        radius,
        arcStart,
        arcEnd,
        waveAmplitude,
        waveFrequency,
        animationTime
      );
    } else {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, arcStart, arcEnd);
      ctx.stroke();
    }

    return;
  }

  // Rest of the determinate drawing code
  const percentage = value / max;
  const minArcPercentage = 0.001; // 0.1% minimum arc to show progress is ready
  const actualPercentage = Math.max(percentage, minArcPercentage);

  // Calculate effective max angle for gap transition
  const gapTransitionStart = 0.95; // Start closing gap at 95%
  let effectiveMaxAngle = maxAngle;

  if (percentage >= gapTransitionStart) {
    // Smoothly transition from gap to no gap between 95% and 100%
    const transitionProgress =
      (percentage - gapTransitionStart) / (1 - gapTransitionStart);
    const easedProgress = transitionProgress * transitionProgress; // Quadratic easing
    effectiveMaxAngle = maxAngle + topGapAngle * easedProgress;
  }

  // Draw track first (always present except at 99%) - track is never wavy
  if (percentage < 0.99) {
    // Track always starts after progress with a consistent gap
    const progressEnd = startAngle + effectiveMaxAngle * actualPercentage;
    const trackStart = progressEnd + topGapAngle / 2;

    // Track end always stays at the same position (maintaining top gap)
    const trackEnd = startAngle + maxAngle + topGapAngle / 2;

    // Only draw if track is visible (not too small)
    if (trackStart < trackEnd) {
      ctx.strokeStyle = getThemeColor("sys-color-primary-rgb", {
        alpha: 0.12,
        fallback: "rgba(103, 80, 164, 0.12)",
      });
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, trackStart, trackEnd);
      ctx.stroke();
    }
  }

  // Draw progress indicator
  ctx.strokeStyle = getThemeColor("sys-color-primary", { fallback: "#6750A4" });

  // Calculate wave amplitude with transitions at start and end
  let adjustedWaveAmplitude = waveAmplitude;
  if (isWavy) {
    const startTransitionEnd = PROGRESS_WAVE.CIRCULAR.START_TRANSITION_END;
    const endTransitionStart = PROGRESS_WAVE.CIRCULAR.END_TRANSITION_START;

    // No amplitude at zero if there's a start transition
    if (percentage === 0 && startTransitionEnd > 0) {
      adjustedWaveAmplitude = 0;
    } else if (percentage > 0 && percentage <= startTransitionEnd) {
      // Apply amplitude transition at start (use percentage, not actualPercentage)
      const transitionProgress = percentage / startTransitionEnd;
      adjustedWaveAmplitude = waveAmplitude * Math.pow(transitionProgress, 2);
    } else if (percentage >= endTransitionStart) {
      // Apply amplitude transition at end
      const transitionProgress =
        (percentage - endTransitionStart) / (1 - endTransitionStart);
      const easedProgress = 1 - Math.pow(1 - transitionProgress, 2);
      adjustedWaveAmplitude = waveAmplitude * (1 - easedProgress);
    }

    // Ensure wave amplitude is zero at 100% for seamless closure
    if (percentage >= 1) {
      adjustedWaveAmplitude = 0;
    }
  }

  // Draw progress arc
  const progressStart = startAngle;
  const progressEnd = startAngle + effectiveMaxAngle * actualPercentage;

  if (isWavy) {
    drawWavyArc(
      ctx,
      centerX,
      centerY,
      radius,
      progressStart,
      progressEnd,
      adjustedWaveAmplitude,
      waveFrequency,
      animationTime
    );
  } else {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, progressStart, progressEnd);
    ctx.stroke();
  }
};
