// src/components/card/content.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { CardContentConfig } from './types';

/**
 * Creates a card content component
 * @param {CardContentConfig} config - Content configuration
 * @returns {HTMLElement} Card content element
 */
export const createCardContent = (config: CardContentConfig = {}): HTMLElement => {
  const baseConfig = {
    ...config,
    componentName: 'card-content',
    prefix: PREFIX
  };

  try {
    const content = pipe(
      createBase,
      withElement({
        tag: 'div',
        componentName: 'card-content',
        className: [
          config.class,
          config.padding === false ? `${PREFIX}-card-content--no-padding` : null
        ],
        html: config.html,
        text: config.text
      })
    )(baseConfig);

    // Add children if provided
    if (Array.isArray(config.children)) {
      config.children.forEach(child => {
        if (child instanceof HTMLElement) {
          content.element.appendChild(child);
        }
      });
    }

    return content.element;
  } catch (error) {
    console.error('Card content creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create card content: ${error instanceof Error ? error.message : String(error)}`);
  }
};