// src/components/fab/api.ts
import { FabComponent } from './types';

/**
 * API configuration options for the FAB component
 * 
 * @category Components
 * @internal
 */
interface ApiOptions {
  /**
   * Disabled state management API
   */
  disabled: {
    /** Enables the component */
    enable: () => void;
    /** Disables the component */
    disable: () => void;
  };
  
  /**
   * Lifecycle management API
   */
  lifecycle: {
    /** Destroys the component */
    destroy: () => void;
  };
  
  /**
   * Base class name for the FAB
   */
  className: string;
}

/**
 * Base component with element properties
 * 
 * @category Components
 * @internal
 */
interface ComponentWithElements {
  /** The DOM element */
  element: HTMLElement;
  
  /** Icon management */
  icon: {
    /** Sets icon HTML content */
    setIcon: (html: string) => any;
    /** Gets icon HTML content */
    getIcon: () => string;
    /** Gets icon DOM element */
    getElement: () => HTMLElement | null;
  };
  
  /** Gets a class name with component's prefix */
  getClass: (name: string) => string;
}

/**
 * Enhances a FAB component with public API methods
 * 
 * Higher-order function that adds the full public API to the FAB component,
 * exposing methods for changing appearance, handling state, and managing position.
 * 
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * 
 * @category Components
 * @internal
 */
export const withAPI = ({ disabled, lifecycle, className }: ApiOptions) => 
  (component: ComponentWithElements): FabComponent => ({
    ...component as any,
    element: component.element as HTMLButtonElement,
    
    getValue: () => component.element.value,
    
    setValue(value: string) {
      component.element.value = value;
      return this;
    },
    
    enable() {
      disabled.enable();
      return this;
    },
    
    disable() {
      disabled.disable();
      return this;
    },
    
    setIcon(icon: string) {
      component.icon.setIcon(icon);
      return this;
    },
    
    getIcon() {
      return component.icon.getIcon();
    },
    
    setPosition(position: string) {
      // First remove any existing position classes
      const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
      positions.forEach(pos => {
        component.element.classList.remove(`${className}--${pos}`);
      });
      
      // Add new position class
      component.element.classList.add(`${className}--${position}`);
      return this;
    },
    
    getPosition() {
      const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
      for (const pos of positions) {
        if (component.element.classList.contains(`${className}--${pos}`)) {
          return pos;
        }
      }
      return null;
    },
    
    lower() {
      component.element.classList.add(`${className}--lowered`);
      return this;
    },
    
    raise() {
      component.element.classList.remove(`${className}--lowered`);
      return this;
    },
    
    destroy() {
      lifecycle.destroy();
    }
  });