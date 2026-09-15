import { getCleanup } from "../cleanup";
import type { Cancellable } from "../../utils/performance";
// src/core/compose/features/debounce.ts
/**
 * @module core/compose/features
 * @description Adds debounced event handling capabilities to components
 */

import { BaseComponent, ElementComponent } from '../component';
import { debounce } from '../../utils/performance';

/**
 * Interface for components with lifecycle
 */
export interface ComponentWithLifecycle extends ElementComponent {
  lifecycle: {
    destroy: () => void;
    [key: string]: unknown;
  };
}

/**
 * Configuration for debounced event handlers
 */
export interface DebounceConfig {
  /**
   * Event handlers with debounce settings
   */
  debouncedEvents?: Record<string, {
    handler: (event: Event) => void;
    wait: number;
    options?: { leading?: boolean; maxWait?: number };
  }>;
}

/**
 * Component with debounced event capabilities
 */
export interface DebounceComponent extends BaseComponent {
  /**
   * Adds a debounced event listener
   * @param event - Event name
   * @param handler - Event handler
   * @param wait - Debounce delay in milliseconds
   * @param options - Debounce options
   * @returns DebounceComponent for chaining
   */
  addDebouncedEvent: (
    event: string,
    handler: (event: Event) => void,
    wait: number,
    options?: { leading?: boolean; maxWait?: number }
  ) => DebounceComponent;
  
  /**
   * Removes a debounced event listener
   * @param event - Event name
   * @returns DebounceComponent for chaining
   */
  removeDebouncedEvent: (event: string) => DebounceComponent;
}

/**
 * Adds debounced event handling capabilities to a component
 * 
 * @param config - Configuration object containing debounced event settings
 * @returns Function that enhances a component with debounced event handling
 * 
 * @example
 * ```ts
 * // Add debounced events to a component
 * const component = pipe(
 *   createBase,
 *   withElement(...),
 *   withDebounce({
 *     debouncedEvents: {
 *       'input': {
 *         handler: handleInput,
 *         wait: 300
 *       },
 *       'resize': {
 *         handler: handleResize,
 *         wait: 200,
 *         options: { maxWait: 1000 }
 *       }
 *     }
 *   })
 * )(config);
 * ```
 */
// `& object` lets a component config that shares no key with DebounceConfig through.
export const withDebounce = <T extends DebounceConfig & object>(config: T = {} as T) => 
  <C extends ElementComponent>(component: C): C & DebounceComponent => {
    // Store debounced handlers for cleanup
    const debouncedHandlers: Record<string, {
      original: (event: Event) => void;
      debounced: Cancellable<EventListener>;
    }> = {};
    
    /**
     * Adds a debounced event listener to the component's element
     */
    const addDebouncedEvent = (
      event: string,
      handler: (event: Event) => void,
      wait: number,
      options: { leading?: boolean; maxWait?: number } = {}
    ): C & DebounceComponent => {
      if (resources.destroyed) return enhancedComponent;
      // Remove existing handler if any
      if (debouncedHandlers[event]) {
        removeDebouncedEvent(event);
      }
      
      // Create debounced handler
      const debounced = debounce(handler, wait, options);
      
      // Add event listener
      component.element.addEventListener(event, debounced as EventListener);
      
      // Store for later cleanup
      debouncedHandlers[event] = {
        original: handler,
        debounced: debounced as Cancellable<EventListener>
      };
      
      return enhancedComponent;
    };
    
    /**
     * Removes a debounced event listener
     */
    const removeDebouncedEvent = (event: string): C & DebounceComponent => {
      const handler = debouncedHandlers[event];
      
      if (handler) {
        handler.debounced.cancel();
        component.element.removeEventListener(event, handler.debounced);
        delete debouncedHandlers[event];
      }
      
      return enhancedComponent;
    };
    
    const resources = getCleanup(component);
    resources.add(() => {
      Object.keys(debouncedHandlers).forEach(event => removeDebouncedEvent(event));
    });

    // Create enhanced component
    const enhancedComponent = {
      ...component,
      addDebouncedEvent,
      removeDebouncedEvent
    };
    
    // Initialize with config
    if (config.debouncedEvents) {
      Object.entries(config.debouncedEvents).forEach(([event, settings]) => {
        addDebouncedEvent(
          event,
          settings.handler,
          settings.wait,
          settings.options
        );
      });
    }
    
    return enhancedComponent;
  };

export default withDebounce;