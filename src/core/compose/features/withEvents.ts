// src/core/compose/features/withEvents.ts

import { createEventManager, type EventManagerState } from "../../state/events";
import { BaseComponent, ElementComponent } from "../component";
import { getCleanup } from "../cleanup";

// The manager's listener type; this feature's public API takes any Function.
type Listener = Parameters<EventManagerState["on"]>[1];

/**
 * Event manager interface
 */
export interface EnhancedEventManager {
  /**
   * Add an event listener
   */
  on: (event: string, handler: Function) => EnhancedEventManager;

  /**
   * Remove an event listener
   */
  off: (event: string, handler: Function) => EnhancedEventManager;

  /**
   * Add multiple event listeners at once
   */
  addListeners: (listeners: Record<string, Function>) => EnhancedEventManager;

  /**
   * Remove multiple event listeners at once
   */
  removeListeners: (
    listeners: Record<string, Function>
  ) => EnhancedEventManager;

  /**
   * One-time event handler
   */
  once: (event: string, handler: Function) => EnhancedEventManager;

  /**
   * Clean up all event listeners
   */
  destroy: () => void;
}

/**
 * Component with enhanced event capabilities
 */
export interface EnhancedEventComponent extends BaseComponent {
  events: EnhancedEventManager;
  on(event: string, handler: Function): this;
  off(event: string, handler: Function): this;
}

/**
 * Adds enhanced event handling capabilities to a component
 *
 * @param target - Optional custom event target
 * @returns Function that enhances a component with event capabilities
 */
export const withEvents =
  (target?: HTMLElement) =>
  <C extends ElementComponent>(component: C): C & EnhancedEventComponent => {
    const events = createEventManager(target || component.element);

    // Enhanced event methods
    const enhancedEvents: EnhancedEventManager = {
      /**
       * Add multiple event listeners at once
       * @param listeners - Map of event types to handlers
       */
      addListeners(listeners: Record<string, Function>) {
        Object.entries(listeners).forEach(([event, handler]) => {
          events.on(event, handler as Listener);
        });
        return this;
      },

      /**
       * Remove multiple event listeners at once
       * @param listeners - Map of event types to handlers
       */
      removeListeners(listeners: Record<string, Function>) {
        Object.entries(listeners).forEach(([event, handler]) => {
          events.off(event, handler as Listener);
        });
        return this;
      },

      /**
       * One-time event handler
       * @param event - Event name
       * @param handler - Event handler
       */
      once(event: string, handler: Function) {
        const wrappedHandler = (e: Event) => {
          handler(e);
          events.off(event, wrappedHandler);
        };
        events.on(event, wrappedHandler);
        return this;
      },

      /**
       * Add an event listener
       */
      on(event: string, handler: Function) {
        events.on(event, handler as Listener);
        return this;
      },

      /**
       * Remove an event listener
       */
      off(event: string, handler: Function) {
        events.off(event, handler as Listener);
        return this;
      },

      /**
       * Clean up all event listeners
       */
      destroy() {
        events.destroy();
      },
    };

    const resources = getCleanup(component);
    resources.add(() => events.destroy());

    return {
      ...component,
      events: enhancedEvents,
      // Declared as returning the component, and `.bind` returned the manager.
      // Bivariance hid it; strictBindCallApply types `.bind` precisely and the
      // disagreement surfaces. The contract is the promise, so the runtime
      // keeps it -- the same correction as core's own withEvents in #119.
      on(event: string, handler: Function) {
        enhancedEvents.on(event, handler);
        return this;
      },
      off(event: string, handler: Function) {
        enhancedEvents.off(event, handler);
        return this;
      },
    };
  };
