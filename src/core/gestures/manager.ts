// src/core/gestures/manager.ts
/**
 * @module core/gestures
 * @description Gesture management system for handling touch and mouse interactions
 */

import { 
  GestureConfig,
  GestureManager,
  GestureState,
  GestureHandler,
  GestureDetectionContext,
  AnyGestureEvent,
  GESTURE_TYPES,
  SWIPE_DIRECTIONS
} from './types';

import { detectTap } from './tap';
import { detectSwipe } from './swipe';
import { detectLongPress, shouldCancelLongPress } from './longpress';
import { detectPan } from './pan';
import { detectPinch } from './pinch';
import { detectRotate } from './rotate';
import { hasTouchSupport, hasPointerSupport, getTouchCoordinates } from './utils';

// Re-export types and constants
export { GESTURE_TYPES, SWIPE_DIRECTIONS };

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
  const supportTouch = hasTouchSupport();
  const supportPointer = hasPointerSupport();
    
  const gestureSupport = {
    tap: true,
    swipe: true,
    swipeleft: true,
    swiperight: true,
    swipeup: true,
    swipedown: true,
    longpress: true,
    pan: true,
    pinch: supportTouch || supportPointer,
    rotate: supportTouch || supportPointer
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
      dispatchGesture(directionEvent as any);
    }
    
    // Apply default configuration for preventDefault and stopPropagation
    if (options.preventDefault && !event.defaultPrevented) {
      event.preventDefault();
    }
    
    if (options.stopPropagation) {
      event.stopPropagation();
    }
  };
  
  // Reference to the longpress cleanup function
  let longPressCleanup: (() => void) | null = null;
  
  /**
   * Handle touch/mouse start
   */
  const handleStart = (e: TouchEvent | MouseEvent | PointerEvent): void => {
    const touch = getTouchCoordinates(e);
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
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Set initial values for pinch and rotate
      state.startDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      state.startAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      ) * 180 / Math.PI;
      
      if (state.startAngle < 0) state.startAngle += 360;
    }
    
    // Setup context for gesture detection
    const context: GestureDetectionContext = {
      state,
      options,
      originalEvent: e
    };
    
    // Start long press detection
    if (longPressCleanup) {
      longPressCleanup();
    }
    
    longPressCleanup = detectLongPress(context, (longPressEvent) => {
      dispatchGesture(longPressEvent);
    });
  };
  
  /**
   * Handle touch/mouse move
   */
  const handleMove = (e: TouchEvent | MouseEvent | PointerEvent): void => {
    if (!state.active) return;
    
    const touch = getTouchCoordinates(e);
    const touchCount = 'touches' in e ? e.touches.length : 1;
    
    // Update positions
    state.lastX = state.currentX;
    state.lastY = state.currentY;
    state.currentX = touch.clientX;
    state.currentY = touch.clientY;
    
    // Setup context for gesture detection
    const context: GestureDetectionContext = {
      state,
      options,
      originalEvent: e
    };
    
    // Check if we should cancel longpress
    if (shouldCancelLongPress(context) && longPressCleanup) {
      longPressCleanup();
      longPressCleanup = null;
    }
    
    // Detect pan gesture
    const panEvent = detectPan(context);
    if (panEvent) {
      dispatchGesture(panEvent);
    }
    
    // Multi-touch gestures
    if (touchCount === 2 && 'touches' in e) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Detect pinch
      const pinchEvent = detectPinch(context, touch1, touch2);
      if (pinchEvent) {
        dispatchGesture(pinchEvent);
      }
      
      // Detect rotate
      const rotateEvent = detectRotate(context, touch1, touch2);
      if (rotateEvent) {
        dispatchGesture(rotateEvent);
      }
    }
  };
  
  /**
   * Handle touch/mouse end
   */
  const handleEnd = (e: TouchEvent | MouseEvent | PointerEvent): void => {
    if (!state.active) return;
    
    // Cancel any ongoing long press detection
    if (longPressCleanup) {
      longPressCleanup();
      longPressCleanup = null;
    }
    
    // Setup context for gesture detection
    const context: GestureDetectionContext = {
      state,
      options,
      originalEvent: e
    };
    
    // Detect tap
    const tapEvent = detectTap(context);
    if (tapEvent) {
      // Update tap count for next tap
      state.lastTapTime = Date.now();
      state.tapCount = tapEvent.count;
      
      dispatchGesture(tapEvent);
    } else {
      // Detect swipe
      const swipeEvent = detectSwipe(context);
      if (swipeEvent) {
        dispatchGesture(swipeEvent);
      }
    }
    
    // Reset state
    state.active = false;
  };
  
  /**
   * Handle touch/mouse cancel
   */
  const handleCancel = (): void => {
    // Cancel long press detection
    if (longPressCleanup) {
      longPressCleanup();
      longPressCleanup = null;
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
    if (supportPointer) {
      // Use Pointer Events API
      eventListeners = {
        pointerdown: handleStart as EventListener,
        pointermove: handleMove as EventListener,
        pointerup: handleEnd as EventListener,
        pointercancel: handleCancel as EventListener
      };
    } else if (supportTouch) {
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
      
      // Clear long press timer
      if (longPressCleanup) {
        longPressCleanup();
        longPressCleanup = null;
      }
      
      // Clear handler references
      handlers.clear();
    }
  };
};