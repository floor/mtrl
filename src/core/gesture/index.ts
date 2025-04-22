// src/core/gesture/index.ts
/**
 * @module core/gesture
 * @description Gesture recognition system for touch and mouse interactions
 */

export { 
  createGestureManager,
  GESTURE_TYPES, 
  SWIPE_DIRECTIONS 
} from './manager';

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
  GestureHandler
} from './manager';