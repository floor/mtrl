/**
 * Linear progress drawing functionality
 */

import { ProgressConfig, ProgressShape } from '../types';
import { PROGRESS_WAVE } from '../constants';
import { getThemeColor } from '../../../core/utils';
import { getStrokeWidth, CanvasContext } from './canvas';

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
  currentShape: ProgressShape = 'line'
): void => {
  const { ctx, width, height } = context;
  const strokeWidth = getStrokeWidth(config.thickness);
  const centerY = height / 2;
  const isWavy = currentShape === 'wavy';

  // The gap at the start and end
  const edgeGap = strokeWidth / 2;
  // The available width for the indicator and track
  const availableWidth = width - (edgeGap * 2);
  const gapWidth = 4;
  const percentage = value / max;
  const bufferPercentage = buffer / max;
  const progressEnd = edgeGap + (availableWidth * percentage);

  // Transition points for shape changes
  const startTransitionEnd = 0.03; // Start flat and transition to wavy between 0-3%
  const endTransitionStart = 0.97; // End wavy and transition to flat between 97-100%

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (isIndeterminate) {
    // Material Design 3 indeterminate animation specs
    const cycleDuration = 2000; // 2s cycle (matching MD3)
    const normalizedTime = (animationTime % cycleDuration) / cycleDuration;
    
    // Draw the track first (always straight)
    ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', { 
      alpha: 0.12,
      fallback: 'rgba(103, 80, 164, 0.12)'
    });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(edgeGap, centerY);
    ctx.lineTo(width - edgeGap, centerY);
    ctx.stroke();

    // Helper functions for indeterminate animation
    const getPrimaryScale = (time: number): number => {
      if (time <= 0.3665) {
        const t = time / 0.3665;
        return 0.08 + (0.661479 - 0.08) * t;
      } else if (time <= 0.6915) {
        return 0.661479;
      }
      return 0.08;
    };

    const getPrimaryTranslate = (time: number): number => {
      if (time <= 0.2) {
        const t = time / 0.2;
        return -120 + (120 * t);
      } else if (time <= 0.5915) {
        const t = (time - 0.2) / (0.5915 - 0.2);
        return 83.6714 * t;
      }
      return 83.6714 + (200.611 - 83.6714) * ((time - 0.5915) / (1 - 0.5915));
    };

    // Draw primary bar
    const primaryScale = getPrimaryScale(normalizedTime);
    const primaryTranslate = getPrimaryTranslate(normalizedTime);
    const primaryWidth = availableWidth * primaryScale;
    const primaryStart = edgeGap + (availableWidth * primaryTranslate / 100);
    
    const visibleStart = Math.max(edgeGap, primaryStart);
    const visibleEnd = Math.min(width - edgeGap, primaryStart + primaryWidth);
    if (visibleEnd > visibleStart) {
      ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();

      // Use wavy mechanism with appropriate amplitude
      const waveSpeed = 0;
      const waveAmplitude = isWavy ? PROGRESS_WAVE.LINEAR.INDETERMINATE_AMPLITUDE : 0; // Zero amplitude for line shape
      const waveFrequency = PROGRESS_WAVE.LINEAR.INDETERMINATE_FREQUENCY;
      
      for (let x = visibleStart; x <= visibleEnd; x += 2) {
        const waveOffset = (x * waveFrequency) + (animationTime * waveSpeed);
        const ripple = Math.sin(waveOffset) * waveAmplitude;
        const y = centerY + ripple;
        if (x === visibleStart) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    return;
  }

  // --- Track (remaining line) ---
  // Track is always straight
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', { 
    alpha: 0.12,
    fallback: 'rgba(103, 80, 164, 0.12)'
  });
  let trackStart;
  if (percentage === 0) {
    // At 0%, maintain full gap after the dot
    trackStart = edgeGap + strokeWidth + gapWidth;
  } else if (percentage <= startTransitionEnd) {
    // During the beginning transition, maintain the gap
    trackStart = Math.max(
      edgeGap + strokeWidth + gapWidth, // Minimum gap
      progressEnd + (gapWidth + strokeWidth) / 2 // Dynamic position
    );
  } else {
    trackStart = Math.min(progressEnd + (gapWidth + strokeWidth) / 2, width - edgeGap);
  }
  ctx.beginPath();
  ctx.moveTo(trackStart, centerY);
  ctx.lineTo(width - edgeGap, centerY);
  ctx.stroke();

  // --- Indicator ---
  if (percentage >= 0.995) {
    // Draw complete line when very close to 100%
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(edgeGap, centerY);
    ctx.lineTo(width - edgeGap, centerY);
    ctx.stroke();
  } else {
    // For all other cases (including the beginning transition)
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    
    // Calculate indicator end with proper gap
    let indicatorEnd;
    if (percentage <= startTransitionEnd) {
      // During transition, ensure proper gap between indicator and track
      indicatorEnd = Math.min(
        progressEnd - (gapWidth + strokeWidth) / 2, // Dynamic position
        trackStart - (gapWidth + strokeWidth) // Maintain gap from track
      );
    } else {
      indicatorEnd = Math.max(edgeGap, progressEnd - (gapWidth + strokeWidth) / 2);
    }
    
    ctx.beginPath();

    if (isWavy) {
      const waveSpeed = PROGRESS_WAVE.LINEAR.SPEED;
      const baseAmplitude = PROGRESS_WAVE.LINEAR.AMPLITUDE;
      const waveFrequency = PROGRESS_WAVE.LINEAR.FREQUENCY;
      
      // Calculate amplitude based on progress
      let waveAmplitude = baseAmplitude;
      
      // For very small percentages, start with a flat line
      if (percentage <= startTransitionEnd) {
        // Smoothly increase amplitude from 0% to 3%
        const transitionProgress = percentage / startTransitionEnd;
        // Use easeInQuad for smooth transition
        const easedProgress = transitionProgress * transitionProgress;
        waveAmplitude = baseAmplitude * easedProgress;
        
        // For very small percentages, ensure we start with a visible line
        const minLength = strokeWidth * 2;
        const actualLength = indicatorEnd - edgeGap;
        if (actualLength < minLength) {
          // Draw a small flat line first, maintaining gap
          const lineEnd = Math.min(edgeGap + minLength, trackStart - (gapWidth + strokeWidth));
          ctx.moveTo(edgeGap, centerY);
          ctx.lineTo(lineEnd, centerY);
          ctx.stroke();
          ctx.beginPath();
        }
      } else if (percentage >= endTransitionStart) {
        // Smoothly reduce amplitude from 97% to 100%
        const transitionProgress = (percentage - endTransitionStart) / (1 - endTransitionStart);
        // Use easeOutQuad for smooth transition
        const easedProgress = 1 - (1 - transitionProgress) * (1 - transitionProgress);
        waveAmplitude = baseAmplitude * (1 - easedProgress);
      }
      
      // Draw the wavy line
      for (let x = edgeGap; x <= indicatorEnd; x += 2) {
        const waveOffset = (x * waveFrequency) + (animationTime * waveSpeed);
        const ripple = Math.sin(waveOffset) * waveAmplitude;
        const y = centerY + ripple;
        if (x === edgeGap) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    } else {
      ctx.moveTo(edgeGap, centerY);
      ctx.lineTo(indicatorEnd, centerY);
    }
    ctx.stroke();
  }

  // --- Buffer ---
  if (buffer > 0 && bufferPercentage > percentage) {
    ctx.strokeStyle = getThemeColor('sys-color-secondary-container', { fallback: '#E8DEF8' });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    const bufferEnd = edgeGap + (availableWidth * bufferPercentage);
    ctx.beginPath();
    ctx.moveTo(progressEnd, centerY);
    ctx.lineTo(bufferEnd, centerY);
    ctx.stroke();
  }

  // --- Stop Indicator (dot) ---
  if (percentage < 0.995 && showStopIndicator) {
    const dotX = width - edgeGap;
    ctx.beginPath();
    ctx.arc(dotX, centerY, 2, 0, 2 * Math.PI);
    ctx.fillStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.fill();
  }
}; 