// src/core/dom/events.ts
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

/**
 * Event manager interface for handling DOM events
 */
export interface EventManager {
  /**
   * Add an event listener with options
   * @param event - Event name
   * @param handler - Event handler
   * @param options - addEventListener options
   * @returns EventManager instance for chaining
   */
  on: <T extends Event>(event: string, handler: (e: T) => void, options?: AddEventListenerOptions) => EventManager;
  
  /**
   * Remove an event listener
   * @param event - Event name
   * @param handler - Event handler
   * @returns EventManager instance for chaining
   */
  off: <T extends Event>(event: string, handler: (e: T) => void) => EventManager;
  
  /**
   * Temporarily disable all event listeners
   * @returns EventManager instance for chaining
   */
  pause: () => EventManager;
  
  /**
   * Re-enable all event listeners
   * @returns EventManager instance for chaining
   */
  resume: () => EventManager;
  
  /**
   * Remove all event listeners and clean up
   */
  destroy: () => void;
  
  /**
   * Get all active handlers
   * @returns Map of active handlers
   */
  getHandlers: () => Map<string, HandlerInfo>;
  
  /**
   * Check if a specific handler exists
   * @param event - Event name
   * @param handler - Event handler
   * @returns Whether handler exists
   */
  hasHandler: <T extends Event>(event: string, handler: (e: T) => void) => boolean;
}

/**
 * Handler information
 */
interface HandlerInfo {
  original: EventListener;
  enhanced: EventListener;
  event: string;
  options: AddEventListenerOptions;
}

/**
 * Creates an event manager to handle DOM events with enhanced functionality.
 * Provides a robust interface for managing event listeners with error handling,
 * cleanup, and lifecycle management.
 *
 * @param element - DOM element to attach events to
 * @returns Event manager interface
 */
export const createEventManager = (element: HTMLElement): EventManager => {
  // Store handlers with their metadata
  const handlers = new Map<string, HandlerInfo>();

  /**
   * Creates a unique handler identifier
   * @param event - Event name
   * @param handler - EventListener
   * @returns Unique identifier
   */
  const createHandlerId = (event: string, handler: EventListener): string =>
    `${event}_${handler.toString()}`;

  /**
   * Wraps an event handler with error boundary and logging
   * @param handler - Original event handler
   * @param event - Event name for error context
   * @returns Enhanced handler with error boundary
   */
  const enhanceHandler = (handler: EventListener, event: string): EventListener => (e: Event) => {
    try {
      handler(e);
    } catch (error) {
      console.error(`Error in ${event} handler:`, error);
    }
  };

  /**
   * Safely removes event listener
   * @param event - Event name
   * @param handler - Event handler
   */
  const safeRemoveListener = (event: string, handler: EventListener): void => {
    try {
      element.removeEventListener(event, handler);
    } catch (error) {
      console.warn(`Failed to remove ${event} listener:`, error);
    }
  };

  return {
    /**
     * Adds an event listener with options
     * @param event - Event name
     * @param handler - Event handler
     * @param options - addEventListener options
     * @returns EventManager instance for chaining
     */
    on<T extends Event>(event: string, handler: (e: T) => void, options: AddEventListenerOptions = {}): EventManager {
      const enhanced = enhanceHandler(handler as EventListener, event);
      const id = createHandlerId(event, handler as EventListener);

      handlers.set(id, {
        original: handler as EventListener,
        enhanced,
        event,
        options
      });

      element.addEventListener(event, enhanced, options);
      return this;
    },

    /**
     * Removes an event listener
     * @param event - Event name
     * @param handler - Event handler
     * @returns EventManager instance for chaining
     */
    off<T extends Event>(event: string, handler: (e: T) => void): EventManager {
      const id = createHandlerId(event, handler as EventListener);
      const stored = handlers.get(id);

      if (stored) {
        safeRemoveListener(event, stored.enhanced);
        handlers.delete(id);
      }
      return this;
    },

    /**
     * Temporarily disables all event listeners
     * @returns EventManager instance for chaining
     */
    pause(): EventManager {
      handlers.forEach(({ enhanced, event }) => {
        safeRemoveListener(event, enhanced);
      });
      return this;
    },

    /**
     * Re-enables all event listeners
     * @returns EventManager instance for chaining
     */
    resume(): EventManager {
      handlers.forEach(({ enhanced, event, options }) => {
        element.addEventListener(event, enhanced, options);
      });
      return this;
    },

    /**
     * Removes all event listeners and cleans up
     */
    destroy(): void {
      handlers.forEach(({ enhanced, event }) => {
        safeRemoveListener(event, enhanced);
      });
      handlers.clear();
    },

    /**
     * Gets all active handlers
     * @returns Map of active handlers
     */
    getHandlers(): Map<string, HandlerInfo> {
      return new Map(handlers);
    },

    /**
     * Checks if a specific handler exists
     * @param event - Event name
     * @param handler - Event handler
     * @returns Whether handler exists
     */
    hasHandler<T extends Event>(event: string, handler: (e: T) => void): boolean {
      const id = createHandlerId(event, handler as EventListener);
      return handlers.has(id);
    }
  };
};