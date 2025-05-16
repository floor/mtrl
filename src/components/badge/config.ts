// src/components/badge/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component';
import { BadgeConfig } from './types';
import { 
  BADGE_VARIANTS, 
  BADGE_COLORS, 
  BADGE_POSITIONS, 
  BADGE_MAX_CHARACTERS 
} from './constants';

/**
 * Default configuration for the Badge component
 * These values will be used when not explicitly specified by the user.
 * 
 * @category Components
 */
export const defaultConfig: BadgeConfig = {
  /** Default to large badge (with text capability) */
  variant: BADGE_VARIANTS.LARGE,
  /** Default to error (red) color */
  color: BADGE_COLORS.ERROR,
  /** Default to top-right corner positioning */
  position: BADGE_POSITIONS.TOP_RIGHT,
  /** Default to empty label */
  label: '',
  /** Default to visible */
  visible: true
};

/**
 * Creates the base configuration for Badge component by merging user-provided
 * config with default values.
 * 
 * @param {BadgeConfig} config - User provided configuration
 * @returns {BadgeConfig} Complete configuration with defaults applied
 * @category Components
 * @internal
 */
export const createBaseConfig = (config: BadgeConfig = {}): BadgeConfig => 
  createComponentConfig(defaultConfig, config, 'badge') as BadgeConfig;

/**
 * Generates element configuration for the Badge component.
 * This function creates the necessary attributes and configuration
 * for the DOM element creation process.
 * 
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Object} Element configuration object for withElement
 * @category Components
 * @internal
 */
export const getElementConfig = (config: BadgeConfig) => {
  // Create the attributes object
  const attributes: Record<string, any> = {};
  
  // For large badges, set appropriate ARIA attributes for screen readers
  if (config.variant !== 'small') {
    attributes.role = 'status';
  }
  
  // Format the label if needed - small badges have no text
  const formattedLabel = config.variant === 'small' 
    ? '' 
    : formatBadgeLabel(config.label || '', config.max);
  
  return createElementConfig(config, {
    tag: 'span',
    attributes,
    className: config.class,
    text: formattedLabel // Use the formatted label
  });
};

/**
 * Creates API configuration for the Badge component.
 * This connects the core component features (like visibility)
 * to the public API methods exposed to users.
 * 
 * @param {Object} comp - Component with visibility and lifecycle features
 * @returns {Object} API configuration object
 * @category Components
 * @internal
 */
export const getApiConfig = (comp) => ({
  visibility: {
    show: () => comp.visibility.show(),
    hide: () => comp.visibility.hide(),
    toggle: (visible?: boolean) => comp.visibility.toggle(visible),
    isVisible: () => comp.visibility.isVisible()
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  }
});

/**
 * Format a badge label following Material Design 3 guidelines:
 * - Max 4 characters including "+" for overflow
 * - Add "+" for numeric values exceeding max
 * 
 * @param {string|number} label - Original label
 * @param {number} max - Maximum value before using "+"
 * @returns {string} Formatted label that fits within badge constraints
 * @category Components
 * @internal
 * 
 * @example
 * formatBadgeLabel(5) // "5"
 * formatBadgeLabel(1250, 999) // "999+"
 * formatBadgeLabel("New") // "New"
 * formatBadgeLabel("VeryLong") // "Very" (truncated)
 */
export const formatBadgeLabel = (label: string | number, max?: number): string => {
  // Handle empty or undefined labels
  if (label === undefined || label === null || label === '') {
    return '';
  }
  
  let formattedLabel = String(label);
  
  const numericLabel = Number(label);

  // Apply max value formatting for numbers
  if (max !== undefined && !isNaN(numericLabel) && numericLabel > max) {
    formattedLabel = `${max}+`;
  }
  
  // Ensure label doesn't exceed max characters
  if (formattedLabel.length > BADGE_MAX_CHARACTERS) {
    // Try to preserve as much information as possible
    // For large numbers, use abbreviated format with "+"
    const numericValue = Number(label);
    if (!isNaN(numericValue)) {
      if (numericValue >= 1000) {
        formattedLabel = '999+';
      } else {
        // For numbers under 1000 but still too long, truncate
        formattedLabel = formattedLabel.substring(0, BADGE_MAX_CHARACTERS - 1) + '+';
      }
    } else {
      // For non-numeric values, simply truncate
      formattedLabel = formattedLabel.substring(0, BADGE_MAX_CHARACTERS);
    }
  }
  
  return formattedLabel;
};

export default defaultConfig;