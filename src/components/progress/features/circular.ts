/**
 * Circular progress drawing functionality
 */

import { ProgressConfig, ProgressShape } from '../types';
import { PROGRESS_MEASUREMENTS, PROGRESS_WAVE } from '../constants';
import { getThemeColor } from '../../../core/utils';
import { getStrokeWidth, CanvasContext } from './canvas';

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
  const waveSpeed = PROGRESS_WAVE.CIRCULAR.SPEED;
  
  ctx.beginPath();
  
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (angleStep * i);
    
    // Generate base sine wave
    const phase = (angle * waveFrequency) + (animationTime * waveSpeed);
    const sineWave = Math.sin(phase);
    
    // Apply smoothing to create rounder peaks (same as linear)
    const smoothedWave = Math.sign(sineWave) * Math.pow(Math.abs(sineWave), PROGRESS_WAVE.CIRCULAR.POWER);
    
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
  currentShape: ProgressShape = 'line'
): void => {
  const { ctx, width, height } = context;
  const strokeWidth = getStrokeWidth(config.thickness);
  const isWavy = currentShape === 'wavy';
  
  // Calculate size factor and wave amplitude
  const componentSize = Math.min(width, height);
  const sizeFactor = Math.min(Math.max((componentSize - 40) / 200, 0), 1);
  
  const amplitudeRatio = isIndeterminate 
    ? PROGRESS_WAVE.CIRCULAR.INDETERMINATE_AMPLITUDE_RATIO 
    : PROGRESS_WAVE.CIRCULAR.AMPLITUDE_RATIO;
  const amplitudeMax = isIndeterminate 
    ? PROGRESS_WAVE.CIRCULAR.INDETERMINATE_AMPLITUDE_MAX 
    : PROGRESS_WAVE.CIRCULAR.AMPLITUDE_MAX;
  
  const baseAmplitude = Math.sqrt(strokeWidth) * amplitudeRatio * 2;
  const scaledAmplitude = baseAmplitude * (0.3 + 0.7 * sizeFactor);
  const waveAmplitude = isWavy ? Math.min(scaledAmplitude, amplitudeMax) : 0;
  
  const radius = (componentSize / 2) - (strokeWidth / 2) - waveAmplitude;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Calculate gap angle
  const gapPx = PROGRESS_MEASUREMENTS.CIRCULAR.GAP + 2 * strokeWidth;
  const gapAngle = gapPx / radius;
  const startAngle = -Math.PI / 2; // 12 o'clock
  const maxAngle = 2 * Math.PI - gapAngle;

  // Set line properties
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Wave frequency
  const waveFrequency = isIndeterminate 
    ? PROGRESS_WAVE.CIRCULAR.INDETERMINATE_FREQUENCY 
    : PROGRESS_WAVE.CIRCULAR.FREQUENCY;

  if (isIndeterminate) {
    // Material Design 3 indeterminate animation specs
    const arcDuration = 1333; // milliseconds
    const cycleDuration = 4 * arcDuration; // 5332ms
    const arcTime = (animationTime % arcDuration) / arcDuration;
    
    // Helper functions for indeterminate animation
    const getArcLength = (time: number): number => {
      const expandFraction = time <= 0.5 ? time * 2 : 2 - (time * 2);
      const eased = expandFraction < 0.5
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
        const eased = contractionProgress < 0.5
          ? 2 * contractionProgress * contractionProgress
          : 1 - Math.pow(-2 * contractionProgress + 2, 2) / 2;
        currentCycleTravel = 0.722 * eased;
      }
      
      return baseRotation + ((cyclesCompleted * 0.722 + currentCycleTravel) * 2 * Math.PI);
    };

    // Calculate current arc parameters
    const arcLength = getArcLength(arcTime) * 2 * Math.PI;
    const rotation = getRotation();
    
    // Calculate arc positions for track drawing
    const arcStart = startAngle + rotation;
    const arcEnd = arcStart + arcLength;
    
    // Draw the track in the remaining portion (gap between arc end and start)
    // Track is never wavy
    ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', {
      alpha: 0.12,
      fallback: 'rgba(103, 80, 164, 0.12)'
    });
    
    // Draw the track from where the arc ends to where it starts
    // This creates the visual gap effect
    ctx.beginPath();
    // Add a small gap for visual separation (similar to determinate progress)
    const trackGapAngle = gapAngle / 2;
    ctx.arc(centerX, centerY, radius, arcEnd + trackGapAngle, arcStart - trackGapAngle + 2 * Math.PI);
    ctx.stroke();
    
    // Draw the indeterminate arc
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    
    if (isWavy) {
      drawWavyArc(ctx, centerX, centerY, radius, arcStart, arcEnd, waveAmplitude, waveFrequency, animationTime);
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
  
  // Draw track first (always present except at 100%) - track is never wavy
  if (percentage < 1) {
    ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', {
      alpha: 0.12,
      fallback: 'rgba(103, 80, 164, 0.12)'
    });
    ctx.beginPath();
    const trackStart = startAngle + (maxAngle * actualPercentage) + gapAngle / 2;
    const trackEnd = startAngle + maxAngle + gapAngle / 2;
    ctx.arc(centerX, centerY, radius, trackStart, trackEnd);
    ctx.stroke();
  }

  // Draw progress indicator
  ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
  
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
      const transitionProgress = (percentage - endTransitionStart) / (1 - endTransitionStart);
      const easedProgress = 1 - Math.pow(1 - transitionProgress, 2);
      adjustedWaveAmplitude = waveAmplitude * (1 - easedProgress);
    }
  }
  
  // Draw progress arc
  const isNearComplete = percentage >= 0.995;
  const progressStart = isNearComplete ? 0 : startAngle;
  const progressEnd = isNearComplete ? 2 * Math.PI : startAngle + (maxAngle * actualPercentage);
  
  if (isWavy) {
    drawWavyArc(ctx, centerX, centerY, radius, progressStart, progressEnd, adjustedWaveAmplitude, waveFrequency, animationTime);
  } else {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, progressStart, progressEnd);
    ctx.stroke();
  }
}; 