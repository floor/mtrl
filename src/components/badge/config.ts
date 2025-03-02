// src/components/badge/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { BadgeConfig } from './types';
import { BADGE_VARIANTS, BADGE_SIZES, BADGE_COLORS, BADGE_POSITIONS } from './constants';

/**
 * Default configuration for the Badge component
 */
export const defaultConfig: BadgeConfig = {
  variant: BADGE_VARIANTS.STANDARD,
  size: BADGE_SIZES.MEDIUM,
  color: BADGE_COLORS.ERROR,
  position: BADGE_POSITIONS.TOP_RIGHT,
  content: '',
  visible: true,
  standalone: false
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
  
  // Convert numeric content to string if needed
  const content = config.content !== undefined ? String(config.content) : '';
  
  return createElementConfig(config, {
    tag: 'span',
    attrs,
    className: config.class,
    content: config.variant === BADGE_VARIANTS.DOT ? '' : content
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

export default defaultConfig;