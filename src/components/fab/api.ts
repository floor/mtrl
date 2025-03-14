// src/components/fab/api.ts
import { FabComponent } from './types';

interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle: {
    destroy: () => void;
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
  getClass: (name: string) => string;
}

/**
 * Enhances a FAB component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the FAB component
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