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
 * @param {CardSchema} config - Card configuration object
 * @returns {CardComponent} Card component instance
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

    return card as CardComponent;
  } catch (error) {
    console.error('Card creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create card: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createCard;