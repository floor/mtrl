// src/core/compose/features/lifecycle.ts

import { getCleanup } from '../cleanup';
import { createEmitter, Emitter } from '../../state/emitter';
import { BaseComponent, ElementComponent } from '../component';

/**
 * Component with events manager
 */
interface ComponentWithEvents extends ElementComponent {
  events: {
    destroy: () => void;
  };
}

/**
 * Component with text manager
 */
interface ComponentWithText extends ElementComponent {
  text: {
    getElement: () => HTMLElement | null;
  };
}

/**
 * Component with icon manager
 */
interface ComponentWithIcon extends ElementComponent {
  icon: {
    getElement: () => HTMLElement | null;
  };
}

/**
 * Type guards for component managers
 */
function hasEvents(component: object): component is ComponentWithEvents {
  return 'events' in component && 
         typeof component.events === 'object' &&
         component.events !== null &&
         'destroy' in component.events &&
         typeof component.events.destroy === 'function';
}

function hasText(component: object): component is ComponentWithText {
  return 'text' in component && 
         typeof component.text === 'object' &&
         component.text !== null &&
         'getElement' in component.text &&
         typeof component.text.getElement === 'function';
}

function hasIcon(component: object): component is ComponentWithIcon {
  return 'icon' in component && 
         typeof component.icon === 'object' &&
         component.icon !== null &&
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
  [key: string]: unknown;
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
  // The element and its destroy are optional: a component without them still gets a lifecycle.
  <T extends BaseComponent & Partial<Pick<ElementComponent, 'element' | 'destroy'>>>(
    component: T
  ): T & LifecycleComponent => {
    const resources = getCleanup(component);
    let mounted = false;
    let destroyed = false;
    const destroyElement = component.destroy?.bind(component);
    const emitter: Emitter = createEmitter();
    resources.add(() => emitter.clear());
    
    const lifecycle: Lifecycle = {
      // Mount/Unmount state management
      onMount: (handler: () => void) => emitter.on('mount', handler),
      onUnmount: (handler: () => void) => emitter.on('unmount', handler),
      
      mount: () => {
        if (!mounted && !destroyed) {
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
        if (destroyed) return;
        destroyed = true;
        // First trigger unmount
        if (mounted) {
          this.unmount();
        }

        emitter.clear();
        resources.destroy();

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
        if (destroyElement) destroyElement();
        else component.element?.remove();
      }
    };

    return {
      ...component,
      lifecycle
    };
  };