// src/components/card/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component-config';
import { 
  fCardHeader, 
  fCardContent, 
  fCardMedia, 
  fCardActions 
} from './content';
import { CardComponent, CardSchema, ButtonConfig, BaseComponent } from './types';

/**
 * Default configuration for the Card component.
 * These values are used when no configuration is provided.
 * 
 * @const {CardSchema}
 * @category Components
 */
export const defaultConfig: CardSchema = {
  variant: 'elevated',
  interactive: false,
  fullWidth: false,
  clickable: false,
  draggable: false
};

/**
 * Processes inline configuration options into standard config format.
 * Maps shorthand properties to their proper config counterparts for ease of use.
 * 
 * @param {CardSchema} config - Raw card configuration
 * @returns {CardSchema} Processed configuration
 * @category Components
 * @example
 * ```typescript
 * // Before processing, these are equivalent:
 * { header: { title: 'Example' } }
 * { headerConfig: { title: 'Example' } }
 * ```
 */
export const processInlineConfig = (config: CardSchema): CardSchema => {
  const processedConfig: CardSchema = { ...config };
  
  // Map inline properties to their *Config counterparts
  if (config.header) {
    processedConfig.headerConfig = config.header;
  }
  
  if (config.content) {
    processedConfig.contentConfig = config.content;
  }
  
  if (config.media) {
    processedConfig.mediaConfig = config.media;
  }
  
  if (config.actions) {
    processedConfig.actionsConfig = config.actions;
  }
  
  return processedConfig;
};

/**
 * Applies inline configuration to a card component.
 * Adds configured elements to the card in the correct order following
 * Material Design layout guidelines. Handles media, header, content, and actions placement.
 * 
 * @param {CardComponent} card - Card component to configure
 * @param {CardSchema} config - Processed configuration
 * @category Components
 */
export const applyInlineConfiguration = (card: CardComponent, config: CardSchema): void => {
  // Add media (top position) if configured
  if (config.mediaConfig && (!config.mediaConfig.position || config.mediaConfig.position === 'top')) {
    const { position, ...mediaConfigWithoutPosition } = config.mediaConfig;
    const mediaElement = fCardMedia(mediaConfigWithoutPosition);
    card.addMedia(mediaElement, 'top');
  }
  
  // Add header if configured
  if (config.headerConfig) {
    const headerElement = fCardHeader(config.headerConfig);
    card.setHeader(headerElement);
  }
  
  // Add content if configured
  if (config.contentConfig) {
    const contentElement = fCardContent(config.contentConfig);
    card.addContent(contentElement);
  }
  
  // Add media (bottom position) if configured
  if (config.mediaConfig && config.mediaConfig.position === 'bottom') {
    const { position, ...mediaConfigWithoutPosition } = config.mediaConfig;
    const mediaElement = fCardMedia(mediaConfigWithoutPosition);
    card.addMedia(mediaElement, 'bottom');
  }
  
  // Add actions if configured
  if (config.actionsConfig) {
    const actionsElement = fCardActions(config.actionsConfig);
    card.setActions(actionsElement);
  }
  
  // Process buttons if provided (asynchronously)
  if (Array.isArray(config.buttons) && config.buttons.length > 0) {
    import('../button').then(({ default: fButton }) => {
      // Create buttons from configuration
      const actionButtons = config.buttons!.map(buttonConfig => 
        fButton(buttonConfig).element
      );
      
      // Create actions container
      const actionsElement = fCardActions({
        actions: actionButtons,
        align: config.actionsConfig?.align || 'end'
      });
      
      // Add the actions to the card
      card.setActions(actionsElement);
    }).catch(error => {
      console.error('Error processing buttons:', error);
    });
  }
};

/**
 * Creates the base configuration for Card component.
 * Merges user-provided configuration with default values,
 * ensuring all required properties are set.
 * 
 * @param {CardSchema} config - User provided configuration
 * @returns {CardSchema} Complete configuration with defaults applied
 * @category Components
 * 
 */
export const createBaseConfig = (config: CardSchema = {}): CardSchema => 
  createComponentConfig(defaultConfig, config, 'card') as CardSchema;

/**
 * Generates element configuration for the Card component.
 * Sets up DOM attributes, accessibility features, and event forwarding
 * based on the card's configuration.
 * 
 * @param {CardSchema} config - Card configuration
 * @returns {Object} Element configuration object for withElement
 * @category Components
 * 
 */
export const getElementConfig = (config: CardSchema) => {
  const isInteractive = config.interactive || config.clickable;
  const defaultRole = isInteractive ? 'button' : 'region';
  
  // Prepare ARIA attributes
  const ariaAttrs: Record<string, string> = {};
  if (config.aria) {
    // Add all ARIA attributes from config
    Object.entries(config.aria).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert attribute name to aria-* format if not already
        const attrName = key.startsWith('aria-') ? key : `aria-${key}`;
        ariaAttrs[attrName] = value;
      }
    });
  }
  
  // Set default ARIA role if not specified
  if (!ariaAttrs['role'] && !config.aria?.role) {
    ariaAttrs['role'] = defaultRole;
  }
  
  // Add tabindex for interactive cards if not specified
  if (isInteractive && !ariaAttrs['tabindex']) {
    ariaAttrs['tabindex'] = '0';
  }
  
  return createElementConfig(config, {
    tag: 'div',
    className: [
      config.class,
      config.fullWidth ? `${config.prefix}-card--full-width` : null,
      isInteractive ? `${config.prefix}-card--interactive` : null
    ],
    attrs: ariaAttrs,
    forwardEvents: {
      click: (component: BaseComponent) => !!config.clickable,
      mouseenter: (component: BaseComponent) => !!isInteractive,
      mouseleave: (component: BaseComponent) => !!isInteractive,
      keydown: (component: BaseComponent) => !!isInteractive,
      focus: (component: BaseComponent) => !!isInteractive,
      blur: (component: BaseComponent) => !!isInteractive
    },
    interactive: isInteractive
  });
};

/**
 * Creates API configuration for the Card component.
 * Prepares the configuration needed for the card's public API methods.
 * 
 * @param {Object} comp - Component with lifecycle feature
 * @returns {Object} API configuration object
 * @category Components
 * 
 */
export const getApiConfig = (comp: any) => ({
  lifecycle: {
    destroy: () => comp.lifecycle?.destroy?.()
  }
});

/**
 * Card elevation levels in density-independent pixels (dp).
 * Following Material Design 3 elevation system guidelines.
 * 
 * @category Components
 */
export const CARD_ELEVATION_LEVELS = {
  LEVEL0: 0,
  LEVEL1: 1,
  LEVEL2: 2,
  LEVEL4: 4
};

/**
 * Adds interactive behavior to card component.
 * Uses the mtrl elevation system for proper elevation levels according to Material Design 3
 * guidelines. Implements mouse, keyboard, and touch interactions with appropriate
 * visual feedback and accessibility support.
 * 
 * @param {BaseComponent} comp - Card component
 * @returns {BaseComponent} Enhanced card component
 * @category Components
 * 
 */
export const withInteractiveBehavior = (comp: BaseComponent): BaseComponent => {
  const config = comp.config;
  const isInteractive = config.interactive || config.clickable;
  
  // Implement MD3 elevation changes for interactive cards
  if (isInteractive) {
    // Mouse interactions
    comp.element.addEventListener('mouseenter', () => {
      if (config.variant === 'elevated') {
        comp.element.style.setProperty('--card-elevation', String(CARD_ELEVATION_LEVELS.LEVEL2));
      }
    });

    comp.element.addEventListener('mouseleave', () => {
      if (config.variant === 'elevated') {
        comp.element.style.setProperty('--card-elevation', String(CARD_ELEVATION_LEVELS.LEVEL1));
      }
    });
    
    // Keyboard interactions for accessibility
    comp.element.addEventListener('keydown', (e: KeyboardEvent) => {
      // Activate on Enter or Space
      if ((e.key === 'Enter' || e.key === ' ') && config.clickable) {
        e.preventDefault();
        comp.element.click();
      }
    });
    
    // Focus state handling
    comp.element.addEventListener('focus', () => {
      comp.element.classList.add(`${comp.getClass('card')}--focused`);
    });
    
    comp.element.addEventListener('blur', () => {
      comp.element.classList.remove(`${comp.getClass('card')}--focused`);
    });
  }

  // Set up draggable behavior
  if (config.draggable) {
    comp.element.setAttribute('draggable', 'true');
    
    comp.element.addEventListener('dragstart', (e: DragEvent) => {
      comp.element.style.setProperty('--card-elevation', String(CARD_ELEVATION_LEVELS.LEVEL4));
      comp.element.classList.add(`${comp.getClass('card')}--dragging`);
      comp.emit?.('dragstart', { event: e });
      
      // Ensure keyboard users can see what's being dragged
      if (e.dataTransfer) {
        // Set drag image and data
        const cardTitle = comp.element.querySelector(`.${comp.getClass('card')}-header-title`)?.textContent || 'Card';
        e.dataTransfer.setData('text/plain', cardTitle);
      }
    });

    comp.element.addEventListener('dragend', (e: DragEvent) => {
      comp.element.style.setProperty('--card-elevation', String(CARD_ELEVATION_LEVELS.LEVEL1));
      comp.element.classList.remove(`${comp.getClass('card')}--dragging`);
      comp.emit?.('dragend', { event: e });
    });
  }

  return comp;
};

export default defaultConfig;