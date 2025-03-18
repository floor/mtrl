// src/components/tooltip/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component-config';
import { TooltipConfig } from './types';


export const TOOLTIP_POSITIONS = {
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
  TOP_START: 'top-start',
  TOP_END: 'top-end',
  RIGHT_START: 'right-start',
  RIGHT_END: 'right-end',
  BOTTOM_START: 'bottom-start',
  BOTTOM_END: 'bottom-end',
  LEFT_START: 'left-start',
  LEFT_END: 'left-end'
}

export const TOOLTIP_VARIANTS = {
  DEFAULT: 'default',
  RICH: 'rich',
  PLAIN: 'plain'
}

export const DEFAULT_SHOW_DELAY = 300
export const DEFAULT_HIDE_DELAY = 100
export const DEFAULT_OFFSET = 8
export const DEFAULT_ARROW_SIZE = 8

/**
 * Default configuration for the Tooltip component
 */
export const defaultConfig: TooltipConfig = {
  position: TOOLTIP_POSITIONS.BOTTOM,
  variant: TOOLTIP_VARIANTS.DEFAULT,
  visible: false,
  showDelay: DEFAULT_SHOW_DELAY,
  hideDelay: DEFAULT_HIDE_DELAY,
  showOnFocus: true,
  showOnHover: true,
  rich: false
};

/**
 * Creates the base configuration for Tooltip component
 * @param {TooltipConfig} config - User provided configuration
 * @returns {TooltipConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: TooltipConfig = {}): TooltipConfig => 
  createComponentConfig(defaultConfig, config, 'tooltip') as TooltipConfig;

/**
 * Generates element configuration for the Tooltip component
 * @param {TooltipConfig} config - Tooltip configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: TooltipConfig) => {
  // Create the attributes object
  const attrs: Record<string, any> = {
    role: 'tooltip',
    'aria-hidden': 'true'
  };
  
  // Add z-index if provided
  if (config.zIndex !== undefined) {
    attrs['style'] = `z-index: ${config.zIndex};`;
  }
  
  const extraClasses: string[] = [
    `--${config.position}`,
    `--${config.variant}`
  ];
  
  return createElementConfig(config, {
    tag: 'div',
    attrs,
    className: config.class,
    extraClasses,
    content: config.text || ''
  });
};

/**
 * Creates API configuration for the Tooltip component
 * @param {Object} comp - Component with lifecycle feature
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  }
});

export default defaultConfig;