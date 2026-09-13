import { getCleanup } from "../cleanup";
import type { Cancellable } from "../../utils/performance";
// src/core/compose/features/throttle.ts
/**
 * @module core/compose/features
 * @description Adds throttled event handling capabilities to components
 */

import { BaseComponent, ElementComponent } from "../component";
import { throttle } from "../../utils/performance";


/**
 * Configuration for throttled event handlers
 */
export interface ThrottleConfig {
  /**
   * Event handlers with throttle settings
   */
  throttledEvents?: Record<
    string,
    {
      handler: (event: Event) => void;
      wait: number;
      options?: { leading?: boolean; trailing?: boolean };
    }
  >;

  [key: string]: any;
}

/**
 * Component with throttled event capabilities
 */
export interface ThrottleComponent extends BaseComponent {
  /**
   * Adds a throttled event listener
   * @param event - Event name
   * @param handler - Event handler
   * @param wait - Throttle interval in milliseconds
   * @param options - Throttle options
   * @returns ThrottleComponent for chaining
   */
  addThrottledEvent: (
    event: string,
    handler: (event: Event) => void,
    wait: number,
    options?: { leading?: boolean; trailing?: boolean }
  ) => ThrottleComponent;

  /**
   * Removes a throttled event listener
   * @param event - Event name
   * @returns ThrottleComponent for chaining
   */
  removeThrottledEvent: (event: string) => ThrottleComponent;
}

/**
 * Adds throttled event handling capabilities to a component
 *
 * @param config - Configuration object containing throttled event settings
 * @returns Function that enhances a component with throttled event handling
 *
 * @example
 * ```ts
 * // Add throttled events to a component
 * const component = pipe(
 *   createBase,
 *   withElement(...),
 *   withThrottle({
 *     throttledEvents: {
 *       'scroll': {
 *         handler: (e) => updateScrollPosition(e),
 *         wait: 100
 *       },
 *       'mousemove': {
 *         handler: handleMouseMove,
 *         wait: 50,
 *         options: { leading: true, trailing: false }
 *       }
 *     }
 *   })
 * )(config);
 * ```
 */
export const withThrottle =
  (config: ThrottleConfig = {}) =>
  <C extends ElementComponent>(component: C): C & ThrottleComponent => {
    // Store throttled handlers for cleanup
    const throttledHandlers: Record<
      string,
      {
        original: (event: Event) => void;
        throttled: Cancellable<EventListener>;
      }
    > = {};

    /**
     * Adds a throttled event listener to the component's element
     */
    const addThrottledEvent = (
      event: string,
      handler: (event: Event) => void,
      wait: number,
      options: { leading?: boolean; trailing?: boolean } = {}
    ): C & ThrottleComponent => {
      if (resources.destroyed) return enhancedComponent;
      // Remove existing handler if any
      if (throttledHandlers[event]) {
        removeThrottledEvent(event);
      }

      // Create throttled handler
      const throttled = throttle(handler, wait, options);

      // Add event listener
      component.element.addEventListener(event, throttled as EventListener);

      // Store for later cleanup
      throttledHandlers[event] = {
        original: handler,
        throttled: throttled as Cancellable<EventListener>,
      };

      return enhancedComponent;
    };

    /**
     * Removes a throttled event listener
     */
    const removeThrottledEvent = (event: string): C & ThrottleComponent => {
      const handler = throttledHandlers[event];

      if (handler) {
        handler.throttled.cancel();
        component.element.removeEventListener(event, handler.throttled);
        delete throttledHandlers[event];
      }

      return enhancedComponent;
    };

    const resources = getCleanup(component);
    resources.add(() => {
      Object.keys(throttledHandlers).forEach(event => removeThrottledEvent(event));
    });

    // Create enhanced component
    const enhancedComponent = {
      ...component,
      addThrottledEvent,
      removeThrottledEvent,
    };

    // Initialize with config
    if (config.throttledEvents) {
      Object.entries(config.throttledEvents).forEach(([event, settings]) => {
        addThrottledEvent(
          event,
          settings.handler,
          settings.wait,
          settings.options
        );
      });
    }

    return enhancedComponent;
  };

export default withThrottle;
