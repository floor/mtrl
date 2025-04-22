// src/core/compose/features/gestures/tap.ts
/**
 * @module core/compose/features/gestures
 * @description Adds tap gesture recognition to components
 */

import { BaseComponent, ElementComponent } from '../../component';
import { TapEvent, GestureHandler } from '../../../gestures';

/**
 * Configuration for tap gesture feature
 */
export interface TapGestureConfig {
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
   * Handler for tap gesture
   */
  onTap?: GestureHandler;
  
  /**
   * Whether to enable tap recognition immediately
   * @default true
   */
  enabled?: boolean;
  
  [key: string]: any;
}

/**
 * Component with tap gesture recognition capabilities
 */
export interface TapGestureComponent extends BaseComponent {
  /**
   * Add a tap event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onTap: (handler: (event: TapEvent) => void) => TapGestureComponent;
  
  /**
   * Remove a tap event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offTap: (handler: (event: TapEvent) => void) => TapGestureComponent;
  
  /**
   * Enable tap recognition
   * @returns Component for chaining
   */
  enableTap: () => TapGestureComponent;
  
  /**
   * Disable tap recognition
   * @returns Component for chaining
   */
  disableTap: () => TapGestureComponent;
}

/**
 * Adds tap gesture recognition to a component.
 * This is a lightweight alternative to the full gesture system,
 * focused only on tap detection.
 * 
 * @param config - Configuration object containing tap settings
 * @returns Function that enhances a component with tap capabilities
 * 
 * @example
 * ```ts
 * // Add tap gesture recognition to a component
 * const component = pipe(
 *   createBase,
 *   withElement(...),
 *   withTapGesture({
 *     onTap: (e) => console.log('Tapped at', e.x, e.y)
 *   })
 * )(config);
 * ```
 */
export const withTapGesture = (config: TapGestureConfig = {}) => 
  <C extends ElementComponent>(component: C): C & TapGestureComponent => {
    if (!component.element) {
      console.warn('Cannot add tap gesture recognition: missing element');
      return component as C & TapGestureComponent;
    }
    
    // Default configuration
    const {
      tapDistanceThreshold = 10,
      preventDefault = true,
      onTap,
      enabled = true
    } = config;
    
    // Event handlers storage
    const handlers: Set<(event: TapEvent) => void> = new Set();
    
    // If initial handler provided, add it
    if (onTap) {
      handlers.add(onTap as (event: TapEvent) => void);
    }
    
    // Gesture state for tracking
    let startX = 0;
    let startY = 0;
    let active = false;
    let startTime = 0;
    let lastTapTime = 0;
    let tapCount = 0;
    let isEnabled = enabled;
    
    /**
     * Dispatch a tap event to all handlers
     */
    const dispatchTap = (e: MouseEvent | TouchEvent, x: number, y: number): void => {
      const now = Date.now();
      const isDoubleTap = now - lastTapTime < 300;
      
      if (isDoubleTap) {
        tapCount++;
      } else {
        tapCount = 1;
      }
      
      lastTapTime = now;
      
      // Create the tap event
      const tapEvent: TapEvent = {
        type: 'tap',
        originalEvent: e,
        target: e.target!,
        startTime,
        endTime: now,
        duration: now - startTime,
        defaultPrevented: false,
        preventDefault: () => {
          tapEvent.defaultPrevented = true;
          if (e.cancelable) {
            e.preventDefault();
          }
        },
        stopPropagation: () => {
          e.stopPropagation();
        },
        count: tapCount,
        x,
        y
      };
      
      // Call each handler
      handlers.forEach(handler => {
        try {
          handler(tapEvent);
        } catch (error) {
          console.error('Error in tap handler:', error);
        }
      });
      
      // Forward to component's event system if available
      if ('emit' in component) {
        (component as any).emit('tap', tapEvent);
      }
      
      // Apply preventDefault if configured
      if (preventDefault && !tapEvent.defaultPrevented) {
        tapEvent.preventDefault();
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
      
      // Calculate distance moved
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Check if movement is within threshold
      if (distance < tapDistanceThreshold) {
        dispatchTap(e, endX, endY);
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
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      
      component.lifecycle.destroy = () => {
        // Clean up event listeners
        removeEventListeners();
        
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
       * Add a tap event handler
       * @param handler - Event handler function
       * @returns Component for chaining
       */
      onTap(handler: (event: TapEvent) => void) {
        handlers.add(handler);
        return this;
      },
      
      /**
       * Remove a tap event handler
       * @param handler - Event handler function
       * @returns Component for chaining
       */
      offTap(handler: (event: TapEvent) => void) {
        handlers.delete(handler);
        return this;
      },
      
      /**
       * Enable tap recognition
       * @returns Component for chaining
       */
      enableTap() {
        if (!isEnabled) {
          isEnabled = true;
          setupEventListeners();
        }
        return this;
      },
      
      /**
       * Disable tap recognition
       * @returns Component for chaining
       */
      disableTap() {
        if (isEnabled) {
          isEnabled = false;
          removeEventListeners();
        }
        return this;
      }
    };
  };