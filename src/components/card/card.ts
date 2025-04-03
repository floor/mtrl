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
 * Creates a new Card component following Material Design 3 principles.
 * 
 * Material Design 3 Cards are surfaces that display content and actions about a single topic.
 * Cards can contain text, media, and UI controls. They provide entry points to more 
 * detailed information and can include interactive elements.
 * 
 * @param {CardSchema} config - Card configuration object
 * @returns {CardComponent} Card component instance with the following API methods:
 * - `addContent(contentElement)`: Adds content to the card
 * - `setHeader(headerElement)`: Sets the card header
 * - `addMedia(mediaElement, position)`: Adds media to the card
 * - `setActions(actionsElement)`: Sets the card actions section
 * - `makeDraggable(dragStartCallback)`: Makes the card draggable
 * - `focus()`: Sets focus to the card
 * - `destroy()`: Destroys the card component and removes event listeners
 * 
 * @throws {Error} Throws an error if card creation fails
 * @category Components
 * @example
 * ```typescript
 * // Create a basic card
 * const card = createCard({
 *   variant: 'elevated',
 *   header: {
 *     title: 'Card Title',
 *     subtitle: 'Secondary text'
 *   },
 *   content: {
 *     text: 'Card content goes here.'
 *   }
 * });
 * 
 * // Create an interactive card with actions
 * const cardWithActions = createCard({
 *   variant: 'filled',
 *   interactive: true,
 *   header: { title: 'Interactive Card' },
 *   content: { text: 'Click the buttons below.' },
 *   buttons: [
 *     { text: 'Action 1', variant: 'text' },
 *     { text: 'Action 2', variant: 'filled' }
 *   ]
 * });
 * 
 * // Card with media
 * const mediaCard = createCard({
 *   media: {
 *     src: '/path/to/image.jpg',
 *     alt: 'Descriptive alt text',
 *     aspectRatio: '16:9'
 *   },
 *   header: { title: 'Media Card' }
 * });
 * 
 * // Using API methods
 * const card = createCard();
 * const content = document.createElement('div');
 * content.className = 'mtrl-card-content';
 * content.textContent = 'Added programmatically';
 * card.addContent(content);
 * card.makeDraggable();
 * ```
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