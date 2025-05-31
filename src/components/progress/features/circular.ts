/**
 * Circular progress drawing functionality
 */

import { ProgressConfig, ProgressShape } from '../types';
import { PROGRESS_MEASUREMENTS, PROGRESS_WAVE } from '../constants';
import { getThemeColor } from '../../../core/utils';
import { getStrokeWidth, CanvasContext } from './canvas';

/**
 * Draws a wavy arc by modulating the radius with a smooth wave pattern
 * Uses a modified sine wave to create rounded peaks similar to Material Design 3
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
  
  // Calculate radius accounting for stroke width and wave amplitude
  // Use different amplitude values for indeterminate vs determinate
  const amplitudeRatio = isIndeterminate 
    ? PROGRESS_WAVE.CIRCULAR.INDETERMINATE_AMPLITUDE_RATIO 
    : PROGRESS_WAVE.CIRCULAR.AMPLITUDE_RATIO;
  const amplitudeMax = isIndeterminate 
    ? PROGRESS_WAVE.CIRCULAR.INDETERMINATE_AMPLITUDE_MAX 
    : PROGRESS_WAVE.CIRCULAR.AMPLITUDE_MAX;
  const waveAmplitude = isWavy ? Math.min(strokeWidth * amplitudeRatio, amplitudeMax) : 0;
  const radius = (Math.min(width, height) / 2) - (strokeWidth / 2) - waveAmplitude;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Calculate gap angle for a visible gap: 4px plus 2x strokeWidth (for both round caps)
  const gapPx = PROGRESS_MEASUREMENTS.CIRCULAR.GAP + 2 * strokeWidth;
  const gapAngle = gapPx / radius;
  const startAngle = -Math.PI / 2; // 12 o'clock
  const maxAngle = 2 * Math.PI - gapAngle;

  // Set line properties
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round'; // Smooth joins for wavy paths

  // Wave frequency - number of complete waves around the circle
  // Use different frequency for indeterminate
  const waveFrequency = isIndeterminate 
    ? PROGRESS_WAVE.CIRCULAR.INDETERMINATE_FREQUENCY 
    : PROGRESS_WAVE.CIRCULAR.FREQUENCY;

  if (isIndeterminate) {
    // Material Design 3 indeterminate animation specs
    const cycleDuration = 1333; // ~1.33s cycle (matching MD3)
    const normalizedTime = (animationTime % cycleDuration) / cycleDuration;
    
    // Draw the track first (always present) - track is never wavy
    ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', {
      alpha: 0.12,
      fallback: 'rgba(103, 80, 164, 0.12)'
    });
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Helper functions for indeterminate animation
    const getArcLength = (time: number): number => {
      // Arc length varies between 0.05 and 0.75 of the circle
      if (time <= 0.5) {
        // Grow from 0.05 to 0.75 in first half
        return 0.05 + (0.7 * (time / 0.5));
      } else {
        // Shrink from 0.75 to 0.05 in second half
        return 0.75 - (0.7 * ((time - 0.5) / 0.5));
      }
    };

    const getRotation = (time: number): number => {
      // Full rotation every cycle, with easing
      const rotation = time * 2 * Math.PI;
      // Add a slight ease-in-out effect
      const eased = time < 0.5 
        ? 2 * time * time 
        : 1 - Math.pow(-2 * time + 2, 2) / 2;
      return rotation + (eased * 0.1); // Add a small boost to the rotation
    };

    // Calculate current arc length and rotation
    const arcLength = getArcLength(normalizedTime) * 2 * Math.PI;
    const rotation = getRotation(normalizedTime);
    
    // Draw the indeterminate arc
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    
    // Start angle is based on rotation
    const arcStart = startAngle + rotation;
    // End angle is start angle plus arc length
    const arcEnd = arcStart + arcLength;
    
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
  
  // Draw track first (always present except at 100%) - track is never wavy
  if (percentage < 1) {
    ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', {
      alpha: 0.12,
      fallback: 'rgba(103, 80, 164, 0.12)'
    });
    ctx.beginPath();
    
    // Calculate track angles based on current progress
    const trackStart = startAngle + (maxAngle * percentage) + gapAngle / 2;
    const trackEnd = startAngle + maxAngle + gapAngle / 2;
    
    ctx.arc(centerX, centerY, radius, trackStart, trackEnd);
    ctx.stroke();
  }

  // Draw progress indicator
  if (percentage === 0) {
    // Draw a dot at the start position (12 o'clock)
    const dotX = centerX + radius * Math.cos(startAngle);
    const dotY = centerY + radius * Math.sin(startAngle);
    ctx.beginPath();
    ctx.arc(dotX, dotY, strokeWidth / 2, 0, 2 * Math.PI);
    ctx.fillStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.fill();
  } else if (percentage >= 0.995) {
    // Draw complete circle when very close to 100%
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    if (isWavy) {
      drawWavyArc(ctx, centerX, centerY, radius, 0, 2 * Math.PI, waveAmplitude, waveFrequency, animationTime);
    } else {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  } else {
    // Normal progress indicator (with gap)
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    const progressEndAngle = startAngle + (maxAngle * percentage);
    
    if (isWavy) {
      drawWavyArc(ctx, centerX, centerY, radius, startAngle, progressEndAngle, waveAmplitude, waveFrequency, animationTime);
    } else {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, progressEndAngle);
      ctx.stroke();
    }
  }
}; 