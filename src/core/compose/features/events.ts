// src/core/compose/features/events.ts
/**
 * @module core/compose/features
 */

import { createEmitter, Emitter } from '../../state/emitter';
import { BaseComponent } from '../component';

/**
 * Component with event capabilities
 */
export interface EventComponent extends BaseComponent {
  /**
   * Subscribe to an event
   * @param event - Event name
   * @param handler - Event handler
   * @returns Component instance for chaining
   */
  on(event: string, handler: (...args: any[]) => void): EventComponent;
  
  /**
   * Unsubscribe from an event
   * @param event - Event name
   * @param handler - Event handler
   * @returns Component instance for chaining
   */
  off(event: string, handler: (...args: any[]) => void): EventComponent;
  
  /**
   * Emit an event
   * @param event - Event name
   * @param data - Event data
   * @returns Component instance for chaining
   */
  emit(event: string, data?: any): EventComponent;
}

/**
 * Adds event handling capabilities to a component
 * Returns event system ready to use immediately
 * 
 * @returns Function that enhances a component with event capabilities
 */
export const withEvents = () => 
  <T extends BaseComponent>(component: T): T & EventComponent => {
    const emitter: Emitter = createEmitter();

    return {
      ...component,
      on(event: string, handler: (...args: any[]) => void) {
        emitter.on(event, handler);
        return this;
      },

      off(event: string, handler: (...args: any[]) => void) {
        emitter.off(event, handler);
        return this;
      },

      emit(event: string, data?: any) {
        emitter.emit(event, data);
        return this;
      }
    };
  };