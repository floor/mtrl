// src/components/badge/features.ts
import { BadgeConfig, BadgeFeatureHost, BadgeVisibility } from './types';
import { formatBadgeLabel, isBadgeOverflow, isEmptyBadgeLabel } from './config';

// Common badge variants
const VARIANT_SMALL = 'small';
const VARIANT_LARGE = 'large';

// Common badge colors
const COLOR_ERROR = 'error';

// Common badge positions
const POSITION_TOP_RIGHT = 'top-right';

/**
 * Higher-order function that adds visibility control features to a component
 * @returns {Function} Component enhancer with visibility features
 */
export const withVisibility = () => <C extends BadgeFeatureHost>(component: C): C & { visibility: BadgeVisibility } => {
  // Get config values
  const visible = component.config.visible !== false; // Default to true if not specified

  // A badge is a count, and a count of nothing is not news. setLabel has
  // always hidden an empty or zero label; creation did not, so
  // createBadge({ label: 0 }) was visible while setLabel(0) on the same badge
  // hid it. Same helper both sides now. FLO-108.
  const nothingToShow = isEmptyBadgeLabel(
    formatBadgeLabel(component.config.label ?? "", component.config.max)
  );

  if (!visible || nothingToShow) {
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
export const withVariant = (config: BadgeConfig) => <C extends BadgeFeatureHost>(component: C): C => {
  // Get variant from config with fallback to default
  const variant = config.variant || VARIANT_LARGE;
  
  // Apply variant class
  component.element.classList.add(`${component.getClass('badge')}--${variant}`);
  
  // Small badges (dot variant) don't have text
  if (variant === VARIANT_SMALL) {
    component.element.textContent = '';
    component.element.setAttribute('aria-hidden', 'true');
  } else {
    // Add accessibility for large badges
    component.element.setAttribute('role', 'status');
    
    // Set the label if available and variant is large
    if (config.label !== undefined && config.label !== '') {
      // Format the label according to max value
      const formattedLabel = formatBadgeLabel(config.label, config.max);
      component.element.textContent = formattedLabel;
    }
  }
  
  return component;
};

/**
 * Higher-order function that adds color features to a badge component
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with color features
 */
export const withColor = (config: BadgeConfig) => <C extends BadgeFeatureHost>(component: C): C => {
  // Get color from config with fallback to default
  const color = config.color || COLOR_ERROR;
  
  // Apply color class
  component.element.classList.add(`${component.getClass('badge')}--${color}`);
  
  return component;
};

/**
 * Higher-order function that adds positioning features to a badge component
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with positioning features
 */
export const withPosition = (config: BadgeConfig) => <C extends BadgeFeatureHost>(component: C): C => {
  // Get position from config with fallback to default
  const position = config.position || POSITION_TOP_RIGHT;
  
  // Apply position class
  component.element.classList.add(`${component.getClass('badge')}--${position}`);
  
  // Positioned only when the badge can actually be attached. A target with no
  // parent cannot be wrapped -- withAttachment builds the wrapper and drops it
  // -- so the badge would have claimed a position it never took. FLO-108.
  if (config.target && config.target.parentNode) {
    component.element.classList.add(`${component.getClass('badge')}--positioned`);
  }
  
  return component;
};

/**
 * Higher-order function that adds max value features to a badge component
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with max value features
 */
export const withMax = (config: BadgeConfig) => <C extends BadgeFeatureHost>(component: C): C => {
  // Skip if no max is defined or for small badges
  if (config.max === undefined || config.variant === VARIANT_SMALL) {
    return component;
  }
  
  // Store max value in config for later use
  component.config.max = config.max;
  
  // Overflow, from the same helper the setter uses, so the two cannot drift
  // apart again. Visibility is decided in withVisibility, which runs for
  // every badge -- this feature returns early when there is no max. FLO-108.
  if (config.label !== undefined) {
    const formattedLabel = formatBadgeLabel(config.label, config.max);
    component.element.textContent = formattedLabel;

    if (isBadgeOverflow(config.label, config.max)) {
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
export const withAttachment = (config: BadgeConfig) => <C extends BadgeFeatureHost>(component: C): C => {
  // Skip if no target is provided
  if (!config.target) {
    return component;
  }
  
  // Create wrapper to hold the target and badge
  const wrapper = document.createElement('div');
  wrapper.classList.add(component.getClass('badge__wrapper'));
  
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