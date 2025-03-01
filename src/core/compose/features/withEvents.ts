// src/core/compose/features/withEvents.ts

import { createEventManager } from '../../state/events';
import { BaseComponent, ElementComponent } from '../component';

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
  removeListeners: (listeners: Record<string, Function>) => EnhancedEventManager;
  
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
  on: (event: string, handler: Function) => EnhancedEventComponent;
  off: (event: string, handler: Function) => EnhancedEventComponent;
}

/**
 * Adds enhanced event handling capabilities to a component
 * 
 * @param target - Optional custom event target
 * @returns Function that enhances a component with event capabilities
 */
export const withEvents = (target?: HTMLElement) => 
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
          events.on(event, handler as any);
        });
        return this;
      },

      /**
       * Remove multiple event listeners at once
       * @param listeners - Map of event types to handlers
       */
      removeListeners(listeners: Record<string, Function>) {
        Object.entries(listeners).forEach(([event, handler]) => {
          events.off(event, handler as any);
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
          events.off(event, wrappedHandler as any);
        };
        events.on(event, wrappedHandler as any);
        return this;
      },

      /**
       * Add an event listener
       */
      on(event: string, handler: Function) {
        events.on(event, handler as any);
        return this;
      },

      /**
       * Remove an event listener
       */
      off(event: string, handler: Function) {
        events.off(event, handler as any);
        return this;
      },

      /**
       * Clean up all event listeners
       */
      destroy() {
        events.destroy();
      }
    };

    // Add lifecycle integration
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        events.destroy();
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      events: enhancedEvents,
      on: enhancedEvents.on.bind(enhancedEvents),
      off: enhancedEvents.off.bind(enhancedEvents)
    };
  };