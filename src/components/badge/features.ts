// src/components/badge/features.ts
import { BADGE_VARIANTS, BADGE_SIZES, BADGE_COLORS, BADGE_POSITIONS } from './constants';
import { BadgeConfig } from './types';

/**
 * Higher-order function that adds visibility control features to a component
 * @returns {Function} Component enhancer with visibility features
 */
export const withVisibility = () => component => {
  // Get config values
  const visible = component.config.visible !== false; // Default to true if not specified
  
  // Initialize visibility state based on config
  if (!visible) {
    component.element.classList.add(`${component.getClass('badge')}--invisible`);
  }
  
  return {
    ...component,
    visibility: {
      /**
       * Shows the badge
       */
      show() {
        component.element.classList.remove(`${component.getClass('badge')}--invisible`);
      },
      
      /**
       * Hides the badge
       */
      hide() {
        component.element.classList.add(`${component.getClass('badge')}--invisible`);
      },
      
      /**
       * Toggles badge visibility
       * @param {boolean} [visible] - Optional flag to force visibility state
       */
      toggle(visible?: boolean) {
        if (visible === undefined) {
          component.element.classList.toggle(`${component.getClass('badge')}--invisible`);
        } else if (visible) {
          this.show();
        } else {
          this.hide();
        }
      },
      
      /**
       * Checks if the badge is visible
       * @returns {boolean} True if badge is visible
       */
      isVisible() {
        return !component.element.classList.contains(`${component.getClass('badge')}--invisible`);
      }
    }
  };
};

/**
 * Higher-order function that adds variant features to a badge component
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with variant features
 */
export const withVariant = (config: BadgeConfig) => component => {
  // Get variant from config with fallback to default
  const variant = config.variant || BADGE_VARIANTS.STANDARD;
  
  // Apply variant class if not standard variant
  if (variant !== BADGE_VARIANTS.STANDARD) {
    component.element.classList.add(`${component.getClass('badge')}--${variant}`);
    
    // Clear content if dot variant
    if (variant === BADGE_VARIANTS.DOT) {
      component.element.textContent = '';
    }
  }
  
  return component;
};

/**
 * Higher-order function that adds color features to a badge component
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with color features
 */
export const withColor = (config: BadgeConfig) => component => {
  // Get color from config with fallback to default
  const color = config.color || BADGE_COLORS.ERROR;
  
  // Apply color class
  component.element.classList.add(`${component.getClass('badge')}--${color}`);
  
  return component;
};

/**
 * Higher-order function that adds size features to a badge component
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with size features
 */
export const withSize = (config: BadgeConfig) => component => {
  // Get size from config with fallback to default
  const size = config.size || BADGE_SIZES.MEDIUM;
  
  // Apply size class if not medium (default)
  if (size !== BADGE_SIZES.MEDIUM) {
    component.element.classList.add(`${component.getClass('badge')}--${size}`);
  }
  
  return component;
};

/**
 * Higher-order function that adds positioning features to a badge component
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with positioning features
 */
export const withPosition = (config: BadgeConfig) => component => {
  // Skip for standalone badges
  if (config.standalone) {
    return component;
  }
  
  // Get position from config with fallback to default
  const position = config.position || BADGE_POSITIONS.TOP_RIGHT;
  
  // Apply position class and positioned class
  component.element.classList.add(`${component.getClass('badge')}--${position}`);
  component.element.classList.add(`${component.getClass('badge')}--positioned`);
  
  return component;
};

/**
 * Higher-order function that adds max value features to a badge component
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with max value features
 */
export const withMax = (config: BadgeConfig) => component => {
  // Skip if no max is defined
  if (config.max === undefined) {
    return component;
  }
  
  // Store max value in config for later use
  component.config.max = config.max;
  
  // Apply max formatting if needed
  if (typeof config.content === 'number' && config.content > config.max) {
    component.element.textContent = String(config.max);
    component.element.classList.add(`${component.getClass('badge')}--max`);
  }
  
  return component;
};

/**
 * Higher-order function that attaches badge to a target element
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with attachment features
 */
export const withAttachment = (config: BadgeConfig) => component => {
  // Skip for standalone badges or if no target is provided
  if (config.standalone || !config.target) {
    return component;
  }
  
  // Create wrapper to hold the target and badge
  const wrapper = document.createElement('div');
  wrapper.classList.add(component.getClass('badge-wrapper'));
  
  // Replace the target with the wrapper
  const parent = config.target.parentNode;
  if (parent) {
    parent.replaceChild(wrapper, config.target);
    wrapper.appendChild(config.target);
    wrapper.appendChild(component.element);
    
    // Save the wrapper reference
    component.wrapper = wrapper;
  }
  
  return component;
};