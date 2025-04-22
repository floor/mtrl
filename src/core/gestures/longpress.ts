// src/core/gestures/longpress.ts
/**
 * @module core/gestures
 * @description Long press gesture detection
 */

import { LongPressEvent, GestureDetectionContext } from './types';
import { createGestureEvent } from './utils';

/**
 * Detect long press gesture
 * 
 * This is slightly different from other gesture detectors as it sets up a timer
 * and returns a callback function that will be triggered when the timer completes.
 * 
 * @param context - Gesture detection context
 * @param callback - Function to call when long press is detected
 * @returns Cleanup function to cancel the long press detection
 */
export function detectLongPress(
  context: GestureDetectionContext,
  callback: (event: LongPressEvent) => void
): () => void {
  const { state, options, originalEvent } = context;
  
  // Set a timer for long press detection
  const timer = window.setTimeout(() => {
    // Only trigger if gesture is still active
    if (state.active) {
      // Check if movement is within threshold
      const diffX = Math.abs(state.currentX - state.startX);
      const diffY = Math.abs(state.currentY - state.startY);
      
      if (diffX < options.tapDistanceThreshold && diffY < options.tapDistanceThreshold) {
        // Create long press event
        const longPressEvent: LongPressEvent = {
          ...createGestureEvent('longpress', originalEvent, state),
          type: 'longpress',
          x: state.currentX,
          y: state.currentY
        };
        
        // Trigger callback
        callback(longPressEvent);
      }
    }
  }, options.longPressTime);
  
  // Return cleanup function
  return () => {
    clearTimeout(timer);
  };
}

/**
 * Check if movement would cancel a long press
 * 
 * @param context - Gesture detection context
 * @returns Whether the long press should be canceled
 */
export function shouldCancelLongPress(context: GestureDetectionContext): boolean {
  const { state, options } = context;
  
  const diffX = Math.abs(state.currentX - state.startX);
  const diffY = Math.abs(state.currentY - state.startY);
  
  return diffX > options.tapDistanceThreshold || diffY > options.tapDistanceThreshold;
}