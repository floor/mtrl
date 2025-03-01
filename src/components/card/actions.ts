// src/components/card/actions.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { CardActionsConfig } from './types';

/**
 * Creates a card actions component
 * @param {CardActionsConfig} config - Actions configuration
 * @returns {HTMLElement} Card actions element
 */
export const createCardActions = (config: CardActionsConfig = {}): HTMLElement => {
  const baseConfig = {
    ...config,
    componentName: 'card-actions',
    prefix: PREFIX
  };

  try {
    const actions = pipe(
      createBase,
      withElement({
        tag: 'div',
        componentName: 'card-actions',
        className: [
          config.class,
          config.fullBleed ? `${PREFIX}-card-actions--full-bleed` : null,
          config.vertical ? `${PREFIX}-card-actions--vertical` : null,
          config.align ? `${PREFIX}-card-actions--${config.align}` : null
        ]
      })
    )(baseConfig);

    // Add action elements if provided
    if (Array.isArray(config.actions)) {
      config.actions.forEach(action => {
        if (action instanceof HTMLElement) {
          actions.element.appendChild(action);
        }
      });
    }

    return actions.element;
  } catch (error) {
    console.error('Card actions creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create card actions: ${error instanceof Error ? error.message : String(error)}`);
  }
};