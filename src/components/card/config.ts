// src/components/card/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { BaseComponent, CardSchema } from './types';
import { CARD_VARIANTS, CARD_ELEVATIONS } from './constants';

/**
 * Default configuration for the Card component
 */
export const defaultConfig: CardSchema = {
  variant: CARD_VARIANTS.ELEVATED,
  interactive: false,
  fullWidth: false,
  clickable: false,
  draggable: false
};

/**
 * Creates the base configuration for Card component
 * @param {CardSchema} config - User provided configuration
 * @returns {CardSchema} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: CardSchema = {}): CardSchema => 
  createComponentConfig(defaultConfig, config, 'card') as CardSchema;

/**
 * Generates element configuration for the Card component
 * @param {CardSchema} config - Card configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: CardSchema) =>
  createElementConfig(config, {
    tag: 'div',
    className: [
      config.class,
      config.fullWidth ? `${config.prefix}-card--full-width` : null,
      config.interactive ? `${config.prefix}-card--interactive` : null
    ],
    forwardEvents: {
      click: (component: BaseComponent) => !!config.clickable,
      mouseenter: (component: BaseComponent) => !!config.interactive,
      mouseleave: (component: BaseComponent) => !!config.interactive
    },
    interactive: config.interactive || config.clickable
  });

/**
 * Creates API configuration for the Card component
 * @param {Object} comp - Component with lifecycle feature
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  lifecycle: {
    destroy: () => comp.lifecycle?.destroy?.()
  }
});

/**
 * Adds interactive behavior to card component
 * @param {BaseComponent} comp - Card component
 * @returns {BaseComponent} Enhanced card component
 */
export const withInteractiveBehavior = (comp: BaseComponent): BaseComponent => {
  // Implement hover state elevation changes for interactive cards
  if (comp.config.interactive) {
    comp.element.addEventListener('mouseenter', () => {
      if (comp.config.variant === CARD_VARIANTS.ELEVATED) {
        comp.element.style.setProperty('--card-elevation', String(CARD_ELEVATIONS.HOVERED));
      }
    });

    comp.element.addEventListener('mouseleave', () => {
      if (comp.config.variant === CARD_VARIANTS.ELEVATED) {
        comp.element.style.setProperty('--card-elevation', String(CARD_ELEVATIONS.RESTING));
      }
    });
  }

  // Set up draggable
  if (comp.config.draggable) {
    comp.element.setAttribute('draggable', 'true');
    comp.element.addEventListener('dragstart', (e) => {
      comp.element.style.setProperty('--card-elevation', String(CARD_ELEVATIONS.DRAGGED));
      comp.emit?.('dragstart', { event: e });
    });

    comp.element.addEventListener('dragend', (e) => {
      comp.element.style.setProperty('--card-elevation', String(CARD_ELEVATIONS.RESTING));
      comp.emit?.('dragend', { event: e });
    });
  }

  return comp;
};

export default defaultConfig;