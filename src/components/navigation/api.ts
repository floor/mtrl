// src/components/button/api.ts
import { ButtonComponent } from './types';

interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

interface ComponentWithElements {
  element: HTMLElement;
  text: {
    setText: (content: string) => any;
    getText: () => string;
    getElement: () => HTMLElement | null;
  };
  icon: {
    setIcon: (html: string) => any;
    getIcon: () => string;
    getElement: () => HTMLElement | null;
  };
  getClass: (name: string) => string;
}

/**
 * Enhances a button component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Button component
 */
export const withAPI = ({ disabled, lifecycle }: ApiOptions) => 
  (component: ComponentWithElements): ButtonComponent => ({
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
    
    setText(content: string) {
      component.text.setText(content);
      this.updateCircularStyle();
      
      // If removing text from a button with an icon, ensure it has an accessible name
      if (!content && component.icon.getElement()) {
        if (!this.element.getAttribute('aria-label')) {
          const className = this.element.className.split(' ')
            .find(cls => !cls.startsWith(`${component.getClass('button')}`));
          
          if (className) {
            this.element.setAttribute('aria-label', className);
          }
        }
      }
      
      return this;
    },
    
    getText() {
      return component.text.getText();
    },
    
    setIcon(icon: string) {
      component.icon.setIcon(icon);
      this.updateCircularStyle();
      return this;
    },
    
    getIcon() {
      return component.icon.getIcon();
    },
    
    setAriaLabel(label: string) {
      component.element.setAttribute('aria-label', label);
      return this;
    },
    
    destroy() {
      lifecycle.destroy();
    },
    
    updateCircularStyle() {
      const hasText = component.text.getText();
      if (!hasText && component.icon.getElement()) {
        component.element.classList.add(`${component.getClass('button')}--circular`);
      } else {
        component.element.classList.remove(`${component.getClass('button')}--circular`);
      }
    }
  });