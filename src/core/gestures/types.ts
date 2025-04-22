// src/core/gestures/types.ts
/**
 * @module core/gestures
 * @description Type definitions for the gesture system
 */

/**
 * Types of gestures supported by the system
 */
export enum GESTURE_TYPES {
  TAP = 'tap',
  SWIPE = 'swipe',
  SWIPE_LEFT = 'swipeleft',
  SWIPE_RIGHT = 'swiperight',
  SWIPE_UP = 'swipeup',
  SWIPE_DOWN = 'swipedown',
  PINCH = 'pinch',
  ROTATE = 'rotate',
  LONG_PRESS = 'longpress',
  PAN = 'pan'
}

/**
 * Direction of swipe gestures
 */
export enum SWIPE_DIRECTIONS {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

/**
 * Configuration options for gesture recognition
 */
export interface GestureConfig {
  /**
   * Minimum distance (in pixels) to recognize a swipe
   * @default 30
   */
  swipeThreshold?: number;
  
  /**
   * Maximum time (in ms) in which a swipe must be completed
   * @default 300
   */
  swipeTimeThreshold?: number;
  
  /**
   * Time (in ms) to recognize a long press
   * @default 500
   */
  longPressTime?: number;
  
  /**
   * Distance threshold (in pixels) for tap recognition
   * @default 10
   */
  tapDistanceThreshold?: number;
  
  /**
   * Whether to prevent default behaviors on touch events
   * @default true
   */
  preventDefault?: boolean;
  
  /**
   * Whether to stop event propagation
   * @default false
   */
  stopPropagation?: boolean;
  
  [key: string]: any;
}

/**
 * Base gesture event data
 */
export interface GestureEvent {
  /**
   * Type of the gesture
   */
  type: string;
  
  /**
   * Original DOM event
   */
  originalEvent: Event;
  
  /**
   * Element the gesture was triggered on
   */
  target: EventTarget;
  
  /**
   * Timestamp when the gesture started
   */
  startTime: number;
  
  /**
   * Timestamp when the gesture ended
   */
  endTime: number;
  
  /**
   * Gesture duration in milliseconds
   */
  duration: number;
  
  /**
   * Whether default behavior was prevented
   */
  defaultPrevented: boolean;
  
  /**
   * Prevent default behavior
   */
  preventDefault: () => void;
  
  /**
   * Stop event propagation
   */
  stopPropagation: () => void;
}

/**
 * Tap gesture event data
 */
export interface TapEvent extends GestureEvent {
  type: 'tap';
  
  /**
   * Number of taps (for double tap detection)
   */
  count: number;
  
  /**
   * X position of the tap
   */
  x: number;
  
  /**
   * Y position of the tap
   */
  y: number;
}

/**
 * Swipe gesture event data
 */
export interface SwipeEvent extends GestureEvent {
  type: 'swipe' | 'swipeleft' | 'swiperight' | 'swipeup' | 'swipedown';
  
  /**
   * Direction of the swipe
   */
  direction: 'up' | 'down' | 'left' | 'right';
  
  /**
   * Distance swiped in the X direction
   */
  deltaX: number;
  
  /**
   * Distance swiped in the Y direction
   */
  deltaY: number;
  
  /**
   * Total distance swiped
   */
  distance: number;
  
  /**
   * Velocity of the swipe in pixels per millisecond
   */
  velocity: number;
  
  /**
   * Start X position
   */
  startX: number;
  
  /**
   * Start Y position
   */
  startY: number;
  
  /**
   * End X position
   */
  endX: number;
  
  /**
   * End Y position
   */
  endY: number;
}

/**
 * Long press gesture event data
 */
export interface LongPressEvent extends GestureEvent {
  type: 'longpress';
  
  /**
   * X position of the long press
   */
  x: number;
  
  /**
   * Y position of the long press
   */
  y: number;
}

/**
 * Pinch gesture event data
 */
export interface PinchEvent extends GestureEvent {
  type: 'pinch';
  
  /**
   * Scale factor of the pinch (>1 for zoom in, <1 for zoom out)
   */
  scale: number;
  
  /**
   * Center X position of the pinch
   */
  centerX: number;
  
  /**
   * Center Y position of the pinch
   */
  centerY: number;
}

/**
 * Rotate gesture event data
 */
export interface RotateEvent extends GestureEvent {
  type: 'rotate';
  
  /**
   * Rotation angle in degrees
   */
  rotation: number;
  
  /**
   * Center X position of the rotation
   */
  centerX: number;
  
  /**
   * Center Y position of the rotation
   */
  centerY: number;
}

/**
 * Pan gesture event data
 */
export interface PanEvent extends GestureEvent {
  type: 'pan';
  
  /**
   * Distance panned in the X direction
   */
  deltaX: number;
  
  /**
   * Distance panned in the Y direction
   */
  deltaY: number;
  
  /**
   * Start X position
   */
  startX: number;
  
  /**
   * Start Y position
   */
  startY: number;
  
  /**
   * Current X position
   */
  currentX: number;
  
  /**
   * Current Y position
   */
  currentY: number;
}

/**
 * Union type of all gesture events
 */
export type AnyGestureEvent = 
  | TapEvent
  | SwipeEvent 
  | LongPressEvent 
  | PinchEvent 
  | RotateEvent 
  | PanEvent;

/**
 * Handler for gesture events
 */
export type GestureHandler = (event: AnyGestureEvent) => void;

/**
 * Gesture state for tracking touch interactions
 */
export interface GestureState {
  active: boolean;
  startTime: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  currentX: number;
  currentY: number;
  touchCount: number;
  longPressTimer: number | null;
  startDistance: number;
  startAngle: number;
  lastTapTime: number;
  tapCount: number;
  target: EventTarget | null;
}

/**
 * Context for gesture detection
 */
export interface GestureDetectionContext {
  state: GestureState;
  options: Required<GestureConfig>;
  originalEvent: Event;
}

/**
 * Gesture manager interface
 */
export interface GestureManager {
  /**
   * Add an event listener for a gesture
   * @param eventType - Gesture type
   * @param handler - Event handler
   * @returns Gesture manager for chaining
   */
  on: (eventType: string, handler: GestureHandler) => GestureManager;
  
  /**
   * Remove an event listener for a gesture
   * @param eventType - Gesture type
   * @param handler - Event handler
   * @returns Gesture manager for chaining
   */
  off: (eventType: string, handler: GestureHandler) => GestureManager;
  
  /**
   * Check if a gesture is supported on the current device
   * @param gestureType - Type of gesture to check
   * @returns Whether the gesture is supported
   */
  isSupported: (gestureType: string) => boolean;
  
  /**
   * Enable gesture recognition
   * @returns Gesture manager for chaining
   */
  enable: () => GestureManager;
  
  /**
   * Disable gesture recognition
   * @returns Gesture manager for chaining
   */
  disable: () => GestureManager;
  
  /**
   * Clean up event listeners
   */
  destroy: () => void;
}