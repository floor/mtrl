// src/components/card/api.ts
import { BaseComponent, CardComponent, ApiOptions } from './types';

/**
 * Enhances a card component with API methods.
 * This follows the higher-order function pattern to add public API methods
 * to the component, making them available to the end user.
 * 
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @category Components
 */
/**
 * The card as the pipe hands it over: the API sets `config` from the options,
 * and addClass returns the card itself once the API wraps it
 * @internal
 */
type ComponentWithElements = Omit<BaseComponent, 'config' | 'addClass'> & {
  addClass: (...classes: string[]) => unknown;
};

export const withAPI = ({ lifecycle, config }: ApiOptions) => (component: ComponentWithElements): CardComponent => ({
  ...component,
  element: component.element,
  config,

  /**
   * Adds content to the card.
   * This method appends content to the card component.
   * 
   * @param {HTMLElement} contentElement - The content element to add
   * @returns {CardComponent} The card instance for chaining
   * @example
   * ```typescript
   * const content = document.createElement('div');
   * content.className = 'mtrl-card__content';
   * content.textContent = 'Card content goes here';
   * card.addContent(content);
   * ```
   */
  addContent(contentElement: HTMLElement): CardComponent {
    if (contentElement && contentElement.classList.contains(`${component.getClass('card')}__content`)) {
      component.element.appendChild(contentElement);
    }
    return this;
  },

  /**
   * Sets the card header
   * 
   * Places the header element in the card. When media elements exist,
   * the header is placed after the last media element to ensure proper 
   * visual hierarchy following Material Design guidelines.
   * 
   * @param {HTMLElement} headerElement - The header element to add
   * @returns {CardComponent} The card instance for chaining
   * @example
   * ```typescript
   * // Add a header after media
   * card.setHeader(headerElement);
   * ```
   */
  setHeader(headerElement: HTMLElement): CardComponent {
    const card = component.getClass('card');
    if (headerElement && headerElement.classList.contains(`${card}__header`)) {
      const title = (header: Element | null) =>
        header?.querySelector(`.${card}__header-title`)?.id || null;

      // Remove existing header if present, and the name it gave the card
      const existingHeader = component.element.querySelector(`.${card}__header`);
      if (existingHeader) {
        const previous = title(existingHeader);
        if (previous && component.element.getAttribute('aria-labelledby') === previous) {
          component.element.removeAttribute('aria-labelledby');
        }
        existingHeader.remove();
      }

      // The header follows the media at the top of the card; media added at the
      // bottom stays below it.
      let before = component.element.firstElementChild;
      while (before && before.classList.contains(`${card}__media`)) {
        before = before.nextElementSibling;
      }
      component.element.insertBefore(headerElement, before);

      // Name the card with its title unless it already has a name
      const titleId = title(headerElement);
      if (
        titleId &&
        !component.element.hasAttribute('aria-labelledby') &&
        !component.element.hasAttribute('aria-label')
      ) {
        component.element.setAttribute('aria-labelledby', titleId);
      }
    }
    return this;
  },

  /**
   * Adds media to the card.
   * Places media elements at the specified position in the card.
   * 
   * @param {HTMLElement} mediaElement - The media element to add
   * @param {string} [position='top'] - Position to place media ('top', 'bottom')
   * @returns {CardComponent} The card instance for chaining
   * @example
   * ```typescript
   * // Creating media element
   * const media = document.createElement('div');
   * media.className = 'mtrl-card__media';
   * 
   * // Adding at the top (default)
   * card.addMedia(media);
   * 
   * // Or adding at the bottom
   * card.addMedia(media, 'bottom');
   * ```
   */
  addMedia(mediaElement: HTMLElement, position: 'top' | 'bottom' = 'top'): CardComponent {
    if (mediaElement && mediaElement.classList.contains(`${component.getClass('card')}__media`)) {
      if (position === 'top') {
        component.element.insertBefore(mediaElement, component.element.firstChild);
      } else {
        component.element.appendChild(mediaElement);
      }
    }
    return this;
  },

  /**
   * Sets the card actions section.
   * Replaces any existing actions with the provided actions element.
   * Actions typically contain buttons or other interactive controls,
   * and are placed at the bottom of the card.
   * 
   * @param {HTMLElement} actionsElement - The actions element to add
   * @returns {CardComponent} The card instance for chaining
   * @example
   * ```typescript
   * // Create actions container
   * const actions = document.createElement('div');
   * actions.className = 'mtrl-card__actions';
   * 
   * // Add buttons to actions
   * const button = document.createElement('button');
   * button.textContent = 'Action';
   * actions.appendChild(button);
   * 
   * // Set actions on card
   * card.setActions(actions);
   * ```
   */
  setActions(actionsElement: HTMLElement): CardComponent {
    if (actionsElement && actionsElement.classList.contains(`${component.getClass('card')}__actions`)) {
      // Remove existing actions if present
      const existingActions = component.element.querySelector(`.${component.getClass('card')}__actions`);
      if (existingActions) {
        existingActions.remove();
      }

      // Add actions at the end
      component.element.appendChild(actionsElement);
    }
    return this;
  },

  /**
   * Makes the card draggable.
   * Sets up native HTML5 drag and drop functionality and adds appropriate
   * accessibility attributes. Automatically updates ARIA attributes during drag.
   * 
   * @param {Function} [dragStartCallback] - Callback for drag start event
   * @returns {CardComponent} The card instance for chaining
   * @example
   * ```typescript
   * // Basic draggable card
   * card.makeDraggable();
   * 
   * // With custom drag start handler
   * card.makeDraggable((event) => {
   *   // Set custom data or perform other actions on drag start
   *   event.dataTransfer.setData('text/plain', 'Card data');
   * });
   * ```
   */
  makeDraggable(dragStartCallback?: (event: DragEvent) => void): CardComponent {
    component.element.setAttribute('draggable', 'true');
    component.element.setAttribute('aria-grabbed', 'false');

    // The grabbed state is maintained whether or not a callback was given.
    // These listeners used to live inside the callback branch, so a card made
    // draggable without one reported itself as not grabbed for the whole drag.
    component.element.addEventListener('dragstart', (e: DragEvent) => {
      component.element.setAttribute('aria-grabbed', 'true');
      if (typeof dragStartCallback === 'function') dragStartCallback(e);
    });

    component.element.addEventListener('dragend', () => {
      component.element.setAttribute('aria-grabbed', 'false');
    });

    return this;
  },

  /**
   * Sets focus to the card.
   * Useful for programmatic focus management, especially in keyboard navigation
   * scenarios or after dynamic content changes.
   * 
   * @returns {CardComponent} The card instance for chaining
   * @example
   * ```typescript
   * // Focus the card
   * card.focus();
   * 
   * // Can be chained with other methods
   * card.setHeader(headerElement).focus();
   * ```
   */
  focus(): CardComponent {
    component.element.focus();
    return this;
  },

  /**
   * Adds CSS classes to the card element.
   * 
   * @param classes - One or more class names to add
   * @returns {CardComponent} The card instance for chaining
   */
  addClass(...classes: string[]): CardComponent {
    component.addClass(...classes);
    return this;
  },

  /**
   * Destroys the card component and removes event listeners.
   * Call this method when the card is no longer needed to prevent memory leaks.
   * 
   * @example
   * ```typescript
   * // Clean up resources when done with the card
   * card.destroy();
   * ```
   */
  destroy(): void {
    lifecycle.destroy();
  }
});