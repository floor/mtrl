// src/components/badge/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component-config';
import { BadgeConfig } from './types';
import { 
  BADGE_VARIANTS, 
  BADGE_COLORS, 
  BADGE_POSITIONS, 
  BADGE_MAX_CHARACTERS 
} from './constants';

/**
 * Default configuration for the Badge component
 */
export const defaultConfig: BadgeConfig = {
  variant: BADGE_VARIANTS.LARGE,
  color: BADGE_COLORS.ERROR,
  position: BADGE_POSITIONS.TOP_RIGHT,
  label: '',
  visible: true
};

/**
 * Creates the base configuration for Badge component
 * @param {BadgeConfig} config - User provided configuration
 * @returns {BadgeConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: BadgeConfig = {}): BadgeConfig => 
  createComponentConfig(defaultConfig, config, 'badge') as BadgeConfig;

/**
 * Generates element configuration for the Badge component
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: BadgeConfig) => {
  // Create the attributes object
  const attrs: Record<string, any> = {};
  
  // Convert numeric label to string if needed
  const label = config.label !== undefined ? String(config.label) : '';
  
  // Small badges (dot variant) don't have text
  const text = config.variant === BADGE_VARIANTS.SMALL ? '' : label;
  
  return createElementConfig(config, {
    tag: 'span',
    attrs,
    className: config.class,
    text
  });
};

/**
 * Creates API configuration for the Badge component
 * @param {Object} comp - Component with visibility and lifecycle features
 * @returns {Object} API configuration object
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
 * Format a label
 * - Max 4 characters including "+" for overflow
 * - Add "+" for numeric values exceeding max
 * 
 * @param {string|number} label - Original label
 * @param {number} max - Maximum value before using "+"
 * @returns {string} Formatted label
 */
export const formatBadgeLabel = (label: string | number, max?: number): string => {
  // Handle empty or undefined labels
  if (label === undefined || label === null || label === '') {
    return '';
  }
  
  let formattedLabel = String(label);
  
  // Apply max value formatting
  if (max !== undefined && typeof label === 'number' && label > max) {
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