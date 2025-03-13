// src/components/badge/features.ts
import { 
  BADGE_VARIANTS, 
  BADGE_COLORS, 
  BADGE_POSITIONS 
} from './constants';
import { BadgeConfig } from './types';
import { formatBadgeLabel } from './config';

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
  const variant = config.variant || BADGE_VARIANTS.LARGE;
  
  // Apply variant class
  component.element.classList.add(`${component.getClass('badge')}--${variant}`);
  
  // Small badges (dot variant) don't have text
  if (variant === BADGE_VARIANTS.SMALL) {
    component.element.textContent = '';
    component.element.setAttribute('aria-hidden', 'true');
  } else {
    // Add accessibility for large badges
    component.element.setAttribute('role', 'status');
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
 * Higher-order function that adds positioning features to a badge component
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with positioning features
 */
export const withPosition = (config: BadgeConfig) => component => {
  // Get position from config with fallback to default
  const position = config.position || BADGE_POSITIONS.TOP_RIGHT;
  
  // Apply position class
  component.element.classList.add(`${component.getClass('badge')}--${position}`);
  
  // If there's a target, add positioned class
  if (config.target) {
    component.element.classList.add(`${component.getClass('badge')}--positioned`);
  }
  
  return component;
};

/**
 * Higher-order function that adds max value features to a badge component
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with max value features
 */
export const withMax = (config: BadgeConfig) => component => {
  // Skip if no max is defined or for small badges
  if (config.max === undefined || config.variant === BADGE_VARIANTS.SMALL) {
    return component;
  }
  
  // Store max value in config for later use
  component.config.max = config.max;
  
  // Apply max formatting if needed
  if (config.label !== undefined && config.label !== '') {
    const formattedLabel = formatBadgeLabel(config.label, config.max);
    component.element.textContent = formattedLabel;
    
    // Add overflow class if label was truncated
    if (typeof config.label === 'number' && config.label > config.max) {
      component.element.classList.add(`${component.getClass('badge')}--overflow`);
    }
  }
  
  return component;
};

/**
 * Higher-order function that attaches badge to a target element
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with attachment features
 */
export const withAttachment = (config: BadgeConfig) => component => {
  // Skip if no target is provided
  if (!config.target) {
    return component;
  }
  
  // Create wrapper to hold the target and badge
  const wrapper = document.createElement('div');
  wrapper.classList.add(component.getClass('badge-wrapper'));
  
  // Make sure positioning context is correct
  wrapper.style.position = 'relative';
  
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