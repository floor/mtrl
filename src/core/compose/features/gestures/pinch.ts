// src/core/compose/features/gestures/pinch.ts
/**
 * @module core/compose/features/gestures
 * @description Adds pinch gesture recognition to components
 */

import { BaseComponent, ElementComponent } from "../../component";
import { PinchEvent, GestureHandler } from "../../../gestures";
import { getDistance } from "../../../gestures/utils";
import { hasLifecycle, hasEmit } from "../../utils/type-guards";

/**
 * Extended PinchEvent to support our custom event types
 */
interface ExtendedPinchEvent extends Omit<PinchEvent, "type"> {
  type: "pinch" | "pinchstart" | "pinchend";
}

/**
 * Configuration for pinch gesture feature
 */
export interface PinchGestureConfig {
  /**
   * Whether to prevent default behaviors on touch events
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Handler for pinch gesture
   */
  onPinch?: GestureHandler;

  /**
   * Handler for pinch start
   */
  onPinchStart?: GestureHandler;

  /**
   * Handler for pinch end
   */
  onPinchEnd?: GestureHandler;

  /**
   * Whether to enable pinch recognition immediately
   * @default true
   */
  enabled?: boolean;

  [key: string]: any;
}

/**
 * Component with pinch gesture recognition capabilities
 */
export interface PinchGestureComponent extends BaseComponent {
  /**
   * Add a pinch event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onPinch: (handler: (event: PinchEvent) => void) => PinchGestureComponent;

  /**
   * Add a pinch start event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onPinchStart: (handler: (event: PinchEvent) => void) => PinchGestureComponent;

  /**
   * Add a pinch end event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  onPinchEnd: (handler: (event: PinchEvent) => void) => PinchGestureComponent;

  /**
   * Remove a pinch event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offPinch: (handler: (event: PinchEvent) => void) => PinchGestureComponent;

  /**
   * Remove a pinch start event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offPinchStart: (
    handler: (event: PinchEvent) => void
  ) => PinchGestureComponent;

  /**
   * Remove a pinch end event handler
   * @param handler - Event handler function
   * @returns Component for chaining
   */
  offPinchEnd: (handler: (event: PinchEvent) => void) => PinchGestureComponent;

  /**
   * Enable pinch recognition
   * @returns Component for chaining
   */
  enablePinch: () => PinchGestureComponent;

  /**
   * Disable pinch recognition
   * @returns Component for chaining
   */
  disablePinch: () => PinchGestureComponent;

  /**
   * Check if pinch gestures are supported on the current device
   * @returns Whether pinch gestures are supported
   */
  isPinchSupported: () => boolean;
}

/**
 * Adds pinch gesture recognition to a component.
 * This is a lightweight alternative to the full gesture system,
 * focused only on pinch detection.
 *
 * @param config - Configuration object containing pinch settings
 * @returns Function that enhances a component with pinch capabilities
 *
 * @example
 * ```ts
 * // Add pinch gesture recognition to a component
 * const component = pipe(
 *   createBase,
 *   withElement(...),
 *   withPinchGesture({
 *     onPinch: (e) => updateZoom(e.scale)
 *   })
 * )(config);
 * ```
 */
export const withPinchGesture =
  (config: PinchGestureConfig = {}) =>
  <C extends ElementComponent>(component: C): C & PinchGestureComponent => {
    if (!component.element) {
      console.warn("Cannot add pinch gesture recognition: missing element");
      return component as C & PinchGestureComponent;
    }

    // Default configuration
    const {
      preventDefault = true,
      onPinch,
      onPinchStart,
      onPinchEnd,
      enabled = true,
    } = config;

    // Event handlers storage
    const handlers = {
      pinch: new Set<(event: PinchEvent) => void>(),
      pinchstart: new Set<(event: PinchEvent) => void>(),
      pinchend: new Set<(event: PinchEvent) => void>(),
    };

    // Add initial handlers if provided
    if (onPinch) handlers.pinch.add(onPinch as (event: PinchEvent) => void);
    if (onPinchStart)
      handlers.pinchstart.add(onPinchStart as (event: PinchEvent) => void);
    if (onPinchEnd)
      handlers.pinchend.add(onPinchEnd as (event: PinchEvent) => void);

    // Check if device supports touch (required for pinch)
    const isTouchSupported =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Gesture state for tracking
    let startDistance = 0;
    let lastScale = 1;
    let isPinching = false;
    let startTime = 0;
    let isEnabled = enabled;

    /**
     * Create a pinch event
     */
    const createPinchEvent = (
      e: TouchEvent,
      type: "pinch" | "pinchstart" | "pinchend",
      scale: number,
      centerX: number,
      centerY: number
    ): ExtendedPinchEvent => {
      const event: ExtendedPinchEvent = {
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
        scale,
        centerX,
        centerY,
      };
      return event;
    };

    /**
     * Dispatch a pinch event to registered handlers
     */
    const dispatchPinchEvent = (
      e: TouchEvent,
      type: "pinch" | "pinchstart" | "pinchend",
      scale: number,
      centerX: number,
      centerY: number
    ): void => {
      const extendedPinchEvent = createPinchEvent(
        e,
        type,
        scale,
        centerX,
        centerY
      );

      // Call each handler for this type
      handlers[type].forEach((handler) => {
        try {
          // Type assertion for the handler call
          handler(extendedPinchEvent as unknown as PinchEvent);
        } catch (error) {
          console.error(`Error in ${type} handler:`, error);
        }
      });

      // Forward to component's event system if available
      if (hasEmit(component)) {
        component.emit(type, extendedPinchEvent);
      }

      // Apply preventDefault if configured
      if (preventDefault && !extendedPinchEvent.defaultPrevented) {
        extendedPinchEvent.preventDefault();
      }
    };

    /**
     * Handle touch start
     */
    const handleTouchStart = (e: TouchEvent): void => {
      if (!isEnabled || e.touches.length !== 2) return;

      // Calculate initial distance between touch points
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      startDistance = getDistance(
        touch1.clientX,
        touch1.clientY,
        touch2.clientX,
        touch2.clientY
      );

      startTime = Date.now();
      lastScale = 1;
      isPinching = false;
    };

    /**
     * Handle touch move
     */
    const handleTouchMove = (e: TouchEvent): void => {
      if (!isEnabled || e.touches.length !== 2 || startDistance === 0) return;

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Calculate current distance and scale
      const currentDistance = getDistance(
        touch1.clientX,
        touch1.clientY,
        touch2.clientX,
        touch2.clientY
      );

      const scale = currentDistance / startDistance;
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      // Check if scale change is significant enough
      const scaleDiff = Math.abs(scale - lastScale);
      const SCALE_THRESHOLD = 0.01;

      if (scaleDiff > SCALE_THRESHOLD) {
        // Start pinch if this is the first significant scale change
        if (!isPinching) {
          isPinching = true;
          dispatchPinchEvent(e, "pinchstart", scale, centerX, centerY);
        }

        // Dispatch continuous pinch event
        dispatchPinchEvent(e, "pinch", scale, centerX, centerY);
        lastScale = scale;
      }
    };

    /**
     * Handle touch end
     */
    const handleTouchEnd = (e: TouchEvent): void => {
      if (!isEnabled || !isPinching) return;

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

      // Dispatch pinch end event
      dispatchPinchEvent(e, "pinchend", lastScale, centerX, centerY);

      // Reset state
      startDistance = 0;
      isPinching = false;
    };

    /**
     * Handle touch cancel
     */
    const handleTouchCancel = (e: TouchEvent): void => {
      if (!isEnabled || !isPinching) return;

      // Calculate final center point
      let centerX = 0;
      let centerY = 0;

      if (e.touches.length > 0) {
        centerX = e.touches[0].clientX;
        centerY = e.touches[0].clientY;
      }

      // Dispatch pinch end event
      dispatchPinchEvent(e, "pinchend", lastScale, centerX, centerY);

      // Reset state
      startDistance = 0;
      isPinching = false;
    };

    // Event listeners dictionary
    const eventListeners: Record<string, EventListener> = {
      touchstart: handleTouchStart as EventListener,
      touchmove: handleTouchMove as EventListener,
      touchend: handleTouchEnd as EventListener,
      touchcancel: handleTouchCancel as EventListener,
    };

    /**
     * Add event listeners to element
     */
    const setupEventListeners = (): void => {
      if (!isTouchSupported) return;

      Object.entries(eventListeners).forEach(([event, listener]) => {
        component.element.addEventListener(event, listener, {
          passive: !preventDefault,
        });
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
    if (hasLifecycle(component)) {
      const originalDestroy = component.lifecycle.destroy;

      component.lifecycle.destroy = () => {
        // Clean up event listeners
        removeEventListeners();

        // Clear handlers
        Object.values(handlers).forEach((handlerSet) => handlerSet.clear());

        // Call original destroy method
        originalDestroy.call(component.lifecycle);
      };
    }

    // Create enhanced component
    return {
      ...component,

      // Add handler methods
      onPinch(handler: (event: PinchEvent) => void) {
        handlers.pinch.add(handler);
        return this;
      },

      onPinchStart(handler: (event: PinchEvent) => void) {
        handlers.pinchstart.add(handler);
        return this;
      },

      onPinchEnd(handler: (event: PinchEvent) => void) {
        handlers.pinchend.add(handler);
        return this;
      },

      // Remove handler methods
      offPinch(handler: (event: PinchEvent) => void) {
        handlers.pinch.delete(handler);
        return this;
      },

      offPinchStart(handler: (event: PinchEvent) => void) {
        handlers.pinchstart.delete(handler);
        return this;
      },

      offPinchEnd(handler: (event: PinchEvent) => void) {
        handlers.pinchend.delete(handler);
        return this;
      },

      // Enable/disable methods
      enablePinch() {
        if (!isEnabled) {
          isEnabled = true;
          setupEventListeners();
        }
        return this;
      },

      disablePinch() {
        if (isEnabled) {
          isEnabled = false;
          removeEventListeners();
        }
        return this;
      },

      // Support check method
      isPinchSupported() {
        return isTouchSupported;
      },
    };
  };
