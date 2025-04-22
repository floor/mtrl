// src/core/compose/features/gestures/rotate.ts
/**
 * @module core/compose/features/gestures
 * @description Adds rotate gesture recognition to components
 */

import { BaseComponent, ElementComponent } from '../../component';
import { RotateEvent, GestureHandler } from '../../../gestures';
import { getAngle } from '../../../gestures/utils';

/**
 * Configuration for rotate gesture feature
 */
export interface RotateGestureConfig {
  /**
   * Whether to prevent default behaviors on touch events
   * @default true
   */
  preventDefault?: boolean;
  
  /**
   * Handler for rotate gesture
   */
  onRotate?: GestureHandler;
  
  /**
   * Handler for rotate start
   */
  onRotateStart?: GestureHandler;
  
  /**
   * Handler for rotate end
   */
  onRotateEnd?: GestureHandler;
  
  /**
   * Whether to enable rotate recognition immediately
   * @default true
   */
  enabled?: boolean;
  
  [key: string]: any;
}

/**
 * Component with rotate gesture recognition capabilities
 */
export interface RotateGestureComponent extends BaseComponent {
  /**
   * Add a rotate event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onRotate: (handler: (event: RotateEvent) => void) => RotateGestureComponent;
  
  /**
   * Add a rotate start event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onRotateStart: (handler: (event: RotateEvent) => void) => RotateGestureComponent;
  
  /**
   * Add a rotate end event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onRotateEnd: (handler: (event: RotateEvent) => void) => RotateGestureComponent;
  
  /**
   * Remove a rotate event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offRotate: (handler: (event: RotateEvent) => void) => RotateGestureComponent;
  
  /**
   * Remove a rotate start event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offRotateStart: (handler: (event: RotateEvent) => void) => RotateGestureComponent;
  
  /**
   * Remove a rotate end event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offRotateEnd: (handler: (event: RotateEvent) => void) => RotateGestureComponent;
  
  /**
   * Enable rotate recognition
   * @returns Component for chaining
   */
  enableRotate: () => RotateGestureComponent;
  
  /**
   * Disable rotate recognition
   * @returns Component for chaining
   */
  disableRotate: () => RotateGestureComponent;
  
  /**
   * Check if rotate gestures are supported on the current device
   * @returns Whether rotate gestures are supported
   */
  isRotateSupported: () => boolean;
}

/**
 * Adds rotate gesture recognition to a component.
 * This is a lightweight alternative to the full gesture system,
 * focused only on rotate detection.
 * 
 * @param config - Configuration object containing rotate settings
 * @returns Function that enhances a component with rotate capabilities
 * 
 * @example
 * ```ts
 * // Add rotate gesture recognition to a component
 * const component = pipe(
 *   createBase,
 *   withElement(...),
 *   withRotateGesture({
 *     onRotate: (e) => updateRotation(e.rotation)
 *   })
 * )(config);
 * ```
 */
export const withRotateGesture = (config: RotateGestureConfig = {}) => 
  <C extends ElementComponent>(component: C): C & RotateGestureComponent => {
    if (!component.element) {
      console.warn('Cannot add rotate gesture recognition: missing element');
      return component as C & RotateGestureComponent;
    }
    
    // Default configuration
    const {
      preventDefault = true,
      onRotate,
      onRotateStart,
      onRotateEnd,
      enabled = true
    } = config;
    
    // Event handlers storage
    const handlers = {
      rotate: new Set<(event: RotateEvent) => void>(),
      rotatestart: new Set<(event: RotateEvent) => void>(),
      rotateend: new Set<(event: RotateEvent) => void>()
    };
    
    // Add initial handlers if provided
    if (onRotate) handlers.rotate.add(onRotate as (event: RotateEvent) => void);
    if (onRotateStart) handlers.rotatestart.add(onRotateStart as (event: RotateEvent) => void);
    if (onRotateEnd) handlers.rotateend.add(onRotateEnd as (event: RotateEvent) => void);
    
    // Check if device supports touch (required for rotate)
    const isTouchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Gesture state for tracking
    let startAngle = 0;
    let lastRotation = 0;
    let isRotating = false;
    let startTime = 0;
    let isEnabled = enabled;
    
    /**
     * Create a rotate event
     */
    const createRotateEvent = (
      e: TouchEvent, 
      type: 'rotate' | 'rotatestart' | 'rotateend',
      rotation: number,
      centerX: number,
      centerY: number
    ): RotateEvent => {
      return {
        type,
        originalEvent: e,
        target: e.target!,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        defaultPrevented: false,
        preventDefault: () => {
          rotateEvent.defaultPrevented = true;
          if (e.cancelable) {
            e.preventDefault();
          }
        },
        stopPropagation: () => {
          e.stopPropagation();
        },
        rotation,
        centerX,
        centerY
      };
    };
    
    /**
     * Dispatch a rotate event to registered handlers
     */
    const dispatchRotateEvent = (
      e: TouchEvent, 
      type: 'rotate' | 'rotatestart' | 'rotateend',
      rotation: number,
      centerX: number,
      centerY: number
    ): void => {
      const rotateEvent = createRotateEvent(e, type, rotation, centerX, centerY);
      
      // Call each handler for this type
      handlers[type].forEach(handler => {
        try {
          handler(rotateEvent);
        } catch (error) {
          console.error(`Error in ${type} handler:`, error);
        }
      });
      
      // Forward to component's event system if available
      if ('emit' in component) {
        (component as any).emit(type, rotateEvent);
      }
      
      // Apply preventDefault if configured
      if (preventDefault && !rotateEvent.defaultPrevented) {
        rotateEvent.preventDefault();
      }
    };
    
    /**
     * Handle touch start
     */
    const handleTouchStart = (e: TouchEvent): void => {
      if (!isEnabled || e.touches.length !== 2) return;
      
      // Calculate initial angle between touch points
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      startAngle = getAngle(
        touch1.clientX, 
        touch1.clientY, 
        touch2.clientX, 
        touch2.clientY
      );
      
      startTime = Date.now();
      lastRotation = 0;
      isRotating = false;
    };
    
    /**
     * Handle touch move
     */
    const handleTouchMove = (e: TouchEvent): void => {
      if (!isEnabled || e.touches.length !== 2) return;
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // Calculate current angle and rotation
      const currentAngle = getAngle(
        touch1.clientX, 
        touch1.clientY, 
        touch2.clientX, 
        touch2.clientY
      );
      
      // Calculate rotation in degrees (normalized to -180 to 180)
      let rotation = currentAngle - startAngle;
      
      // Normalize rotation to the -180 to 180 range
      if (rotation > 180) rotation -= 360;
      if (rotation < -180) rotation += 360;
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      // Check if rotation change is significant enough
      const rotationDiff = Math.abs(rotation - lastRotation);
      const ROTATION_THRESHOLD = 2; // degrees
      
      if (rotationDiff > ROTATION_THRESHOLD) {
        // Start rotate if this is the first significant rotation
        if (!isRotating) {
          isRotating = true;
          dispatchRotateEvent(e, 'rotatestart', rotation, centerX, centerY);
        }
        
        // Dispatch continuous rotate event
        dispatchRotateEvent(e, 'rotate', rotation, centerX, centerY);
        lastRotation = rotation;
      }
    };
    
    /**
     * Handle touch end
     */
    const handleTouchEnd = (e: TouchEvent): void => {
      if (!isEnabled || !isRotating) return;
      
      // Calculate final center point if we still have one finger on screen
      let centerX = 0;
      let centerY = 0;
      
      if (e.touches.length === 1) {
        centerX = e.touches[0].clientX;
        centerY = e.touches[0].clientY;
      } else if (e.changedTouches.length > 0) {
        centerX = e.changedTouches[0].clientX;
        centerY = e.changedTouches[0].clientY;
      }
      
      // Dispatch rotate end event
      dispatchRotateEvent(e, 'rotateend', lastRotation, centerX, centerY);
      
      // Reset state
      isRotating = false;
    };
    
    /**
     * Handle touch cancel
     */
    const handleTouchCancel = (e: TouchEvent): void => {
      if (!isEnabled || !isRotating) return;
      
      // Calculate final center point
      let centerX = 0;
      let centerY = 0;
      
      if (e.touches.length > 0) {
        centerX = e.touches[0].clientX;
        centerY = e.touches[0].clientY;
      }
      
      // Dispatch rotate end event
      dispatchRotateEvent(e, 'rotateend', lastRotation, centerX, centerY);
      
      // Reset state
      isRotating = false;
    };
    
    // Event listeners dictionary
    const eventListeners: Record<string, EventListener> = {
      touchstart: handleTouchStart as EventListener,
      touchmove: handleTouchMove as EventListener,
      touchend: handleTouchEnd as EventListener,
      touchcancel: handleTouchCancel as EventListener
    };
    
    /**
     * Add event listeners to element
     */
    const setupEventListeners = (): void => {
      if (!isTouchSupported) return;
      
      Object.entries(eventListeners).forEach(([event, listener]) => {
        component.element.addEventListener(event, listener, { passive: !preventDefault });
      });
    };
    
    /**
     * Remove event listeners from element
     */
    const removeEventListeners = (): void => {
      if (!isTouchSupported) return;
      
      Object.entries(eventListeners).forEach(([event, listener]) => {
        component.element.removeEventListener(event, listener);
      });
    };
    
    // Setup listeners if initially enabled
    if (isEnabled && isTouchSupported) {
      setupEventListeners();
    }
    
    // Handle lifecycle integration
    if ('lifecycle' in component && component.lifecycle?.destroy) {
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
      onRotate(handler: (event: RotateEvent) => void) {
        handlers.rotate.add(handler);
        return this;
      },
      
      onRotateStart(handler: (event: RotateEvent) => void) {
        handlers.rotatestart.add(handler);
        return this;
      },
      
      onRotateEnd(handler: (event: RotateEvent) => void) {
        handlers.rotateend.add(handler);
        return this;
      },
      
      // Remove handler methods
      offRotate(handler: (event: RotateEvent) => void) {
        handlers.rotate.delete(handler);
        return this;
      },
      
      offRotateStart(handler: (event: RotateEvent) => void) {
        handlers.rotatestart.delete(handler);
        return this;
      },
      
      offRotateEnd(handler: (event: RotateEvent) => void) {
        handlers.rotateend.delete(handler);
        return this;
      },
      
      // Enable/disable methods
      enableRotate() {
        if (!isEnabled) {
          isEnabled = true;
          setupEventListeners();
        }
        return this;
      },
      
      disableRotate() {
        if (isEnabled) {
          isEnabled = false;
          removeEventListeners();
        }
        return this;
      },
      
      // Support check method
      isRotateSupported() {
        return isTouchSupported;
      }
    };
  };