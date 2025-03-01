// src/core/compose/features/lifecycle.ts

import { createEmitter, Emitter } from '../../state/emitter';
import { BaseComponent, ElementComponent } from '../component';

/**
 * Component managers that can be passed to lifecycle
 */
export interface ComponentManagers {
  events?: {
    destroy: () => void;
  };
  text?: {
    getElement: () => HTMLElement | null;
  };
  icon?: {
    getElement: () => HTMLElement | null;
  };
  [key: string]: any;
}

/**
 * Lifecycle methods interface
 */
export interface Lifecycle {
  /**
   * Registers a handler for mount event
   * @param handler - Function to call when component is mounted
   * @returns Unsubscribe function
   */
  onMount: (handler: () => void) => () => void;
  
  /**
   * Registers a handler for unmount event
   * @param handler - Function to call when component is unmounted
   * @returns Unsubscribe function
   */
  onUnmount: (handler: () => void) => () => void;
  
  /**
   * Mounts the component
   */
  mount: () => void;
  
  /**
   * Unmounts the component
   */
  unmount: () => void;
  
  /**
   * Checks if component is mounted
   */
  isMounted: () => boolean;
  
  /**
   * Destroys the component
   */
  destroy: () => void;
}

/**
 * Component with lifecycle capabilities
 */
export interface LifecycleComponent extends BaseComponent {
  lifecycle: Lifecycle;
}

/**
 * Adds lifecycle management to a component
 * 
 * @returns Function that enhances a component with lifecycle management
 */
export const withLifecycle = () => 
  <T extends ElementComponent>(component: T): T & LifecycleComponent => {
    let mounted = false;
    const emitter: Emitter = createEmitter();
    
    const lifecycle: Lifecycle = {
      // Mount/Unmount state management
      onMount: (handler: () => void) => emitter.on('mount', handler),
      onUnmount: (handler: () => void) => emitter.on('unmount', handler),
      
      mount: () => {
        if (!mounted) {
          mounted = true;
          emitter.emit('mount');
        }
      },

      unmount: () => {
        if (mounted) {
          mounted = false;
          emitter.emit('unmount');
          emitter.clear();
        }
      },

      isMounted: () => mounted,

      // Cleanup and destruction
      destroy() {
        // First trigger unmount
        if (mounted) {
          this.unmount();
        }

        // Clean up all event listeners
        if ('events' in component && component.events?.destroy) {
          component.events.destroy();
        }
        
        // Clean up text element
        if ('text' in component && component.text?.getElement) {
          const textElement = component.text.getElement();
          if (textElement) {
            textElement.remove();
          }
        }
        
        // Clean up icon element
        if ('icon' in component && component.icon?.getElement) {
          const iconElement = component.icon.getElement();
          if (iconElement) {
            iconElement.remove();
          }
        }
        
        // Remove the main element
        if (component.element) {
          component.element.remove();
        }
      }
    };

    return {
      ...component,
      lifecycle
    };
  };