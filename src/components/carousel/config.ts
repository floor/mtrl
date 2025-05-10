// src/components/carousel/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component';
import { CarouselConfig } from './types';
import { CAROUSEL_DEFAULTS, CAROUSEL_TRANSITIONS } from './constants';

/**
 * Default configuration for the Carousel component
 */
export const defaultConfig: CarouselConfig = {
  initialSlide: CAROUSEL_DEFAULTS.INITIAL_SLIDE,
  loop: CAROUSEL_DEFAULTS.LOOP,
  transition: CAROUSEL_TRANSITIONS.SLIDE as 'slide' | 'fade' | 'none',
  transitionDuration: CAROUSEL_DEFAULTS.TRANSITION_DURATION,
  borderRadius: CAROUSEL_DEFAULTS.BORDER_RADIUS,
  gap: CAROUSEL_DEFAULTS.GAP,
  prefix: 'carousel',
  showAllLink: true // Show "Show all" button by default
};

/**
 * Creates the base configuration for Carousel component
 * @param {CarouselConfig} config - User provided configuration
 * @returns {CarouselConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: CarouselConfig = {}): CarouselConfig => 
  createComponentConfig(defaultConfig, config, 'carousel') as CarouselConfig;

/**
 * Generates element configuration for the Carousel component
 * @param {CarouselConfig} config - Carousel configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: CarouselConfig) => {
  // Create the attributes object
  const attrs: Record<string, any> = {
    role: 'region',
    'aria-roledescription': 'carousel',
    'aria-live': 'polite'
  };
  
  // Create data attributes for configuration
  const dataAttrs = {
    'data-transition': config.transition,
    'data-loop': config.loop ? 'true' : 'false'
  };
  
  return createElementConfig(config, {
    tag: 'div',
    attrs: { ...attrs, ...dataAttrs },
    className: config.class,
    forwardEvents: {
      keydown: true,
      focus: true,
      blur: true
    },
    style: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: `${config.borderRadius}px`,
      width: '100%',
      height: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }
  });
};

/**
 * Creates API configuration for the Carousel component
 * @param {Object} comp - Component with slides and lifecycle features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  // Empty navigation API for compatibility
  slides: {
    addSlide: comp.slides.addSlide,
    removeSlide: comp.slides.removeSlide,
    updateSlide: comp.slides.updateSlide,
    getCount: comp.slides.getCount,
    getElements: comp.slides.getElements
  },
  lifecycle: {
    destroy: comp.lifecycle.destroy
  }
});

export default defaultConfig;