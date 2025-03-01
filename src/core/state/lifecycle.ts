// src/core/state/lifecycle.ts

import { createEmitter, Emitter } from './emitter';

/**
 * Component managers that can be managed by the lifecycle
 */
export interface LifecycleManagers {
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
 * Lifecycle manager interface
 */
export interface LifecycleManager {
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
   * @returns true if mounted
   */
  isMounted: () => boolean;
  
  /**
   * Destroys the component
   */
  destroy: () => void;
}

/**
 * Creates a lifecycle manager for a component
 * 
 * @param element - Component's DOM element
 * @param managers - Optional component managers to integrate with lifecycle
 * @returns Lifecycle manager interface
 */
export const createLifecycle = (
  element: HTMLElement, 
  managers: LifecycleManagers = {}
): LifecycleManager => {
  let mounted = false;
  const emitter: Emitter = createEmitter();

  return {
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
      if (managers.events) {
        managers.events.destroy();
      }
      
      // Clean up text element
      if (managers.text) {
        const textElement = managers.text.getElement();
        if (textElement) {
          textElement.remove();
        }
      }
      
      // Clean up icon element
      if (managers.icon) {
        const iconElement = managers.icon.getElement();
        if (iconElement) {
          iconElement.remove();
        }
      }
      
      // Remove the main element
      if (element) {
        element.remove();
      }
    }
  };
};