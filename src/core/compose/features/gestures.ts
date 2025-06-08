// src/core/compose/features/gestures.ts
/**
 * @module core/compose/features
 * @description Adds gesture recognition capabilities to components
 */

import { BaseComponent, ElementComponent } from "../component";
import {
  createGestureManager,
  GestureManager,
  GestureConfig,
  GestureHandler,
  AnyGestureEvent,
} from "../../gestures";
import { hasLifecycle, hasEmit } from "../utils/type-guards";

/**
 * Configuration for gestures feature
 */
export interface GesturesFeatureConfig extends GestureConfig {
  /**
   * Whether to enable gesture recognition immediately
   * @default true
   */
  enableGestures?: boolean;

  /**
   * Initial gesture event handlers
   */
  gestureHandlers?: Record<string, GestureHandler>;

  [key: string]: any;
}

/**
 * Component with gesture recognition capabilities
 */
export interface GesturesComponent extends BaseComponent {
  /**
   * Gesture manager instance
   */
  gestures: GestureManager;

  /**
   * Add a gesture event handler
   * @param eventType - Type of gesture event
   * @param handler - Event handler function
   * @returns GesturesComponent for chaining
   */
  onGesture: (eventType: string, handler: GestureHandler) => GesturesComponent;

  /**
   * Remove a gesture event handler
   * @param eventType - Type of gesture event
   * @param handler - Event handler function
   * @returns GesturesComponent for chaining
   */
  offGesture: (eventType: string, handler: GestureHandler) => GesturesComponent;

  /**
   * Check if a gesture type is supported on the current device
   * @param gestureType - Type of gesture to check
   * @returns Whether the gesture is supported
   */
  isGestureSupported: (gestureType: string) => boolean;

  /**
   * Enable gesture recognition
   * @returns GesturesComponent for chaining
   */
  enableGestures: () => GesturesComponent;

  /**
   * Disable gesture recognition
   * @returns GesturesComponent for chaining
   */
  disableGestures: () => GesturesComponent;
}

/**
 * Adds gesture recognition capabilities to a component.
 * This is a comprehensive gesture feature that adds support for all gesture types.
 * For more lightweight, specific gestures, use the individual gesture features.
 *
 * @param config - Configuration object containing gesture settings
 * @returns Function that enhances a component with gesture capabilities
 *
 * @example
 * ```ts
 * // Add gesture recognition to a component
 * const component = pipe(
 *   createBase,
 *   withElement(...),
 *   withGestures({
 *     swipeThreshold: 50,
 *     gestureHandlers: {
 *       'tap': (e) => handleTap(e),
 *       'swipeleft': (e) => navigateForward(e),
 *       'swiperight': (e) => navigateBack(e)
 *     }
 *   })
 * )(config);
 * ```
 */
export const withGestures =
  (config: GesturesFeatureConfig = {}) =>
  <C extends ElementComponent>(component: C): C & GesturesComponent => {
    if (!component.element) {
      console.warn("Cannot add gesture recognition: missing element");
      return component as C & GesturesComponent;
    }

    // Default configuration
    const {
      enableGestures = true,
      gestureHandlers = {},
      ...gestureConfig
    } = config;

    // Create gesture manager
    const gestureManager = createGestureManager(
      component.element,
      gestureConfig
    );

    // Add initial gesture handlers
    Object.entries(gestureHandlers).forEach(([eventType, handler]) => {
      gestureManager.on(eventType, handler);
    });

    // Enable/disable based on config
    if (!enableGestures) {
      gestureManager.disable();
    }

    // Connect with existing event system if available
    if (hasEmit(component)) {
      // Forward gesture events to the component's event system
      const forwardGestureEvents = (event: AnyGestureEvent) => {
        component.emit(event.type, event);
      };

      // Register forwarder for common gesture types
      [
        "tap",
        "swipe",
        "swipeleft",
        "swiperight",
        "swipeup",
        "swipedown",
        "longpress",
        "pinch",
        "rotate",
        "pan",
      ].forEach((type) => {
        gestureManager.on(type, forwardGestureEvents);
      });
    }

    // Handle lifecycle integration
    if (hasLifecycle(component)) {
      const originalDestroy = component.lifecycle.destroy;

      component.lifecycle.destroy = () => {
        // Clean up gesture manager
        gestureManager.destroy();

        // Call original destroy method
        originalDestroy.call(component.lifecycle);
      };
    }

    // Create enhanced component
    return {
      ...component,
      gestures: gestureManager,

      /**
       * Add a gesture event handler
       * @param eventType - Type of gesture event
       * @param handler - Event handler function
       * @returns GesturesComponent for chaining
       */
      onGesture(eventType: string, handler: GestureHandler) {
        gestureManager.on(eventType, handler);
        return this;
      },

      /**
       * Remove a gesture event handler
       * @param eventType - Type of gesture event
       * @param handler - Event handler function
       * @returns GesturesComponent for chaining
       */
      offGesture(eventType: string, handler: GestureHandler) {
        gestureManager.off(eventType, handler);
        return this;
      },

      /**
       * Check if a gesture type is supported on the current device
       * @param gestureType - Type of gesture to check
       * @returns Whether the gesture is supported
       */
      isGestureSupported(gestureType: string) {
        return gestureManager.isSupported(gestureType);
      },

      /**
       * Enable gesture recognition
       * @returns GesturesComponent for chaining
       */
      enableGestures() {
        gestureManager.enable();
        return this;
      },

      /**
       * Disable gesture recognition
       * @returns GesturesComponent for chaining
       */
      disableGestures() {
        gestureManager.disable();
        return this;
      },
    };
  };
