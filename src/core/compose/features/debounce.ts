// src/core/compose/features/debounce.ts
/**
 * @module core/compose/features
 * @description Adds debounced event handling capabilities to components
 */

import { BaseComponent, ElementComponent } from '../component';
import { debounce } from '../../utils/performance';

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
  
  [key: string]: any;
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
export const withDebounce = (config: DebounceConfig = {}) => 
  <C extends ElementComponent>(component: C): C & DebounceComponent => {
    // Store debounced handlers for cleanup
    const debouncedHandlers: Record<string, {
      original: (event: Event) => void;
      debounced: EventListener;
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
        debounced: debounced as EventListener
      };
      
      return enhancedComponent;
    };
    
    /**
     * Removes a debounced event listener
     */
    const removeDebouncedEvent = (event: string): C & DebounceComponent => {
      const handler = debouncedHandlers[event];
      
      if (handler) {
        component.element.removeEventListener(event, handler.debounced);
        delete debouncedHandlers[event];
      }
      
      return enhancedComponent;
    };
    
    // Handle lifecycle integration if available
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      
      component.lifecycle.destroy = () => {
        // Remove all debounced event listeners
        Object.keys(debouncedHandlers).forEach(event => {
          const handler = debouncedHandlers[event];
          component.element.removeEventListener(event, handler.debounced);
        });
        
        // Call original destroy method
        originalDestroy.call(component.lifecycle);
      };
    }
    
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
    
    // Create enhanced component
    const enhancedComponent = {
      ...component,
      addDebouncedEvent,
      removeDebouncedEvent
    };
    
    return enhancedComponent;
  };

export default withDebounce;