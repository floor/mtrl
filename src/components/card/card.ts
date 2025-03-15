// src/components/card/card.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withVariant,
  withRipple,
  withLifecycle
} from '../../core/compose/features';
import { withAPI } from './api';
import { CardComponent, BaseComponent, CardSchema } from './types';
import { 
  createBaseConfig, 
  getElementConfig, 
  getApiConfig, 
  withInteractiveBehavior,
  processInlineConfig,
  applyInlineConfiguration
} from './config';
import { withElevation } from './features';

/**
 * Creates a new Card component following Material Design 3 principles
 * 
 * Material Design 3 Cards are surfaces that display content and actions about a single topic.
 * Cards can contain text, media, and UI controls.
 * 
 * @param {CardSchema} config - Card configuration object
 * @returns {CardComponent} Card component instance
 */
const createCard = (config: CardSchema = {}): CardComponent => {
  // Process inline configuration (map shorthand properties)
  const processedConfig = processInlineConfig(config);
  const baseConfig = createBaseConfig(processedConfig);

  try {
    // Create the core card component
    const card = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      baseConfig.clickable ? withRipple(baseConfig) : (c: BaseComponent) => c,
      withLifecycle(),
      withInteractiveBehavior,
      withElevation,
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig) as CardComponent;
    
    // Apply any inline configuration
    applyInlineConfiguration(card, processedConfig);
    
    return card;
  } catch (error) {
    console.error('Card creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create card: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createCard;