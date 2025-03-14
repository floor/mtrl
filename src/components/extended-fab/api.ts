// src/components/extended-fab/api.ts
import { ExtendedFabComponent } from './types';

interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle: {
    destroy: () => void;
  };
  text: {
    setText: (text: string) => any;
    getText: () => string;
  };
  className: string;
}

interface ComponentWithElements {
  element: HTMLElement;
  icon: {
    setIcon: (html: string) => any;
    getIcon: () => string;
    getElement: () => HTMLElement | null;
  };
  text: {
    setText: (text: string) => any;
    getText: () => string;
    getElement: () => HTMLElement | null;
  };
  getClass: (name: string) => string;
}

/**
 * Enhances an Extended FAB component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
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