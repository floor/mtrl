// src/components/card/header.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { createElement } from '../../core/dom/create';
import { CardHeaderConfig } from './types';

/**
 * Creates a card header component
 * @param {CardHeaderConfig} config - Header configuration
 * @returns {HTMLElement} Card header element
 */
export const createCardHeader = (config: CardHeaderConfig = {}): HTMLElement => {
  const baseConfig = {
    ...config,
    componentName: 'card-header',
    prefix: PREFIX
  };

  try {
    const header = pipe(
      createBase,
      withElement({
        tag: 'div',
        componentName: 'card-header',
        className: config.class
      })
    )(baseConfig);

    // Create text container
    const textContainer = createElement({
      tag: 'div',
      className: `${PREFIX}-card-header-text`,
      container: header.element
    });

    // Add title if provided
    if (config.title) {
      createElement({
        tag: 'h3',
        className: `${PREFIX}-card-header-title`,
        text: config.title,
        container: textContainer
      });
    }

    // Add subtitle if provided
    if (config.subtitle) {
      createElement({
        tag: 'h4',
        className: `${PREFIX}-card-header-subtitle`,
        text: config.subtitle,
        container: textContainer
      });
    }

    // Add avatar if provided
    if (config.avatar) {
      const avatarElement = typeof config.avatar === 'string'
        ? createElement({
          tag: 'div',
          className: `${PREFIX}-card-header-avatar`,
          html: config.avatar
        })
        : config.avatar;

      header.element.insertBefore(avatarElement, header.element.firstChild);
    }

    // Add action if provided
    if (config.action) {
      const actionElement = typeof config.action === 'string'
        ? createElement({
          tag: 'div',
          className: `${PREFIX}-card-header-action`,
          html: config.action
        })
        : config.action;

      header.element.appendChild(actionElement);
    }

    return header.element;
  } catch (error) {
    console.error('Card header creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create card header: ${error instanceof Error ? error.message : String(error)}`);
  }
};