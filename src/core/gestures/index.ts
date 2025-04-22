// src/core/gestures/index.ts
/**
 * @module core/gestures
 * @description Modular gesture recognition system for touch and mouse interactions
 */

// Export core gesture utilities and types
export { createGestureManager, GESTURE_TYPES, SWIPE_DIRECTIONS } from './manager';
export { detectTap } from './tap';
export { detectSwipe } from './swipe';
export { detectLongPress } from './longpress';
export { detectPinch } from './pinch';
export { detectRotate } from './rotate';
export { detectPan } from './pan';

// Export types
export type { 
  GestureManager,
  GestureConfig,
  GestureEvent,
  TapEvent,
  SwipeEvent,
  LongPressEvent,
  PinchEvent,
  RotateEvent,
  PanEvent,
  AnyGestureEvent,
  GestureHandler,
  GestureState,
  GestureDetectionContext
} from './types';