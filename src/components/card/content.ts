// src/components/card/content.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { createElement } from '../../core/dom/create';
import { CardContentConfig, CardHeaderConfig, CardMediaConfig, CardActionsConfig } from './types';

// Constants for content padding
export const CARD_CONTENT_PADDING = true;

/**
 * Creates a card content component
 * 
 * @param {CardContentConfig} config - Content configuration
 * @returns {HTMLElement} Card content element
 * 
 * @example
 * ```typescript
 * // Create text content
 * const textContent = createCardContent({ text: 'Simple text content' });
 * 
 * // Create HTML content with no padding
 * const htmlContent = createCardContent({
 *   html: '<p>Formatted <strong>HTML</strong> content</p>',
 *   padding: false
 * });
 * ```
 */
export const createCardContent = (config: CardContentConfig = {}): HTMLElement => {
  const baseConfig = {
    ...config,
    componentName: 'card-content',
    prefix: PREFIX
  };

  try {
    // Create element with innerHTML instead of html/text properties
    // for more reliable content rendering
    const content = pipe(
      createBase,
      withElement({
        tag: 'div',
        componentName: 'card-content',
        className: [
          config.class,
          config.padding === false ? `${PREFIX}-card-content--no-padding` : null
        ],
        attributes: {
          'role': 'region',
          // Add explicit style attributes to ensure visibility
          'style': 'display: block; color: inherit;'
        }
      })
    )(baseConfig);

    // Explicitly set the innerHTML for more reliable rendering
    if (config.html) {
      content.element.innerHTML = config.html;
    } else if (config.text) {
      // Wrap text in paragraph for proper formatting
      content.element.innerHTML = `<p>${config.text}</p>`;
    }

    // Add children if provided
    if (Array.isArray(config.children)) {
      config.children.forEach(child => {
        if (child instanceof HTMLElement) {
          content.element.appendChild(child);
        }
      });
    }

    // Add debug class to make troubleshooting easier
    // Remove this in production
    content.element.classList.add('debug-content');

    return content.element;
  } catch (error) {
    console.error('Card content creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create card content: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Creates a card header component
 * 
 * @param {CardHeaderConfig} config - Header configuration
 * @returns {HTMLElement} Card header element
 * 
 * @example
 * ```typescript
 * // Create a header with title and subtitle
 * const header = createCardHeader({
 *   title: 'Card Title',
 *   subtitle: 'Supporting text'
 * });
 * 
 * // Create a header with an avatar and action
 * const avatarHeader = createCardHeader({
 *   title: 'User Profile',
 *   avatar: '<img src="user.jpg" alt="User avatar">',
 *   action: createIconButton({ icon: 'more_vert' })
 * });
 * ```
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
        className: config.class,
        attributes: {
          'role': 'heading',
          'aria-level': '3' // Default heading level
        }
      })
    )(baseConfig);

    // Create text container for title and subtitle
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
        container: textContainer,
        attributes: {
          id: `${header.element.id || 'card-header'}-title`
        }
      });

      // Link the title ID to the card for accessibility if parent card exists
      const parentCard = header.element.closest(`.${PREFIX}-card`);
      if (parentCard && !parentCard.hasAttribute('aria-labelledby')) {
        parentCard.setAttribute('aria-labelledby', `${header.element.id || 'card-header'}-title`);
      }
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

      // Ensure avatar has correct ARIA attributes if it's an image
      const avatarImg = avatarElement.querySelector('img');
      if (avatarImg && !avatarImg.hasAttribute('alt')) {
        avatarImg.setAttribute('alt', ''); // Decorative image
        avatarImg.setAttribute('aria-hidden', 'true');
      }

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

/**
 * Creates a card actions component
 * 
 * @param {CardActionsConfig} config - Actions configuration
 * @returns {HTMLElement} Card actions element
 * 
 * @example
 * ```typescript
 * // Create simple actions container with buttons
 * const actions = createCardActions({
 *   actions: [
 *     createButton({ text: 'Cancel' }),
 *     createButton({ text: 'OK', variant: 'filled' })
 *   ],
 *   align: 'end'
 * });
 * 
 * // Create full-bleed actions
 * const fullBleedActions = createCardActions({
 *   actions: [createButton({ text: 'View Details', fullWidth: true })],
 *   fullBleed: true
 * });
 * ```
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
        ],
        attributes: {
          'role': 'group' // Semantically group actions together
        }
      })
    )(baseConfig);

    // Add action elements if provided
    if (Array.isArray(config.actions)) {
      config.actions.forEach((action, index) => {
        if (action instanceof HTMLElement) {
          // Ensure each action has accessible attributes
          if (!action.hasAttribute('aria-label') && 
              !action.hasAttribute('aria-labelledby') &&
              action.textContent?.trim() === '') {
            action.setAttribute('aria-label', `Action ${index + 1}`);
          }
          
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

/**
 * Creates a card media component
 * 
 * @param {CardMediaConfig} config - Media configuration
 * @returns {HTMLElement} Card media element
 * 
 * @example
 * ```typescript
 * // Create a media component with an image
 * const media = createCardMedia({
 *   src: 'image.jpg',
 *   alt: 'Descriptive alt text',
 *   aspectRatio: '16:9'
 * });
 * 
 * // Create a media component with a custom element
 * const customMedia = createCardMedia({
 *   element: videoElement,
 *   aspectRatio: '4:3'
 * });
 * ```
 */
export const createCardMedia = (config: CardMediaConfig = {}): HTMLElement => {
  const baseConfig = {
    ...config,
    componentName: 'card-media',
    prefix: PREFIX
  };

  try {
    const media = pipe(
      createBase,
      withElement({
        tag: 'div',
        componentName: 'card-media',
        className: [
          config.class,
          config.aspectRatio ? `${PREFIX}-card-media--${config.aspectRatio.replace(':', '-')}` : null,
          config.contain ? `${PREFIX}-card-media--contain` : null
        ]
      })
    )(baseConfig);

    // If custom element is provided, use it
    if (config.element instanceof HTMLElement) {
      media.element.appendChild(config.element);
    }
    // Otherwise create an image if src is provided
    else if (config.src) {
      const img = document.createElement('img');
      img.src = config.src;
      img.className = `${PREFIX}-card-media-img`;
      
      // Ensure alt text is always provided for accessibility
      img.alt = config.alt || '';
      if (!config.alt) {
        // If no alt text is provided, mark as decorative
        img.setAttribute('aria-hidden', 'true');
      }
      
      media.element.appendChild(img);
    }

    return media.element;
  } catch (error) {
    console.error('Card media creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create card media: ${error instanceof Error ? error.message : String(error)}`);
  }
};