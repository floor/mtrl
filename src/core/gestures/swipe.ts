// src/core/gestures/swipe.ts
/**
 * @module core/gestures
 * @description Swipe gesture detection
 */

import { SwipeEvent, GestureDetectionContext, SWIPE_DIRECTIONS } from './types';
import { createGestureEvent } from './utils';

/**
 * Determine swipe direction based on delta X and Y
 * 
 * @param deltaX - Distance moved in X direction
 * @param deltaY - Distance moved in Y direction
 * @returns Direction of the swipe
 */
export function getSwipeDirection(deltaX: number, deltaY: number): SWIPE_DIRECTIONS {
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? SWIPE_DIRECTIONS.RIGHT : SWIPE_DIRECTIONS.LEFT;
  }
  return deltaY > 0 ? SWIPE_DIRECTIONS.DOWN : SWIPE_DIRECTIONS.UP;
}

/**
 * Detect swipe gesture
 * 
 * @param context - Gesture detection context
 * @returns Swipe event or null if no swipe detected
 */
export function detectSwipe(context: GestureDetectionContext): SwipeEvent | null {
  const { state, options, originalEvent } = context;
  
  // Calculate deltas and distance
  const deltaX = state.currentX - state.startX;
  const deltaY = state.currentY - state.startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // Calculate time and velocity
  const endTime = Date.now();
  const deltaTime = endTime - state.startTime;
  const velocity = distance / deltaTime;
  
  // Check if it's a swipe
  if (distance >= options.swipeThreshold && deltaTime <= options.swipeTimeThreshold) {
    const direction = getSwipeDirection(deltaX, deltaY);
    
    // Create swipe event
    const swipeEvent: SwipeEvent = {
      ...createGestureEvent('swipe', originalEvent, state),
      type: 'swipe',
      direction,
      deltaX,
      deltaY,
      distance,
      velocity,
      startX: state.startX,
      startY: state.startY,
      endX: state.currentX,
      endY: state.currentY
    };
    
    return swipeEvent;
  }
  
  return null;
}