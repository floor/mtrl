// src/components/button/api.ts
import { ButtonComponent } from './types';

/**
 * API configuration options for button component
 * @category Components
 * @internal
 */
interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Component with required elements and methods for API enhancement
 * @category Components
 * @internal
 */
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
 * Enhances a button component with API methods.
 * This follows the higher-order function pattern to add public API methods
 * to the component, making them available to the end user.
 * 
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @category Components
 * @internal This is an internal utility for the Button component
 */
export const withAPI = ({ disabled, lifecycle }: ApiOptions) => 
  (component: ComponentWithElements): ButtonComponent => ({
    ...component as any,
    element: component.element as HTMLButtonElement,
    
    /**
     * Gets the button's value attribute
     * @returns Current value of the button
     */
    getValue: () => component.element.value,
    
    /**
     * Sets the button's value attribute
     * @param value - New value to set
     * @returns Button component for method chaining
     */
    setValue(value: string) {
      component.element.value = value;
      return this;
    },
    
    /**
     * Enables the button, making it interactive
     * @returns Button component for method chaining
     */
    enable() {
      disabled.enable();
      return this;
    },
    
    /**
     * Disables the button, making it non-interactive
     * @returns Button component for method chaining
     */
    disable() {
      disabled.disable();
      return this;
    },
    
    /**
     * Sets the button's text content
     * @param content - Text content to display
     * @returns Button component for method chaining
     */
    setText(content: string) {
      component.text.setText(content);
      this.updateCircularStyle();
      return this;
    },
    
    /**
     * Gets the button's current text content
     * @returns Current text content
     */
    getText() {
      return component.text.getText();
    },
    
    /**
     * Sets the button's icon HTML content
     * @param icon - HTML string for the icon
     * @returns Button component for method chaining
     */
    setIcon(icon: string) {
      component.icon.setIcon(icon);
      this.updateCircularStyle();
      return this;
    },
    
    /**
     * Gets the button's current icon HTML content
     * @returns Current icon HTML
     */
    getIcon() {
      return component.icon.getIcon();
    },

    /**
     * Sets the button's aria-label attribute for accessibility
     * @param label - Accessible label text
     * @returns Button component for method chaining
     */
    setAriaLabel(label: string) {
      component.element.setAttribute('aria-label', label);
      return this;
    },
    
    /**
     * Destroys the button component and cleans up resources
     */
    destroy() {
      lifecycle.destroy();
    },
    
    /**
     * Updates the button's circular style based on content.
     * If the button has an icon but no text, it will be styled as circular.
     * @internal
     */
    updateCircularStyle() {
      const hasText = component.text.getElement();
      if (!hasText && component.icon.getElement()) {
        component.element.classList.add(`${component.getClass('button')}--circular`);
      } else {
        component.element.classList.remove(`${component.getClass('button')}--circular`);
      }
    }
  });