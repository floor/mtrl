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
     * Sets the button's variant (visual style)
     * @param variant - New variant to apply ('filled', 'outlined', 'text', etc.)
     * @returns Button component for method chaining
     */
    setVariant(variant: string) {
      const compName = component.componentName || 'button';
      const buttonClass = component.getClass(compName);
      
      // First remove all existing variant classes
      const variantClasses = ['filled', 'tonal', 'outlined', 'elevated', 'text']
        .map(v => `${buttonClass}--${v}`);
      
      variantClasses.forEach(cls => {
        component.element.classList.remove(cls);
      });
      
      component.element.classList.add(`${buttonClass}--${variant}`);

      
      return this;
    },

    /**
     * Gets the button's current variant
     * @returns Current variant name ('filled', 'outlined', etc.)
     */
    getVariant() {
      const compName = component.componentName || 'button';
      const buttonClass = component.getClass(compName);
      const variants = ['filled', 'tonal', 'outlined', 'elevated', 'text'];
      
      // Check which variant class is present on the element
      for (const variant of variants) {
        if (component.element.classList.contains(`${buttonClass}--${variant}`)) {
          return variant;
        }
      }
      
      // If no variant class is found, return the default variant
      return 'filled';
    },

    /**
     * Sets the active state of the button
     * Used to visually indicate the button's active state, such as when it has a menu open
     * 
     * @param active - Whether the button should appear active
     * @returns Button component for method chaining
     */
    setActive(active: boolean) {
      if (active) {
        component.element.classList.add(`${component.getClass('button')}--active`);
      } else {
        component.element.classList.remove(`${component.getClass('button')}--active`);
      }
      return this;
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