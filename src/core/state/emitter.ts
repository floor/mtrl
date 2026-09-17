// src/core/state/emitter.ts
/**
 * @module core/state
 */

/**
 * Type definition for event callback functions
 */
export type EventCallback = (...args: never[]) => void;

/**
 * Interface for the event emitter
 */
export interface Emitter {
  /**
   * Subscribe to an event
   * @param event - Event name
   * @param callback - Event handler
   * @returns Unsubscribe function
   */
  on(event: string, callback: EventCallback): () => void;
  
  /**
   * Unsubscribe from an event
   * @param event - Event name
   * @param callback - Event handler to remove
   */
  off(event: string, callback: EventCallback): void;
  
  /**
   * Emit an event
   * @param event - Event name
   * @param args - Event arguments
   */
  emit(event: string, ...args: unknown[]): void;
  
  /**
   * Clear all event listeners
   */
  clear(): void;
}

/**
 * Creates an event emitter with subscription management
 * @returns Event emitter interface
 */
export const createEmitter = (): Emitter => {
  const events = new Map<string, EventCallback[]>();

  return {
    /**
     * Subscribe to an event
     * @param event - Event name
     * @param callback - Event handler
     * @returns Unsubscribe function
     */
    on: (event: string, callback: EventCallback): (() => void) => {
      const callbacks = events.get(event) || [];
      events.set(event, [...callbacks, callback]);

      return () => {
        const callbacks = events.get(event) || [];
        events.set(event, callbacks.filter(cb => cb !== callback));
      };
    },

    /**
     * Unsubscribe from an event
     * @param event - Event name 
     * @param callback - Event handler to remove
     */
    off(event: string, callback: EventCallback): void {
      const callbacks = events.get(event) || [];
      events.set(event, callbacks.filter(cb => cb !== callback));
    },

    /**
     * Emit an event
     * @param event - Event name
     * @param args - Event arguments
     */
    emit: (event: string, ...args: unknown[]): void => {
      const callbacks = events.get(event) || [];
      // Each listener runs on its own: one that throws is reported and the
      // rest still run. Before, a throwing consumer aborted every later
      // listener, and on the lifecycle's unmount that stopped teardown
      // part-way and leaked DOM.
      callbacks.forEach(cb => {
        try {
          // Callbacks declare their own argument types; emit forwards whatever it receives
          (cb as (...args: unknown[]) => void)(...args);
        } catch (error) {
          console.error(`A listener for "${event}" threw:`, error);
        }
      });
    },

    /**
     * Clear all event listeners
     */
    clear: (): void => {
      events.clear();
    }
  };
};