// src/core/compose/features/gestures/swipe.ts
/**
 * @module core/compose/features/gestures
 * @description Adds swipe gesture recognition to components
 */

import { BaseComponent, ElementComponent } from '../../component';
import { SwipeEvent, SWIPE_DIRECTIONS, GestureHandler } from '../../../gestures';
import { 
  hasLifecycle, 
  hasEmit, 
  ComponentWithLifecycle, 
  ComponentWithEmit 
} from '../../utils/type-guards';

/**
 * Configuration for swipe gesture feature
 */
export interface SwipeGestureConfig {
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
   * Whether to prevent default behaviors on touch events
   * @default true
   */
  preventDefault?: boolean;
  
  /**
   * Handler for any swipe direction
   */
  onSwipe?: GestureHandler;
  
  /**
   * Handler specifically for left swipes
   */
  onSwipeLeft?: GestureHandler;
  
  /**
   * Handler specifically for right swipes
   */
  onSwipeRight?: GestureHandler;
  
  /**
   * Handler specifically for up swipes
   */
  onSwipeUp?: GestureHandler;
  
  /**
   * Handler specifically for down swipes
   */
  onSwipeDown?: GestureHandler;
  
  /**
   * Whether to enable swipe recognition immediately
   * @default true
   */
  enabled?: boolean;
  
  [key: string]: any;
}

/**
 * Component with swipe gesture recognition capabilities
 */
export interface SwipeGestureComponent extends BaseComponent {
  /**
   * Add a handler for any swipe direction
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onSwipe: (handler: (event: SwipeEvent) => void) => SwipeGestureComponent;
  
  /**
   * Add a handler specifically for left swipes
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onSwipeLeft: (handler: (event: SwipeEvent) => void) => SwipeGestureComponent;
  
  /**
   * Add a handler specifically for right swipes
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onSwipeRight: (handler: (event: SwipeEvent) => void) => SwipeGestureComponent;
  
  /**
   * Add a handler specifically for up swipes
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onSwipeUp: (handler: (event: SwipeEvent) => void) => SwipeGestureComponent;
  
  /**
   * Add a handler specifically for down swipes
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onSwipeDown: (handler: (event: SwipeEvent) => void) => SwipeGestureComponent;
  
  /**
   * Remove a swipe event handler for any direction
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offSwipe: (handler: (event: SwipeEvent) => void) => SwipeGestureComponent;
  
  /**
   * Remove a left swipe event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offSwipeLeft: (handler: (event: SwipeEvent) => void) => SwipeGestureComponent;
  
  /**
   * Remove a right swipe event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offSwipeRight: (handler: (event: SwipeEvent) => void) => SwipeGestureComponent;
  
  /**
   * Remove an up swipe event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offSwipeUp: (handler: (event: SwipeEvent) => void) => SwipeGestureComponent;
  
  /**
   * Remove a down swipe event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offSwipeDown: (handler: (event: SwipeEvent) => void) => SwipeGestureComponent;
  
  /**
   * Enable swipe recognition
   * @returns Component for chaining
   */
  enableSwipe: () => SwipeGestureComponent;
  
  /**
   * Disable swipe recognition
   * @returns Component for chaining
   */
  disableSwipe: () => SwipeGestureComponent;
}

/**
 * Determine swipe direction based on delta X and Y
 * 
 * @param deltaX - Distance moved in X direction
 * @param deltaY - Distance moved in Y direction
 * @returns Direction of the swipe
 */
function getSwipeDirection(deltaX: number, deltaY: number): SWIPE_DIRECTIONS {
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? SWIPE_DIRECTIONS.RIGHT : SWIPE_DIRECTIONS.LEFT;
  }
  return deltaY > 0 ? SWIPE_DIRECTIONS.DOWN : SWIPE_DIRECTIONS.UP;
}

/**
 * Adds swipe gesture recognition to a component.
 * This is a lightweight alternative to the full gesture system,
 * focused only on swipe detection.
 * 
 * @param config - Configuration object containing swipe settings
 * @returns Function that enhances a component with swipe capabilities
 * 
 * @example
 * ```ts
 * // Add swipe gesture recognition to a component
 * const component = pipe(
 *   createBase,
 *   withElement(...),
 *   withSwipeGesture({
 *     onSwipeLeft: () => showNextPage(),
 *     onSwipeRight: () => showPreviousPage()
 *   })
 * )(config);
 * ```
 */
export const withSwipeGesture = (config: SwipeGestureConfig = {}) => 
  <C extends ElementComponent>(component: C): C & SwipeGestureComponent => {
    if (!component.element) {
      console.warn('Cannot add swipe gesture recognition: missing element');
      return component as C & SwipeGestureComponent;
    }
    
    // Default configuration
    const {
      swipeThreshold = 30,
      swipeTimeThreshold = 300,
      preventDefault = true,
      onSwipe,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      enabled = true
    } = config;
    
    // Event handlers storage by direction
    const handlers = {
      swipe: new Set<(event: SwipeEvent) => void>(),
      swipeleft: new Set<(event: SwipeEvent) => void>(),
      swiperight: new Set<(event: SwipeEvent) => void>(),
      swipeup: new Set<(event: SwipeEvent) => void>(),
      swipedown: new Set<(event: SwipeEvent) => void>()
    };
    
    // Add initial handlers if provided
    if (onSwipe) handlers.swipe.add(onSwipe as (event: SwipeEvent) => void);
    if (onSwipeLeft) handlers.swipeleft.add(onSwipeLeft as (event: SwipeEvent) => void);
    if (onSwipeRight) handlers.swiperight.add(onSwipeRight as (event: SwipeEvent) => void);
    if (onSwipeUp) handlers.swipeup.add(onSwipeUp as (event: SwipeEvent) => void);
    if (onSwipeDown) handlers.swipedown.add(onSwipeDown as (event: SwipeEvent) => void);
    
    // Gesture state for tracking
    let startX = 0;
    let startY = 0;
    let active = false;
    let startTime = 0;
    let isEnabled = enabled;
    
    /**
     * Dispatch a swipe event to all registered handlers
     */
    const dispatchSwipe = (e: MouseEvent | TouchEvent, endX: number, endY: number): void => {
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const endTime = Date.now();
      const duration = endTime - startTime;
      const velocity = distance / duration;
      const direction = getSwipeDirection(deltaX, deltaY);
      
      // Create the swipe event
      const swipeEvent: SwipeEvent = {
        type: 'swipe',
        originalEvent: e,
        target: e.target!,
        startTime,
        endTime,
        duration,
        defaultPrevented: false,
        preventDefault: () => {
          swipeEvent.defaultPrevented = true;
          if (e.cancelable) {
            e.preventDefault();
          }
        },
        stopPropagation: () => {
          e.stopPropagation();
        },
        direction,
        deltaX,
        deltaY,
        distance,
        velocity,
        startX,
        startY,
        endX,
        endY
      };
      
      // First trigger generic swipe handlers
      handlers.swipe.forEach(handler => {
        try {
          handler(swipeEvent);
        } catch (error) {
          console.error('Error in swipe handler:', error);
        }
      });
      
      // Then trigger direction-specific handlers
      const directionKey = `swipe${direction}` as keyof typeof handlers;
      handlers[directionKey].forEach(handler => {
        try {
          handler({...swipeEvent, type: directionKey} as SwipeEvent);
        } catch (error) {
          console.error(`Error in ${directionKey} handler:`, error);
        }
      });
      
      // Forward to component's event system if available
      if (hasEmit(component)) {
        component.emit('swipe', swipeEvent);
        component.emit(directionKey, swipeEvent);
      }
      
      // Apply preventDefault if configured
      if (preventDefault && !swipeEvent.defaultPrevented) {
        swipeEvent.preventDefault();
      }
    };
    
    /**
     * Handle touch/mouse start
     */
    const handleStart = (e: MouseEvent | TouchEvent): void => {
      if (!isEnabled) return;
      
      const touch = 'touches' in e ? e.touches[0] : e;
      
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      active = true;
    };
    
    /**
     * Handle touch/mouse end
     */
    const handleEnd = (e: MouseEvent | TouchEvent): void => {
      if (!active || !isEnabled) return;
      
      const touch = 'changedTouches' in e && e.changedTouches.length > 0
        ? e.changedTouches[0]
        : (e as MouseEvent);
      
      const endX = touch.clientX;
      const endY = touch.clientY;
      
      // Calculate swipe properties
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = Date.now() - startTime;
      
      // Check if it's a swipe
      if (distance >= swipeThreshold && duration <= swipeTimeThreshold) {
        dispatchSwipe(e, endX, endY);
      }
      
      active = false;
    };
    
    /**
     * Handle touch/mouse cancel
     */
    const handleCancel = (): void => {
      active = false;
    };
    
    // Event listeners dictionary
    const eventListeners: Record<string, EventListener> = {
      mousedown: handleStart as EventListener,
      mouseup: handleEnd as EventListener,
      mouseleave: handleCancel as EventListener,
      touchstart: handleStart as EventListener,
      touchend: handleEnd as EventListener,
      touchcancel: handleCancel as EventListener
    };
    
    /**
     * Add event listeners to element
     */
    const setupEventListeners = (): void => {
      Object.entries(eventListeners).forEach(([event, listener]) => {
        component.element.addEventListener(event, listener, { passive: !preventDefault });
      });
    };
    
    /**
     * Remove event listeners from element
     */
    const removeEventListeners = (): void => {
      Object.entries(eventListeners).forEach(([event, listener]) => {
        component.element.removeEventListener(event, listener);
      });
    };
    
    // Setup listeners if initially enabled
    if (isEnabled) {
      setupEventListeners();
    }
    
    // Handle lifecycle integration
    if (hasLifecycle(component)) {
      const originalDestroy = component.lifecycle.destroy;
      
      component.lifecycle.destroy = () => {
        // Clean up event listeners
        removeEventListeners();
        
        // Clear handlers
        Object.values(handlers).forEach(handlerSet => handlerSet.clear());
        
        // Call original destroy method
        originalDestroy.call(component.lifecycle);
      };
    }
    
    // Create enhanced component
    return {
      ...component,
      
      // Add handler methods
      onSwipe(handler: (event: SwipeEvent) => void) {
        handlers.swipe.add(handler);
        return this;
      },
      
      onSwipeLeft(handler: (event: SwipeEvent) => void) {
        handlers.swipeleft.add(handler);
        return this;
      },
      
      onSwipeRight(handler: (event: SwipeEvent) => void) {
        handlers.swiperight.add(handler);
        return this;
      },
      
      onSwipeUp(handler: (event: SwipeEvent) => void) {
        handlers.swipeup.add(handler);
        return this;
      },
      
      onSwipeDown(handler: (event: SwipeEvent) => void) {
        handlers.swipedown.add(handler);
        return this;
      },
      
      // Remove handler methods
      offSwipe(handler: (event: SwipeEvent) => void) {
        handlers.swipe.delete(handler);
        return this;
      },
      
      offSwipeLeft(handler: (event: SwipeEvent) => void) {
        handlers.swipeleft.delete(handler);
        return this;
      },
      
      offSwipeRight(handler: (event: SwipeEvent) => void) {
        handlers.swiperight.delete(handler);
        return this;
      },
      
      offSwipeUp(handler: (event: SwipeEvent) => void) {
        handlers.swipeup.delete(handler);
        return this;
      },
      
      offSwipeDown(handler: (event: SwipeEvent) => void) {
        handlers.swipedown.delete(handler);
        return this;
      },
      
      // Enable/disable methods
      enableSwipe() {
        if (!isEnabled) {
          isEnabled = true;
          setupEventListeners();
        }
        return this;
      },
      
      disableSwipe() {
        if (isEnabled) {
          isEnabled = false;
          removeEventListeners();
        }
        return this;
      }
    };
  };