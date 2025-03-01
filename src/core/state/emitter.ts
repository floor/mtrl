// src/core/state/emitter.ts
/**
 * @module core/state
 */

/**
 * Type definition for event callback functions
 */
export type EventCallback = (...args: any[]) => void;

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
  emit(event: string, ...args: any[]): void;
  
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
    emit: (event: string, ...args: any[]): void => {
      const callbacks = events.get(event) || [];
      callbacks.forEach(cb => cb(...args));
    },

    /**
     * Clear all event listeners
     */
    clear: (): void => {
      events.clear();
    }
  };
};