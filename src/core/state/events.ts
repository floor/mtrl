// src/core/state/events.ts

/**
 * Event manager interface for handling component events
 */
export interface EventManagerState {
  /**
   * Adds an event listener
   * @param event - Event name
   * @param handler - Event handler
   * @returns EventManagerState instance for chaining
   */
  on: (event: string, handler: (...args: any[]) => void) => EventManagerState;
  
  /**
   * Removes an event listener
   * @param event - Event name
   * @param handler - Event handler
   * @returns EventManagerState instance for chaining
   */
  off: (event: string, handler: (...args: any[]) => void) => EventManagerState;
  
  /**
   * Removes all event listeners and cleans up
   */
  destroy: () => void;
  
  /**
   * Gets all active handlers
   * @returns Map of event names to handlers
   */
  getHandlers: () => Map<(...args: any[]) => void, string>;
}

/**
 * Creates an event manager for a component
 * Simple event handling mechanism for components
 * 
 * @param element - Component's DOM element
 * @returns Event manager interface
 */
export const createEventManager = (element: HTMLElement): EventManagerState => {
  const handlers = new Map<(...args: any[]) => void, string>();

  return {
    /**
     * Adds an event listener
     * @param event - Event name
     * @param handler - Event handler
     * @returns EventManagerState instance for chaining
     */
    on(event: string, handler: (...args: any[]) => void): EventManagerState {
      element.addEventListener(event, handler as EventListener);
      handlers.set(handler, event);
      return this;
    },

    /**
     * Removes an event listener
     * @param event - Event name
     * @param handler - Event handler
     * @returns EventManagerState instance for chaining
     */
    off(event: string, handler: (...args: any[]) => void): EventManagerState {
      element.removeEventListener(event, handler as EventListener);
      handlers.delete(handler);
      return this;
    },

    /**
     * Removes all event listeners and cleans up
     */
    destroy(): void {
      handlers.forEach((event, handler) => {
        element.removeEventListener(event, handler as EventListener);
      });
      handlers.clear();
    },

    /**
     * Gets all active handlers
     * @returns Map of handlers to event names
     */
    getHandlers(): Map<(...args: any[]) => void, string> {
      return new Map(handlers);
    }
  };
};