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
  
  // Calculate size factor for amplitude scaling
  // Scale amplitude based on component size (40px min to 240px max)
  const componentSize = Math.min(width, height);
  const sizeFactor = Math.min(Math.max((componentSize - 40) / 200, 0), 1); // Normalize between 0-1
  
  // Calculate radius accounting for stroke width and wave amplitude
  // Use different amplitude values for indeterminate vs determinate
  const amplitudeRatio = isIndeterminate 
    ? PROGRESS_WAVE.CIRCULAR.INDETERMINATE_AMPLITUDE_RATIO 
    : PROGRESS_WAVE.CIRCULAR.AMPLITUDE_RATIO;
  const amplitudeMax = isIndeterminate 
    ? PROGRESS_WAVE.CIRCULAR.INDETERMINATE_AMPLITUDE_MAX 
    : PROGRESS_WAVE.CIRCULAR.AMPLITUDE_MAX;
  
  // Enhanced amplitude calculation using square root for more gradual scaling
  // Now also considers component size to prevent oversized waves on small progress indicators
  const baseAmplitude = Math.sqrt(strokeWidth) * amplitudeRatio * 2;
  const scaledAmplitude = baseAmplitude * (0.3 + 0.7 * sizeFactor); // Minimum 30% amplitude at smallest size
  const waveAmplitude = isWavy ? Math.min(scaledAmplitude, amplitudeMax) : 0;
  
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
    // Based on the official implementation:
    // ARCTIME = 1333ms (time for arc to expand/contract)
    // CYCLE = 4 * ARCTIME = 5332ms
    // LINEAR_ROTATE = ARCTIME * 360 / 306 ≈ 1568ms
    
    const arcDuration = 1333; // milliseconds
    const cycleDuration = 4 * arcDuration; // 5332ms
    const linearRotateDuration = arcDuration * 360 / 306; // ~1568ms
    
    // Calculate normalized times
    const arcTime = (animationTime % arcDuration) / arcDuration;
    
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
      // Arc expands from ~10deg to 270deg and back
      // Matches the expand-arc animation from Material Design
      let expandFraction;
      if (time <= 0.5) {
        // Expand phase (0 to 0.5)
        expandFraction = time * 2;
      } else {
        // Contract phase (0.5 to 1)
        expandFraction = 2 - (time * 2);
      }
      
      // Apply easing (cubic-bezier(0.4, 0, 0.2, 1))
      const eased = expandFraction < 0.5
        ? 2 * expandFraction * expandFraction
        : 1 - Math.pow(-2 * expandFraction + 2, 2) / 2;
      
      // Arc length from ~10deg (0.028) to 270deg (0.75)
      const minArc = 0.028; // ~10 degrees
      const maxArc = 0.75;  // 270 degrees
      
      return minArc + (maxArc - minArc) * eased;
    };

    const getRotation = (): number => {
      // Linear rotation - constant speed, continuous
      // Calculate total rotations including complete cycles
      const totalRotations = animationTime / linearRotateDuration;
      return totalRotations * 2 * Math.PI;
    };
    
    const getArcRotation = (): number => {
      // Arc rotates through 1080deg (3 full rotations) per cycle
      // and continues rotating, not resetting
      const completeCycles = Math.floor(animationTime / cycleDuration);
      const currentCycleProgress = (animationTime % cycleDuration) / cycleDuration;
      
      // Steps within a single cycle
      const steps = [
        { time: 0,     rotation: 0 },
        { time: 0.125, rotation: 0 },
        { time: 0.25,  rotation: Math.PI * 0.75 },   // 135deg
        { time: 0.375, rotation: Math.PI * 1.5 },    // 270deg
        { time: 0.5,   rotation: Math.PI * 2.25 },   // 405deg
        { time: 0.625, rotation: Math.PI * 3 },      // 540deg
        { time: 0.75,  rotation: Math.PI * 3.75 },   // 675deg
        { time: 0.875, rotation: Math.PI * 4.5 },    // 810deg
        { time: 1,     rotation: Math.PI * 6 }       // 1080deg (3 full rotations)
      ];
      
      // Base rotation from complete cycles
      const baseRotation = completeCycles * Math.PI * 6;
      
      // Find current step and interpolate within current cycle
      for (let i = 0; i < steps.length - 1; i++) {
        if (currentCycleProgress >= steps[i].time && currentCycleProgress <= steps[i + 1].time) {
          const duration = steps[i + 1].time - steps[i].time;
          const elapsed = currentCycleProgress - steps[i].time;
          const progress = elapsed / duration;
          
          // Use cubic easing for smooth transitions
          const eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          
          const cycleRotation = steps[i].rotation + (steps[i + 1].rotation - steps[i].rotation) * eased;
          return baseRotation + cycleRotation;
        }
      }
      
      return baseRotation + steps[steps.length - 1].rotation;
    };

    // Calculate current arc parameters
    const arcLength = getArcLength(arcTime) * 2 * Math.PI;
    const linearRotation = getRotation();
    const arcRotation = getArcRotation();
    
    // Draw the indeterminate arc
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    
    // Combine all rotations for final position
    const arcStart = startAngle + linearRotation + arcRotation;
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
  const minArcPercentage = 0.001; // 0,1% minimum arc to show progress is ready
  
  // Draw track first (always present except at 100%) - track is never wavy
  if (percentage < 1) {
    ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', {
      alpha: 0.12,
      fallback: 'rgba(103, 80, 164, 0.12)'
    });
    ctx.beginPath();
    
    // Calculate track angles based on current progress
    // Account for minimum arc when at 0%
    const actualPercentage = Math.max(percentage, minArcPercentage);
    const trackStart = startAngle + (maxAngle * actualPercentage) + gapAngle / 2;
    const trackEnd = startAngle + maxAngle + gapAngle / 2;
    
    ctx.arc(centerX, centerY, radius, trackStart, trackEnd);
    ctx.stroke();
  }

  // Draw progress indicator
  ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
  
  // Calculate the actual progress angle, ensuring a minimum visible arc
  const actualPercentage = Math.max(percentage, minArcPercentage);
  const progressEndAngle = startAngle + (maxAngle * actualPercentage);
  
  // Calculate wave amplitude with reduction near 100%
  let adjustedWaveAmplitude = waveAmplitude;
  if (isWavy && percentage >= 0.97) {
    // Smoothly reduce amplitude from 97% to 100%
    const transitionProgress = (percentage - 0.97) / 0.03;
    // Use easeOutQuad for smooth transition
    const easedProgress = 1 - (1 - transitionProgress) * (1 - transitionProgress);
    adjustedWaveAmplitude = waveAmplitude * (1 - easedProgress);
  }
  
  if (percentage >= 0.995) {
    // Draw complete circle when very close to 100%
    if (isWavy) {
      drawWavyArc(ctx, centerX, centerY, radius, 0, 2 * Math.PI, adjustedWaveAmplitude, waveFrequency, animationTime);
    } else {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  } else {
    // Draw progress arc (including minimal arc at 0%)
    if (isWavy) {
      drawWavyArc(ctx, centerX, centerY, radius, startAngle, progressEndAngle, adjustedWaveAmplitude, waveFrequency, animationTime);
    } else {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, progressEndAngle);
      ctx.stroke();
    }
  }
}; 