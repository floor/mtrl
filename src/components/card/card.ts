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
import { createBaseConfig, getElementConfig, getApiConfig, withInteractiveBehavior } from './config';

/**
 * Creates a new Card component following Material Design 3 principles
 * 
 * Material Design 3 Cards are surfaces that display content and actions about a single topic.
 * Cards can contain text, media, and UI controls.
 * 
 * @param {CardSchema} config - Card configuration object
 * @returns {CardComponent} Card component instance
 * 
 * @example
 * ```typescript
 * // Create a basic elevated card
 * const card = createCard();
 * 
 * // Create a filled card with content
 * const filledCard = createCard({
 *   variant: CardVariant.FILLED,
 *   contentConfig: { text: 'Card content' }
 * });
 * 
 * // Create an interactive outlined card
 * const interactiveCard = createCard({
 *   variant: CardVariant.OUTLINED,
 *   interactive: true,
 *   clickable: true,
 *   aria: { label: 'Click to view details' }
 * });
 * ```
 */
const createCard = (config: CardSchema = {}): CardComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const card = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      config.clickable ? withRipple(baseConfig) : (c: BaseComponent) => c,
      withLifecycle(),
      withInteractiveBehavior,
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    // Set initial elevation based on variant
    const element = (card as CardComponent).element;
    if (baseConfig.variant === 'elevated') {
      element.style.setProperty('--card-elevation', '1');
    } else {
      element.style.setProperty('--card-elevation', '0');
    }
    
    return card as CardComponent;
  } catch (error) {
    console.error('Card creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create card: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createCard;