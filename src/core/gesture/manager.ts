// src/core/gesture/manager.ts
/**
 * @module core/gesture
 * @description Gesture management system for handling touch and mouse interactions
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
interface GestureState {
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

/**
 * Creates a gesture manager for handling touch and mouse interactions
 * 
 * @param element - DOM element to attach gesture recognition to
 * @param config - Configuration options
 * @returns Gesture manager instance
 */
export const createGestureManager = (
  element: HTMLElement,
  config: GestureConfig = {}
): GestureManager => {
  // Default configuration
  const options: Required<GestureConfig> = {
    swipeThreshold: 30,
    swipeTimeThreshold: 300,
    longPressTime: 500,
    tapDistanceThreshold: 10,
    preventDefault: true,
    stopPropagation: false,
    ...config
  };
  
  // Event handlers storage
  const handlers: Map<string, Set<GestureHandler>> = new Map();
  
  // Gesture state
  const state: GestureState = {
    active: false,
    startTime: 0,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    currentX: 0,
    currentY: 0,
    touchCount: 0,
    longPressTimer: null,
    startDistance: 0,
    startAngle: 0,
    lastTapTime: 0,
    tapCount: 0,
    target: null
  };
  
  // Detect feature support
  const hasTouch = 'ontouchstart' in window || 
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    
  const hasPointer = !!window.PointerEvent;
  
  const gestureSupport = {
    tap: true,
    swipe: true,
    swipeleft: true,
    swiperight: true,
    swipeup: true,
    swipedown: true,
    longpress: true,
    pan: true,
    pinch: hasTouch || hasPointer,
    rotate: hasTouch || hasPointer
  };
  
  /**
   * Calculate distance between two points
   */
  const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };
  
  /**
   * Calculate angle between two points in degrees (0-360)
   */
  const getAngle = (x1: number, y1: number, x2: number, y2: number): number => {
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return (angle < 0) ? angle + 360 : angle;
  };
  
  /**
   * Determine swipe direction based on delta X and Y
   */
  const getSwipeDirection = (deltaX: number, deltaY: number): SWIPE_DIRECTIONS => {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? SWIPE_DIRECTIONS.RIGHT : SWIPE_DIRECTIONS.LEFT;
    }
    return deltaY > 0 ? SWIPE_DIRECTIONS.DOWN : SWIPE_DIRECTIONS.UP;
  };
  
  /**
   * Create a base gesture event
   */
  const createGestureEvent = (
    type: string, 
    originalEvent: Event
  ): GestureEvent => {
    const endTime = Date.now();
    let defaultPrevented = false;
    
    const event: GestureEvent = {
      type,
      originalEvent,
      target: state.target || originalEvent.target,
      startTime: state.startTime,
      endTime,
      duration: endTime - state.startTime,
      defaultPrevented,
      preventDefault: () => {
        defaultPrevented = true;
        event.defaultPrevented = true;
        if (originalEvent.cancelable) {
          originalEvent.preventDefault();
        }
      },
      stopPropagation: () => {
        originalEvent.stopPropagation();
      }
    };
    
    return event;
  };
  
  /**
   * Dispatch a gesture event
   */
  const dispatchGesture = (event: AnyGestureEvent): void => {
    // Get handlers for this event type
    const eventHandlers = handlers.get(event.type);
    if (!eventHandlers) return;
    
    // Call each handler
    eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in gesture handler for ${event.type}:`, error);
      }
    });
    
    // For swipe, also dispatch direction-specific events
    if (event.type === 'swipe' && 'direction' in event) {
      const directionEvent = { ...event, type: `swipe${event.direction}` as any };
      dispatchGesture(directionEvent as SwipeEvent);
    }
    
    // Apply default configuration for preventDefault and stopPropagation
    if (options.preventDefault && !event.defaultPrevented) {
      event.preventDefault();
    }
    
    if (options.stopPropagation) {
      event.stopPropagation();
    }
  };
  
  /**
   * Handle touch/mouse start
   */
  const handleStart = (e: TouchEvent | MouseEvent): void => {
    const touch = 'touches' in e ? e.touches[0] : e;
    const touchCount = 'touches' in e ? e.touches.length : 1;
    
    // Store gesture state
    state.active = true;
    state.startTime = Date.now();
    state.startX = state.lastX = state.currentX = touch.clientX;
    state.startY = state.lastY = state.currentY = touch.clientY;
    state.touchCount = touchCount;
    state.target = e.target;
    
    // Handle multi-touch gestures
    if (touchCount === 2 && 'touches' in e) {
      const touch2 = e.touches[1];
      
      // Calculate initial distance and angle for pinch/rotate
      state.startDistance = getDistance(
        e.touches[0].clientX, 
        e.touches[0].clientY, 
        touch2.clientX, 
        touch2.clientY
      );
      
      state.startAngle = getAngle(
        e.touches[0].clientX, 
        e.touches[0].clientY, 
        touch2.clientX, 
        touch2.clientY
      );
    }
    
    // Start long press timer
    state.longPressTimer = window.setTimeout(() => {
      // Only trigger if active and hasn't moved much
      if (state.active) {
        const diffX = Math.abs(state.currentX - state.startX);
        const diffY = Math.abs(state.currentY - state.startY);
        
        if (diffX < options.tapDistanceThreshold && diffY < options.tapDistanceThreshold) {
          const longPressEvent: LongPressEvent = {
            ...createGestureEvent('longpress', e),
            type: 'longpress',
            x: state.currentX,
            y: state.currentY
          };
          
          dispatchGesture(longPressEvent);
        }
      }
      
      state.longPressTimer = null;
    }, options.longPressTime);
  };
  
  /**
   * Handle touch/mouse move
   */
  const handleMove = (e: TouchEvent | MouseEvent): void => {
    if (!state.active) return;
    
    const touch = 'touches' in e ? e.touches[0] : e;
    const touchCount = 'touches' in e ? e.touches.length : 1;
    
    // Update current position
    state.lastX = state.currentX;
    state.lastY = state.currentY;
    state.currentX = touch.clientX;
    state.currentY = touch.clientY;
    
    // Detect significant movement that cancels tap/longpress
    const diffX = Math.abs(state.currentX - state.startX);
    const diffY = Math.abs(state.currentY - state.startY);
    
    if (diffX > options.tapDistanceThreshold || diffY > options.tapDistanceThreshold) {
      // Cancel long press timer if movement is significant
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }
      
      // Create and dispatch pan event
      const panEvent: PanEvent = {
        ...createGestureEvent('pan', e),
        type: 'pan',
        deltaX: state.currentX - state.startX,
        deltaY: state.currentY - state.startY,
        startX: state.startX,
        startY: state.startY,
        currentX: state.currentX,
        currentY: state.currentY
      };
      
      dispatchGesture(panEvent);
    }
    
    // Handle multi-touch gestures
    if (touchCount === 2 && 'touches' in e) {
      const touch2 = e.touches[1];
      
      // Calculate current distance and angle for pinch/rotate
      const currentDistance = getDistance(
        touch.clientX, 
        touch.clientY, 
        touch2.clientX, 
        touch2.clientY
      );
      
      const currentAngle = getAngle(
        touch.clientX, 
        touch.clientY, 
        touch2.clientX, 
        touch2.clientY
      );
      
      // Pinch event
      if (Math.abs(currentDistance - state.startDistance) > 10) {
        const scale = currentDistance / state.startDistance;
        const centerX = (touch.clientX + touch2.clientX) / 2;
        const centerY = (touch.clientY + touch2.clientY) / 2;
        
        const pinchEvent: PinchEvent = {
          ...createGestureEvent('pinch', e),
          type: 'pinch',
          scale,
          centerX,
          centerY
        };
        
        dispatchGesture(pinchEvent);
      }
      
      // Rotate event
      const rotationDiff = currentAngle - state.startAngle;
      if (Math.abs(rotationDiff) > 10) {
        const centerX = (touch.clientX + touch2.clientX) / 2;
        const centerY = (touch.clientY + touch2.clientY) / 2;
        
        const rotateEvent: RotateEvent = {
          ...createGestureEvent('rotate', e),
          type: 'rotate',
          rotation: rotationDiff,
          centerX,
          centerY
        };
        
        dispatchGesture(rotateEvent);
      }
    }
  };
  
  /**
   * Handle touch/mouse end
   */
  const handleEnd = (e: TouchEvent | MouseEvent): void => {
    if (!state.active) return;
    
    // Clear longpress timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
    
    // Calculate gesture properties
    const endTime = Date.now();
    const deltaTime = endTime - state.startTime;
    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;
    const distance = getDistance(state.startX, state.startY, state.currentX, state.currentY);
    const velocity = distance / deltaTime;
    
    // Detect tap
    if (distance < options.tapDistanceThreshold) {
      // Check for double tap
      const now = Date.now();
      const isDoubleTap = now - state.lastTapTime < 300;
      
      if (isDoubleTap) {
        state.tapCount++;
      } else {
        state.tapCount = 1;
      }
      
      state.lastTapTime = now;
      
      const tapEvent: TapEvent = {
        ...createGestureEvent('tap', e),
        type: 'tap',
        count: state.tapCount,
        x: state.currentX,
        y: state.currentY
      };
      
      dispatchGesture(tapEvent);
    }
    // Detect swipe
    else if (distance >= options.swipeThreshold && deltaTime <= options.swipeTimeThreshold) {
      const direction = getSwipeDirection(deltaX, deltaY);
      
      const swipeEvent: SwipeEvent = {
        ...createGestureEvent('swipe', e),
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
      
      dispatchGesture(swipeEvent);
    }
    
    // Reset state
    state.active = false;
  };
  
  /**
   * Handle touch/mouse cancel
   */
  const handleCancel = (): void => {
    // Clear longpress timer
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
    
    // Reset state
    state.active = false;
  };
  
  // Event listener references
  let eventListeners: { 
    [event: string]: EventListener 
  } = {};
  
  /**
   * Set up event listeners based on available APIs
   */
  const setupEventListeners = (): void => {
    if (hasPointer) {
      // Use Pointer Events API
      eventListeners = {
        pointerdown: handleStart as EventListener,
        pointermove: handleMove as EventListener,
        pointerup: handleEnd as EventListener,
        pointercancel: handleCancel as EventListener
      };
    } else if (hasTouch) {
      // Use Touch Events API
      eventListeners = {
        touchstart: handleStart as EventListener,
        touchmove: handleMove as EventListener,
        touchend: handleEnd as EventListener,
        touchcancel: handleCancel as EventListener
      };
    } else {
      // Fall back to Mouse Events API
      eventListeners = {
        mousedown: handleStart as EventListener,
        mousemove: handleMove as EventListener,
        mouseup: handleEnd as EventListener,
        mouseleave: handleCancel as EventListener
      };
    }
    
    // Add listeners to element
    Object.entries(eventListeners).forEach(([event, listener]) => {
      element.addEventListener(event, listener, { passive: !options.preventDefault });
    });
  };
  
  /**
   * Remove all event listeners
   */
  const removeEventListeners = (): void => {
    // Remove all listeners from element
    Object.entries(eventListeners).forEach(([event, listener]) => {
      element.removeEventListener(event, listener);
    });
    
    // Clear eventListeners object
    eventListeners = {};
  };
  
  // Initialize event listeners
  setupEventListeners();
  
  return {
    /**
     * Add a gesture event listener
     * @param eventType - Type of gesture to listen for
     * @param handler - Event handler function
     * @returns Gesture manager for chaining
     */
    on(eventType: string, handler: GestureHandler): GestureManager {
      if (!handlers.has(eventType)) {
        handlers.set(eventType, new Set());
      }
      
      handlers.get(eventType)!.add(handler);
      return this;
    },
    
    /**
     * Remove a gesture event listener
     * @param eventType - Type of gesture
     * @param handler - Event handler to remove
     * @returns Gesture manager for chaining
     */
    off(eventType: string, handler: GestureHandler): GestureManager {
      const eventHandlers = handlers.get(eventType);
      if (eventHandlers) {
        eventHandlers.delete(handler);
        
        if (eventHandlers.size === 0) {
          handlers.delete(eventType);
        }
      }
      return this;
    },
    
    /**
     * Check if a gesture is supported on the current device
     * @param gestureType - Type of gesture to check
     * @returns Whether the gesture is supported
     */
    isSupported(gestureType: string): boolean {
      return gestureType in gestureSupport && gestureSupport[gestureType as keyof typeof gestureSupport];
    },
    
    /**
     * Enable gesture recognition by adding event listeners
     * @returns Gesture manager for chaining
     */
    enable(): GestureManager {
      setupEventListeners();
      return this;
    },
    
    /**
     * Disable gesture recognition by removing event listeners
     * @returns Gesture manager for chaining
     */
    disable(): GestureManager {
      removeEventListeners();
      return this;
    },
    
    /**
     * Clean up event listeners and timers
     */
    destroy(): void {
      // Clean up listeners
      removeEventListeners();
      
      // Clear any timers
      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }
      
      // Clear handler references
      handlers.clear();
    }
  };
};

export default createGestureManager;