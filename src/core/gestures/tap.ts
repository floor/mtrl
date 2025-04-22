// src/core/gestures/tap.ts
/**
 * @module core/gestures
 * @description Tap gesture detection
 */

import { TapEvent, GestureDetectionContext } from './types';
import { createGestureEvent } from './utils';

/**
 * Detect tap gesture
 * 
 * @param context - Gesture detection context
 * @returns Tap event or null if no tap detected
 */
export function detectTap(context: GestureDetectionContext): TapEvent | null {
  const { state, options, originalEvent } = context;
  
  // Calculate distance between start and current position
  const deltaX = state.currentX - state.startX;
  const deltaY = state.currentY - state.startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // Check if movement is within threshold
  if (distance < options.tapDistanceThreshold) {
    // Check for double tap
    const now = Date.now();
    const isDoubleTap = now - state.lastTapTime < 300;
    
    const tapCount = isDoubleTap ? state.tapCount + 1 : 1;
    
    // Create tap event
    const tapEvent: TapEvent = {
      ...createGestureEvent('tap', originalEvent, state),
      type: 'tap',
      count: tapCount,
      x: state.currentX,
      y: state.currentY
    };
    
    return tapEvent;
  }
  
  return null;
}