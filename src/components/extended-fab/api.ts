// src/components/extended-fab/api.ts
import { ExtendedFabComponent } from './types';

/**
 * API configuration options for the Extended FAB component
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
   * Text content management API
   */
  text: {
    /** Sets text content */
    setText: (text: string) => any;
    /** Gets text content */
    getText: () => string;
  };
  
  /**
   * Base class name for the Extended FAB
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
  
  /** Text management */
  text: {
    /** Sets text content */
    setText: (text: string) => any;
    /** Gets text content */
    getText: () => string;
    /** Gets text DOM element */
    getElement: () => HTMLElement | null;
  };
  
  /** Gets a class name with component's prefix */
  getClass: (name: string) => string;
}

/**
 * Enhances an Extended FAB component with public API methods
 * 
 * Higher-order function that adds the full public API to the Extended FAB component,
 * exposing methods for changing appearance, handling state, managing position,
 * and controlling the collapse/expand behavior.
 * 
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * 
 * @category Components
 * @internal This is an internal utility for the Extended FAB component
 */
export const withAPI = ({ disabled, lifecycle, text, className }: ApiOptions) => 
  (component: ComponentWithElements): ExtendedFabComponent => ({
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
    
    setText(newText: string) {
      text.setText(newText);
      return this;
    },
    
    getText() {
      return text.getText();
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
    
    collapse() {
      component.element.classList.add(`${className}--collapsed`);
      
      // Emit a custom event that can be listened to
      const event = new CustomEvent('collapse', { 
        bubbles: true, 
        cancelable: true 
      });
      component.element.dispatchEvent(event);
      
      return this;
    },
    
    expand() {
      component.element.classList.remove(`${className}--collapsed`);
      
      // Emit a custom event that can be listened to
      const event = new CustomEvent('expand', { 
        bubbles: true, 
        cancelable: true 
      });
      component.element.dispatchEvent(event);
      
      return this;
    },
    
    destroy() {
      lifecycle.destroy();
    }
  });