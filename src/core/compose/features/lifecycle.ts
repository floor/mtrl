// src/core/compose/features/lifecycle.ts

import { createEmitter, Emitter } from '../../state/emitter';
import { BaseComponent, ElementComponent } from '../component';

/**
 * Component with events manager
 */
interface ComponentWithEvents extends ElementComponent {
  events: {
    destroy: () => void;
    [key: string]: any;
  };
}

/**
 * Component with text manager
 */
interface ComponentWithText extends ElementComponent {
  text: {
    getElement: () => HTMLElement | null;
    [key: string]: any;
  };
}

/**
 * Component with icon manager
 */
interface ComponentWithIcon extends ElementComponent {
  icon: {
    getElement: () => HTMLElement | null;
    [key: string]: any;
  };
}

/**
 * Type guards for component managers
 */
function hasEvents(component: any): component is ComponentWithEvents {
  return 'events' in component && 
         component.events && 
         typeof component.events === 'object' &&
         'destroy' in component.events &&
         typeof component.events.destroy === 'function';
}

function hasText(component: any): component is ComponentWithText {
  return 'text' in component && 
         component.text && 
         typeof component.text === 'object' &&
         'getElement' in component.text &&
         typeof component.text.getElement === 'function';
}

function hasIcon(component: any): component is ComponentWithIcon {
  return 'icon' in component && 
         component.icon && 
         typeof component.icon === 'object' &&
         'getElement' in component.icon &&
         typeof component.icon.getElement === 'function';
}

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
        if (hasEvents(component)) {
          component.events.destroy();
        }
        
        // Clean up text element
        if (hasText(component)) {
          const textElement = component.text.getElement();
          if (textElement) {
            textElement.remove();
          }
        }
        
        // Clean up icon element
        if (hasIcon(component)) {
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