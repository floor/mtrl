// src/core/compose/features/gestures/pan.ts
/**
 * @module core/compose/features/gestures
 * @description Adds pan gesture recognition to components
 */

import { BaseComponent, ElementComponent } from '../../component';
import { PanEvent, GestureHandler } from '../../../gestures';
import { 
  hasLifecycle, 
  hasEmit, 
  ComponentWithLifecycle, 
  ComponentWithEmit 
} from '../../utils/type-guards';

/**
 * Configuration for pan gesture feature
 */
export interface PanGestureConfig {
  /**
   * Whether to prevent default behaviors on touch events
   * @default true
   */
  preventDefault?: boolean;
  
  /**
   * Handler for pan start (first movement)
   */
  onPanStart?: GestureHandler;
  
  /**
   * Handler for pan move (continuous updates during pan)
   */
  onPan?: GestureHandler;
  
  /**
   * Handler for pan end (touch/mouse release)
   */
  onPanEnd?: GestureHandler;
  
  /**
   * Whether to enable pan recognition immediately
   * @default true
   */
  enabled?: boolean;
  
  [key: string]: any;
}

/**
 * Extend the PanEvent interface to support our custom event types
 */
interface ExtendedPanEvent extends Omit<PanEvent, 'type'> {
  type: 'pan' | 'panstart' | 'panend';
}

/**
 * Component with pan gesture recognition capabilities
 */
export interface PanGestureComponent extends BaseComponent {
  /**
   * Add a handler for pan start
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onPanStart: (handler: (event: PanEvent) => void) => PanGestureComponent;
  
  /**
   * Add a handler for pan move (continuous updates)
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onPan: (handler: (event: PanEvent) => void) => PanGestureComponent;
  
  /**
   * Add a handler for pan end
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onPanEnd: (handler: (event: PanEvent) => void) => PanGestureComponent;
  
  /**
   * Remove a pan start handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offPanStart: (handler: (event: PanEvent) => void) => PanGestureComponent;
  
  /**
   * Remove a pan move handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offPan: (handler: (event: PanEvent) => void) => PanGestureComponent;
  
  /**
   * Remove a pan end handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offPanEnd: (handler: (event: PanEvent) => void) => PanGestureComponent;
  
  /**
   * Enable pan recognition
   * @returns Component for chaining
   */
  enablePan: () => PanGestureComponent;
  
  /**
   * Disable pan recognition
   * @returns Component for chaining
   */
  disablePan: () => PanGestureComponent;
}

/**
 * Adds pan gesture recognition to a component.
 * This is a lightweight alternative to the full gesture system,
 * focused only on pan detection.
 * 
 * @param config - Configuration object containing pan settings
 * @returns Function that enhances a component with pan capabilities
 * 
 * @example
 * ```ts
 * // Add pan gesture recognition to a component
 * const component = pipe(
 *   createBase,
 *   withElement(...),
 *   withPanGesture({
 *     onPanStart: (e) => startDrag(e),
 *     onPan: (e) => updateDragPosition(e),
 *     onPanEnd: (e) => endDrag(e)
 *   })
 * )(config);
 * ```
 */
export const withPanGesture = (config: PanGestureConfig = {}) => 
  <C extends ElementComponent>(component: C): C & PanGestureComponent => {
    if (!component.element) {
      console.warn('Cannot add pan gesture recognition: missing element');
      return component as C & PanGestureComponent;
    }
    
    // Default configuration
    const {
      preventDefault = true,
      onPanStart,
      onPan,
      onPanEnd,
      enabled = true
    } = config;
    
    // Event handlers storage by pan phase
    const handlers = {
      panstart: new Set<(event: PanEvent) => void>(),
      pan: new Set<(event: PanEvent) => void>(),
      panend: new Set<(event: PanEvent) => void>()
    };
    
    // Add initial handlers if provided
    if (onPanStart) handlers.panstart.add(onPanStart as (event: PanEvent) => void);
    if (onPan) handlers.pan.add(onPan as (event: PanEvent) => void);
    if (onPanEnd) handlers.panend.add(onPanEnd as (event: PanEvent) => void);
    
    // Gesture state for tracking
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let currentX = 0;
    let currentY = 0;
    let active = false;
    let isPanning = false;
    let startTime = 0;
    let isEnabled = enabled;
    
    /**
     * Create a pan event with the current state
     */
    const createPanEvent = (
      e: MouseEvent | TouchEvent, 
      type: 'panstart' | 'pan' | 'panend'
    ): ExtendedPanEvent => {
      const event: ExtendedPanEvent = {
        type,
        originalEvent: e,
        target: e.target!,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        defaultPrevented: false,
        preventDefault: () => {
          event.defaultPrevented = true;
          if (e.cancelable) {
            e.preventDefault();
          }
        },
        stopPropagation: () => {
          e.stopPropagation();
        },
        deltaX: currentX - startX,
        deltaY: currentY - startY,
        startX,
        startY,
        currentX,
        currentY
      };
      return event;
    };
    
    /**
     * Dispatch a pan event to all registered handlers
     */
    const dispatchPan = (e: MouseEvent | TouchEvent, type: 'panstart' | 'pan' | 'panend'): void => {
      const extendedPanEvent = createPanEvent(e, type);
      
      // Call each handler for this phase
      handlers[type].forEach(handler => {
        try {
          // Type assertion for the handler call - we're deliberately passing our extended event
          handler(extendedPanEvent as unknown as PanEvent);
        } catch (error) {
          console.error(`Error in ${type} handler:`, error);
        }
      });
      
      // Forward to component's event system if available
      if (hasEmit(component)) {
        component.emit(type, extendedPanEvent);
      }
      
      // Apply preventDefault if configured
      if (preventDefault && !extendedPanEvent.defaultPrevented) {
        extendedPanEvent.preventDefault();
      }
    };
    
    /**
     * Handle touch/mouse start
     */
    const handleStart = (e: MouseEvent | TouchEvent): void => {
      if (!isEnabled) return;
      
      const touch = 'touches' in e ? e.touches[0] : e;
      
      startX = lastX = currentX = touch.clientX;
      startY = lastY = currentY = touch.clientY;
      startTime = Date.now();
      active = true;
      isPanning = false;
    };
    
    /**
     * Handle touch/mouse move
     */
    const handleMove = (e: MouseEvent | TouchEvent): void => {
      if (!active || !isEnabled) return;
      
      const touch = 'touches' in e ? e.touches[0] : e;
      
      // Update position
      lastX = currentX;
      lastY = currentY;
      currentX = touch.clientX;
      currentY = touch.clientY;
      
      // Calculate movement delta
      const moveDeltaX = currentX - lastX;
      const moveDeltaY = currentY - lastY;
      const moveDelta = Math.sqrt(moveDeltaX * moveDeltaX + moveDeltaY * moveDeltaY);
      
      // Detect significant movement
      if (moveDelta > 0) {
        // If this is the first significant movement, trigger panstart
        if (!isPanning) {
          isPanning = true;
          dispatchPan(e, 'panstart');
        }
        
        // Then trigger the continuous pan event
        dispatchPan(e, 'pan');
      }
    };
    
    /**
     * Handle touch/mouse end
     */
    const handleEnd = (e: MouseEvent | TouchEvent): void => {
      if (!active || !isEnabled) return;
      
      // If we were panning, trigger the panend event
      if (isPanning) {
        dispatchPan(e, 'panend');
      }
      
      active = false;
      isPanning = false;
    };
    
    /**
     * Handle touch/mouse cancel
     */
    const handleCancel = (e: MouseEvent | TouchEvent): void => {
      if (!active || !isEnabled) return;
      
      // If we were panning, trigger the panend event
      if (isPanning) {
        dispatchPan(e, 'panend');
      }
      
      active = false;
      isPanning = false;
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
      onPanStart(handler: (event: PanEvent) => void) {
        handlers.panstart.add(handler);
        return this;
      },
      
      onPan(handler: (event: PanEvent) => void) {
        handlers.pan.add(handler);
        return this;
      },
      
      onPanEnd(handler: (event: PanEvent) => void) {
        handlers.panend.add(handler);
        return this;
      },
      
      // Remove handler methods
      offPanStart(handler: (event: PanEvent) => void) {
        handlers.panstart.delete(handler);
        return this;
      },
      
      offPan(handler: (event: PanEvent) => void) {
        handlers.pan.delete(handler);
        return this;
      },
      
      offPanEnd(handler: (event: PanEvent) => void) {
        handlers.panend.delete(handler);
        return this;
      },
      
      // Enable/disable methods
      enablePan() {
        if (!isEnabled) {
          isEnabled = true;
          setupEventListeners();
        }
        return this;
      },
      
      disablePan() {
        if (isEnabled) {
          isEnabled = false;
          removeEventListeners();
        }
        return this;
      }
    };
  };