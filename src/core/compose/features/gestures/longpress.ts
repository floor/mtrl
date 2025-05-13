// src/core/compose/features/gestures/longpress.ts
/**
 * @module core/compose/features/gestures
 * @description Adds long press gesture recognition to components
 */

import { BaseComponent, ElementComponent } from '../../component';
import { LongPressEvent, GestureHandler } from '../../../gestures';
import { 
  hasLifecycle, 
  hasEmit, 
  ComponentWithLifecycle, 
  ComponentWithEmit 
} from '../../utils/type-guards';

/**
 * Configuration for long press gesture feature
 */
export interface LongPressGestureConfig {
  /**
   * Time (in ms) to recognize a long press
   * @default 500
   */
  longPressTime?: number;
  
  /**
   * Distance threshold (in pixels) for movement that cancels long press
   * @default 10
   */
  moveThreshold?: number;
  
  /**
   * Whether to prevent default behaviors on touch events
   * @default true
   */
  preventDefault?: boolean;
  
  /**
   * Handler for long press gesture
   */
  onLongPress?: GestureHandler;
  
  /**
   * Whether to enable long press recognition immediately
   * @default true
   */
  enabled?: boolean;
  
  [key: string]: any;
}

/**
 * Component with long press gesture recognition capabilities
 */
export interface LongPressGestureComponent extends BaseComponent {
  /**
   * Add a long press event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onLongPress: (handler: (event: LongPressEvent) => void) => LongPressGestureComponent;
  
  /**
   * Remove a long press event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offLongPress: (handler: (event: LongPressEvent) => void) => LongPressGestureComponent;
  
  /**
   * Enable long press recognition
   * @returns Component for chaining
   */
  enableLongPress: () => LongPressGestureComponent;
  
  /**
   * Disable long press recognition
   * @returns Component for chaining
   */
  disableLongPress: () => LongPressGestureComponent;
}

/**
 * Adds long press gesture recognition to a component.
 * This is a lightweight alternative to the full gesture system,
 * focused only on long press detection.
 * 
 * @param config - Configuration object containing long press settings
 * @returns Function that enhances a component with long press capabilities
 * 
 * @example
 * ```ts
 * // Add long press gesture recognition to a component
 * const component = pipe(
 *   createBase,
 *   withElement(...),
 *   withLongPressGesture({
 *     longPressTime: 800,
 *     onLongPress: (e) => showContextMenu(e.x, e.y)
 *   })
 * )(config);
 * ```
 */
export const withLongPressGesture = (config: LongPressGestureConfig = {}) => 
  <C extends ElementComponent>(component: C): C & LongPressGestureComponent => {
    if (!component.element) {
      console.warn('Cannot add long press gesture recognition: missing element');
      return component as C & LongPressGestureComponent;
    }
    
    // Default configuration
    const {
      longPressTime = 500,
      moveThreshold = 10,
      preventDefault = true,
      onLongPress,
      enabled = true
    } = config;
    
    // Event handlers storage
    const handlers: Set<(event: LongPressEvent) => void> = new Set();
    
    // If initial handler provided, add it
    if (onLongPress) {
      handlers.add(onLongPress as (event: LongPressEvent) => void);
    }
    
    // Gesture state for tracking
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let active = false;
    let startTime = 0;
    let longPressTimer: number | null = null;
    let isEnabled = enabled;
    
    /**
     * Dispatch a long press event to all handlers
     */
    const dispatchLongPress = (e: MouseEvent | TouchEvent): void => {
      // Create the long press event
      const longPressEvent: LongPressEvent = {
        type: 'longpress',
        originalEvent: e,
        target: e.target!,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        defaultPrevented: false,
        preventDefault: () => {
          longPressEvent.defaultPrevented = true;
          if (e.cancelable) {
            e.preventDefault();
          }
        },
        stopPropagation: () => {
          e.stopPropagation();
        },
        x: currentX,
        y: currentY
      };
      
      // Call each handler
      handlers.forEach(handler => {
        try {
          handler(longPressEvent);
        } catch (error) {
          console.error('Error in long press handler:', error);
        }
      });
      
      // Forward to component's event system if available
      if (hasEmit(component)) {
        component.emit('longpress', longPressEvent);
      }
      
      // Apply preventDefault if configured
      if (preventDefault && !longPressEvent.defaultPrevented) {
        longPressEvent.preventDefault();
      }
    };
    
    /**
     * Handle touch/mouse start
     */
    const handleStart = (e: MouseEvent | TouchEvent): void => {
      if (!isEnabled) return;
      
      const touch = 'touches' in e ? e.touches[0] : e;
      
      startX = currentX = touch.clientX;
      startY = currentY = touch.clientY;
      startTime = Date.now();
      active = true;
      
      // Cancel any existing timer
      if (longPressTimer !== null) {
        window.clearTimeout(longPressTimer);
      }
      
      // Set up long press timer
      longPressTimer = window.setTimeout(() => {
        if (active) {
          // Check if movement was within threshold
          const deltaX = currentX - startX;
          const deltaY = currentY - startY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          if (distance < moveThreshold) {
            dispatchLongPress(e);
          }
        }
        
        longPressTimer = null;
      }, longPressTime);
    };
    
    /**
     * Handle touch/mouse move
     */
    const handleMove = (e: MouseEvent | TouchEvent): void => {
      if (!active || !isEnabled) return;
      
      const touch = 'touches' in e ? e.touches[0] : e;
      
      currentX = touch.clientX;
      currentY = touch.clientY;
      
      // Check if movement exceeds threshold
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > moveThreshold) {
        // Cancel long press if moved too much
        if (longPressTimer !== null) {
          window.clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }
    };
    
    /**
     * Handle touch/mouse end
     */
    const handleEnd = (): void => {
      if (longPressTimer !== null) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      
      active = false;
    };
    
    /**
     * Handle touch/mouse cancel
     */
    const handleCancel = (): void => {
      if (longPressTimer !== null) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      
      active = false;
    };
    
    // Event listeners dictionary
    const eventListeners: Record<string, EventListener> = {
      mousedown: handleStart as EventListener,
      mousemove: handleMove as EventListener,
      mouseup: handleEnd as EventListener,
      mouseleave: handleCancel as EventListener,
      touchstart: handleStart as EventListener,
      touchmove: handleMove as EventListener,
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
        
        // Clear any timers
        if (longPressTimer !== null) {
          window.clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        
        // Clear handlers
        handlers.clear();
        
        // Call original destroy method
        originalDestroy.call(component.lifecycle);
      };
    }
    
    // Create enhanced component
    return {
      ...component,
      
      /**
       * Add a long press event handler
       * @param handler - Event handler function
       * @returns Component for chaining
       */
      onLongPress(handler: (event: LongPressEvent) => void) {
        handlers.add(handler);
        return this;
      },
      
      /**
       * Remove a long press event handler
       * @param handler - Event handler function
       * @returns Component for chaining
       */
      offLongPress(handler: (event: LongPressEvent) => void) {
        handlers.delete(handler);
        return this;
      },
      
      /**
       * Enable long press recognition
       * @returns Component for chaining
       */
      enableLongPress() {
        if (!isEnabled) {
          isEnabled = true;
          setupEventListeners();
        }
        return this;
      },
      
      /**
       * Disable long press recognition
       * @returns Component for chaining
       */
      disableLongPress() {
        if (isEnabled) {
          isEnabled = false;
          removeEventListeners();
          
          // Clear any timers
          if (longPressTimer !== null) {
            window.clearTimeout(longPressTimer);
            longPressTimer = null;
          }
        }
        return this;
      }
    };
  };