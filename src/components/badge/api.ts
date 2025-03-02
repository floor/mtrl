// src/components/badge/api.ts
import { BadgeComponent } from './types';
import { BADGE_VARIANTS, BADGE_SIZES, BADGE_COLORS, BADGE_POSITIONS } from './constants';

interface ApiOptions {
  visibility: {
    show: () => void;
    hide: () => void;
    toggle: (visible?: boolean) => void;
    isVisible: () => boolean;
  };
  lifecycle: {
    destroy: () => void;
  };
}

interface ComponentWithElements {
  element: HTMLElement;
  wrapper?: HTMLElement;
  config: {
    max?: number;
    content?: string | number;
  };
  getClass: (name: string) => string;
  addClass: (...classes: string[]) => any;
  removeClass: (...classes: string[]) => any;
  on: (event: string, handler: Function) => any;
  off: (event: string, handler: Function) => any;
}

/**
 * Enhances a badge component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Badge component
 */
export const withAPI = ({ visibility, lifecycle }: ApiOptions) => 
  (component: ComponentWithElements): BadgeComponent => ({
    ...component as any,
    
    /**
     * Sets the badge content
     * @param {string|number} content - Content to display in the badge
     * @returns {BadgeComponent} Badge component instance for chaining
     */
    setContent(content: string | number) {
      const stringContent = String(content);
      component.config.content = content;
      
      // If max is defined and content is a number greater than max, show max+
      if (component.config.max !== undefined && 
          typeof content === 'number' && 
          content > component.config.max) {
        component.element.textContent = String(component.config.max);
        component.element.classList.add(`${component.getClass('badge')}--max`);
      } else {
        component.element.textContent = stringContent;
        component.element.classList.remove(`${component.getClass('badge')}--max`);
      }
      
      // Toggle the dot variant based on whether content is empty
      if (stringContent === '' || stringContent === '0') {
        this.hide();
      } else {
        this.show();
      }
      
      return this;
    },
    
    /**
     * Gets the badge content
     * @returns {string} Current badge content
     */
    getContent() {
      return component.element.textContent || '';
    },
    
    /**
     * Shows the badge
     * @returns {BadgeComponent} Badge component instance for chaining
     */
    show() {
      visibility.show();
      return this;
    },
    
    /**
     * Hides the badge
     * @returns {BadgeComponent} Badge component instance for chaining
     */
    hide() {
      visibility.hide();
      return this;
    },
    
    /**
     * Toggles badge visibility
     * @param {boolean} [visible] - Optional flag to force visibility state
     * @returns {BadgeComponent} Badge component instance for chaining
     */
    toggle(visible?: boolean) {
      visibility.toggle(visible);
      return this;
    },
    
    /**
     * Checks if the badge is visible
     * @returns {boolean} True if badge is visible
     */
    isVisible() {
      return visibility.isVisible();
    },
    
    /**
     * Sets maximum value (after which badge shows max+)
     * @param {number} max - Maximum value to display
     * @returns {BadgeComponent} Badge component instance for chaining
     */
    setMax(max: number) {
      component.config.max = max;
      
      // Apply max formatting if current content exceeds max
      if (typeof component.config.content === 'number' && 
          component.config.content > max) {
        component.element.textContent = String(max);
        component.element.classList.add(`${component.getClass('badge')}--max`);
      } else {
        component.element.classList.remove(`${component.getClass('badge')}--max`);
      }
      
      return this;
    },
    
    /**
     * Sets badge color
     * @param {string} color - Color variant to apply
     * @returns {BadgeComponent} Badge component instance for chaining
     */
    setColor(color: keyof typeof BADGE_COLORS | BADGE_COLORS) {
      // Remove existing color classes
      Object.values(BADGE_COLORS).forEach(colorName => {
        component.element.classList.remove(`${component.getClass('badge')}--${colorName}`);
      });
      
      // Add new color class
      component.element.classList.add(`${component.getClass('badge')}--${color}`);
      return this;
    },
    
    /**
     * Sets badge variant
     * @param {string} variant - Variant to apply
     * @returns {BadgeComponent} Badge component instance for chaining
     */
    setVariant(variant: keyof typeof BADGE_VARIANTS | BADGE_VARIANTS) {
      // Remove existing variant classes
      Object.values(BADGE_VARIANTS).forEach(variantName => {
        component.element.classList.remove(`${component.getClass('badge')}--${variantName}`);
      });
      
      // Add new variant class if not standard
      if (variant !== BADGE_VARIANTS.STANDARD) {
        component.element.classList.add(`${component.getClass('badge')}--${variant}`);
      }
      
      // Clear content if dot variant
      if (variant === BADGE_VARIANTS.DOT) {
        component.element.textContent = '';
      } else if (component.config.content !== undefined) {
        this.setContent(component.config.content);
      }
      
      return this;
    },
    
    /**
     * Sets badge size
     * @param {string} size - Size variant to apply
     * @returns {BadgeComponent} Badge component instance for chaining
     */
    setSize(size: keyof typeof BADGE_SIZES | BADGE_SIZES) {
      // Remove existing size classes
      Object.values(BADGE_SIZES).forEach(sizeName => {
        component.element.classList.remove(`${component.getClass('badge')}--${sizeName}`);
      });
      
      // Add new size class if not medium (default)
      if (size !== BADGE_SIZES.MEDIUM) {
        component.element.classList.add(`${component.getClass('badge')}--${size}`);
      }
      
      return this;
    },
    
    /**
     * Sets badge position
     * @param {string} position - Position variant to apply
     * @returns {BadgeComponent} Badge component instance for chaining
     */
    setPosition(position: keyof typeof BADGE_POSITIONS | BADGE_POSITIONS) {
      // Remove existing position classes
      Object.values(BADGE_POSITIONS).forEach(posName => {
        component.element.classList.remove(`${component.getClass('badge')}--${posName}`);
      });
      
      // Add new position class
      component.element.classList.add(`${component.getClass('badge')}--${position}`);
      
      return this;
    },
    
    /**
     * Attaches badge to a target element
     * @param {HTMLElement} target - Element to attach badge to
     * @returns {BadgeComponent} Badge component instance for chaining
     */
    attachTo(target: HTMLElement) {
      // If we already have a wrapper, remove the badge from it
      if (component.wrapper && component.wrapper.contains(component.element)) {
        component.wrapper.removeChild(component.element);
      }
      
      // Create a new wrapper to hold the target and badge
      const wrapper = document.createElement('div');
      wrapper.classList.add(component.getClass('badge-wrapper'));
      
      // Replace the target with the wrapper
      const parent = target.parentNode;
      if (parent) {
        parent.replaceChild(wrapper, target);
        wrapper.appendChild(target);
        wrapper.appendChild(component.element);
        
        // Make sure the badge is positioned
        component.element.classList.add(`${component.getClass('badge')}--positioned`);
        
        // Save the wrapper reference
        component.wrapper = wrapper;
      }
      
      return this;
    },
    
    /**
     * Makes badge standalone (removes from wrapper)
     * @returns {BadgeComponent} Badge component instance for chaining
     */
    detach() {
      if (component.wrapper && component.wrapper.contains(component.element)) {
        // Remove the badge from the wrapper
        component.wrapper.removeChild(component.element);
        
        // Remove the positioned class
        component.element.classList.remove(`${component.getClass('badge')}--positioned`);
        
        // Add the badge to the document body or another container
        document.body.appendChild(component.element);
        
        // Clear the wrapper reference
        component.wrapper = undefined;
      }
      
      return this;
    },
    
    /**
     * Destroys the badge component and cleans up resources
     */
    destroy() {
      lifecycle.destroy();
      
      // If badge is in a wrapper, restore the original DOM structure
      if (component.wrapper) {
        const target = component.wrapper.firstChild as HTMLElement;
        const parent = component.wrapper.parentNode;
        
        if (parent && target) {
          parent.replaceChild(target, component.wrapper);
        }
      }
    },
    
    // Forward basic component methods for API consistency
    getClass: component.getClass,
    addClass: component.addClass,
    removeClass: component.removeClass,
    on: component.on,
    off: component.off,
    element: component.element,
    wrapper: component.wrapper
  });