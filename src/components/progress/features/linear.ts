/**
 * Linear progress drawing functionality
 */

import { ProgressConfig, ProgressShape } from "../types";
import { PROGRESS_WAVE, PROGRESS_MEASUREMENTS } from "../constants";
import { getThemeColor } from "../../../core/utils";
import { getStrokeWidth, getWaveAmplitude, CanvasContext } from "./canvas";

// Helper to set common stroke styles
const setStrokeStyle = (
  ctx: CanvasRenderingContext2D,
  strokeWidth: number,
  color: string
): void => {
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = "round";
};

// Helper to draw a line segment (straight or wavy)
const drawLine = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  centerY: number,
  isWavy: boolean,
  animationTime: number,
  waveConfig: { amplitude: number; frequency: number; speed: number }
): void => {
  ctx.beginPath();

  if (!isWavy || waveConfig.amplitude === 0) {
    ctx.moveTo(startX, centerY);
    ctx.lineTo(endX, centerY);
  } else {
    let lastX = startX;
    for (let x = startX; x <= endX; x += 1) {
      const phase = x * waveConfig.frequency + animationTime * waveConfig.speed;
      const sineWave = Math.sin(phase);
      const smoothedWave =
        Math.sign(sineWave) *
        Math.pow(Math.abs(sineWave), PROGRESS_WAVE.LINEAR.POWER);
      const y = centerY + smoothedWave * waveConfig.amplitude;

      if (x === startX) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      lastX = x;
    }

    // Ensure we always draw to the end point
    if (lastX < endX) {
      const phase =
        endX * waveConfig.frequency + animationTime * waveConfig.speed;
      const sineWave = Math.sin(phase);
      const smoothedWave =
        Math.sign(sineWave) *
        Math.pow(Math.abs(sineWave), PROGRESS_WAVE.LINEAR.POWER);
      const y = centerY + smoothedWave * waveConfig.amplitude;
      ctx.lineTo(endX, y);
    }
  }

  ctx.stroke();
};

// Helper for indeterminate animation timing
const getSegmentScale = (time: number, thresholds: number[]): number => {
  const [t1, t2, t3] = thresholds;
  if (time <= t1) {
    return 0.08 + (0.661479 - 0.08) * (time / t1);
  } else if (time <= t2) {
    return 0.661479;
  } else if (t3 && time <= t3) {
    return 0.661479;
  }
  return t3 ? 0.661479 - (0.661479 - 0.08) * ((time - t3) / (1 - t3)) : 0.08;
};

const getSegmentTranslate = (
  time: number,
  keyframes: [number, number][]
): number => {
  for (let i = 0; i < keyframes.length - 1; i++) {
    const [t1, v1] = keyframes[i];
    const [t2, v2] = keyframes[i + 1];
    if (time <= t2) {
      const t = (time - t1) / (t2 - t1);
      return v1 + (v2 - v1) * t;
    }
  }
  const [lastT, lastV] = keyframes[keyframes.length - 1];
  return lastV + (220 - lastV) * ((time - lastT) / (1 - lastT));
};

/**
 * Draws linear progress on canvas with shape support
 */
export const drawLinearProgress = (
  context: CanvasContext,
  config: ProgressConfig,
  value: number,
  max: number,
  buffer: number,
  isIndeterminate: boolean,
  animationTime: number = 0,
  showStopIndicator: boolean = true,
  currentShape: ProgressShape = "flat"
): void => {
  const { ctx, width, height } = context;
  const strokeWidth = getStrokeWidth(config.thickness);
  const centerY = height / 2;
  const isWavy = currentShape === "wavy";
  const edgeGap = strokeWidth / 2;
  const availableWidth = width - edgeGap * 2;
  const gapWidth = PROGRESS_MEASUREMENTS.LINEAR.GAP;
  const percentage = value / max;

  // Apply minimum percentage to ensure visibility (same as circular progress)
  const minProgressPercentage = 0.001; // 0.1% minimum to show progress is ready
  const actualPercentage = Math.max(percentage, minProgressPercentage);

  const progressEnd = edgeGap + availableWidth * actualPercentage;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Common colors
  const primaryColor = getThemeColor("sys-color-primary", {
    fallback: "#6750A4",
  });
  const trackColor = getThemeColor("sys-color-primary-rgb", {
    alpha: 0.12,
    fallback: "rgba(103, 80, 164, 0.12)",
  });

  if (isIndeterminate) {
    const cycleDuration = 2000;
    const normalizedTime = (animationTime % cycleDuration) / cycleDuration;

    // Calculate segment positions using helpers
    const primaryScale = getSegmentScale(normalizedTime, [0.3665, 0.6915]);
    const primaryTranslate = getSegmentTranslate(normalizedTime, [
      [0, -120],
      [0.2, 0],
      [0.5915, 83.6714],
    ]);

    const secondaryScale =
      normalizedTime <= 0.5
        ? 0
        : getSegmentScale(normalizedTime, [0.8335, null, 0.8335]);
    const secondaryTranslate =
      normalizedTime <= 0.5
        ? -54.8889
        : getSegmentTranslate(normalizedTime, [
            [0.5, -54.8889],
            [0.7, 25.0389],
            [0.85, 83.6714],
          ]);

    // Calculate visible bounds
    const segments = [
      {
        scale: primaryScale,
        translate: primaryTranslate,
        start: Math.max(
          edgeGap,
          edgeGap + (availableWidth * primaryTranslate) / 100
        ),
        end: Math.min(
          width - edgeGap,
          edgeGap +
            (availableWidth * primaryTranslate) / 100 +
            availableWidth * primaryScale
        ),
      },
      {
        scale: secondaryScale,
        translate: secondaryTranslate,
        start: Math.max(
          edgeGap,
          edgeGap + (availableWidth * secondaryTranslate) / 100
        ),
        end: Math.min(
          width - edgeGap,
          edgeGap +
            (availableWidth * secondaryTranslate) / 100 +
            availableWidth * secondaryScale
        ),
      },
    ].filter((s) => s.end > s.start);

    // Draw track segments
    setStrokeStyle(ctx, strokeWidth, trackColor);
    const indeterminateGap = gapWidth * 2 + strokeWidth / 2; // Double the gap constant + stroke adjustment

    if (segments.length === 0) {
      drawLine(ctx, edgeGap, width - edgeGap, centerY, false, 0, {
        amplitude: 0,
        frequency: 0,
        speed: 0,
      });
    } else {
      // Before first
      if (segments[0].start > edgeGap + indeterminateGap) {
        drawLine(
          ctx,
          edgeGap,
          segments[0].start - indeterminateGap,
          centerY,
          false,
          0,
          { amplitude: 0, frequency: 0, speed: 0 }
        );
      }

      // Between segments
      if (
        segments.length === 2 &&
        segments[1].start - segments[0].end > 2 * indeterminateGap
      ) {
        drawLine(
          ctx,
          segments[0].end + indeterminateGap,
          segments[1].start - indeterminateGap,
          centerY,
          false,
          0,
          { amplitude: 0, frequency: 0, speed: 0 }
        );
      }

      // After last
      const lastEnd = segments[segments.length - 1].end;
      if (lastEnd < width - edgeGap - indeterminateGap) {
        drawLine(
          ctx,
          lastEnd + indeterminateGap,
          width - edgeGap,
          centerY,
          false,
          0,
          { amplitude: 0, frequency: 0, speed: 0 }
        );
      }
    }

    // Draw progress segments
    setStrokeStyle(ctx, strokeWidth, primaryColor);
    const waveConfig = {
      amplitude: isWavy
        ? getWaveAmplitude(
            strokeWidth,
            PROGRESS_WAVE.LINEAR.INDETERMINATE_AMPLITUDE
          )
        : 0,
      frequency:
        (PROGRESS_WAVE.LINEAR.INDETERMINATE_FREQUENCY * 2 * Math.PI) / 100,
      speed: 0,
    };

    segments.forEach((segment) => {
      drawLine(
        ctx,
        segment.start,
        segment.end,
        centerY,
        isWavy,
        animationTime,
        waveConfig
      );
    });

    return;
  }

  // Determinate progress
  const startTransitionEnd = PROGRESS_WAVE.LINEAR.START_TRANSITION_END;
  const endTransitionStart = PROGRESS_WAVE.LINEAR.END_TRANSITION_START;

  // Calculate the gap offset (half of total gap on each side)
  const gapOffset = (gapWidth + strokeWidth) / 2;

  // Draw track
  setStrokeStyle(ctx, strokeWidth, trackColor);
  const trackStart =
    percentage === 0
      ? edgeGap + strokeWidth + gapWidth
      : Math.min(progressEnd + gapOffset, width - edgeGap);

  drawLine(ctx, trackStart, width - edgeGap, centerY, false, 0, {
    amplitude: 0,
    frequency: 0,
    speed: 0,
  });

  // Draw progress indicator
  setStrokeStyle(ctx, strokeWidth, primaryColor);

  const indicatorEnd =
    percentage >= 1
      ? width - edgeGap // Full width at 100%
      : Math.max(edgeGap, progressEnd - gapOffset);

  // Special handling for zero percentage to ensure minimal dot
  let finalIndicatorEnd: number;
  if (percentage === 0) {
    // Fixed minimal size for zero progress
    finalIndicatorEnd = edgeGap + (isWavy ? 0.1 : 0);
  } else {
    // Ensure minimum visible length for non-zero progress
    const minNonZeroLength = strokeWidth / 2;
    finalIndicatorEnd = Math.max(edgeGap + minNonZeroLength, indicatorEnd);
  }

  // Calculate wave amplitude for transitions
  let waveAmplitude = isWavy
    ? getWaveAmplitude(strokeWidth, PROGRESS_WAVE.LINEAR.AMPLITUDE)
    : 0;
  if (isWavy) {
    // No amplitude at zero if there's a start transition
    if (percentage === 0 && startTransitionEnd > 0) {
      waveAmplitude = 0;
    } else if (actualPercentage <= startTransitionEnd) {
      // Apply amplitude transition at start
      waveAmplitude *= Math.pow(actualPercentage / startTransitionEnd, 2);
    } else if (actualPercentage >= endTransitionStart) {
      // Apply amplitude transition at end
      waveAmplitude *= Math.pow(
        (1 - actualPercentage) / (1 - endTransitionStart),
        2
      );
    }
  }

  drawLine(ctx, edgeGap, finalIndicatorEnd, centerY, isWavy, animationTime, {
    amplitude: waveAmplitude,
    frequency: (PROGRESS_WAVE.LINEAR.FREQUENCY * 2 * Math.PI) / 100,
    speed: (PROGRESS_WAVE.LINEAR.SPEED * 2 * Math.PI) / 1000,
  });

  // Draw buffer
  if (buffer > 0 && buffer > value) {
    setStrokeStyle(
      ctx,
      strokeWidth,
      getThemeColor("sys-color-secondary-container", { fallback: "#E8DEF8" })
    );
    const bufferEnd = edgeGap + availableWidth * (buffer / max);
    drawLine(ctx, progressEnd, bufferEnd, centerY, false, 0, {
      amplitude: 0,
      frequency: 0,
      speed: 0,
    });
  }

  // Draw stop indicator
  if (percentage < 1 && showStopIndicator) {
    // Scale indicator radius with stroke width, max 2px
    const indicatorRadius = Math.min(strokeWidth * 0.5, 2);
    ctx.beginPath();
    ctx.arc(width - edgeGap, centerY, indicatorRadius, 0, 2 * Math.PI);
    ctx.fillStyle = primaryColor;
    ctx.fill();
  }
};
