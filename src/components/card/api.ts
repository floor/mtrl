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
export const withAPI = ({ lifecycle }: ApiOptions) => (component: BaseComponent): CardComponent => ({
  ...component,
  element: component.element,

  /**
   * Adds content to the card.
   * This method appends content to the card component.
   * 
   * @param {HTMLElement} contentElement - The content element to add
   * @returns {CardComponent} The card instance for chaining
   * @example
   * ```typescript
   * const content = document.createElement('div');
   * content.className = 'mtrl-card-content';
   * content.textContent = 'Card content goes here';
   * card.addContent(content);
   * ```
   */
  addContent(contentElement: HTMLElement): CardComponent {
    if (contentElement && contentElement.classList.contains(`${component.getClass('card')}-content`)) {
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
    if (headerElement && headerElement.classList.contains(`${component.getClass('card')}-header`)) {
      // Remove existing header if present
      const existingHeader = component.element.querySelector(`.${component.getClass('card')}-header`);
      if (existingHeader) {
        existingHeader.remove();
      }

      // Look for media element
      const mediaElement = component.element.querySelector(`.${component.getClass('card')}-media`);
      
      if (mediaElement) {
        // If media exists, insert after the LAST media element
        // Find all media elements
        const mediaElements = component.element.querySelectorAll(`.${component.getClass('card')}-media`);
        const lastMedia = mediaElements[mediaElements.length - 1];
        
        // Insert after the last media element
        if (lastMedia.nextSibling) {
          component.element.insertBefore(headerElement, lastMedia.nextSibling);
        } else {
          component.element.appendChild(headerElement);
        }
      } else {
        // No media, insert at the beginning
        component.element.insertBefore(headerElement, component.element.firstChild);
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
   * media.className = 'mtrl-card-media';
   * 
   * // Adding at the top (default)
   * card.addMedia(media);
   * 
   * // Or adding at the bottom
   * card.addMedia(media, 'bottom');
   * ```
   */
  addMedia(mediaElement: HTMLElement, position: 'top' | 'bottom' = 'top'): CardComponent {
    if (mediaElement && mediaElement.classList.contains(`${component.getClass('card')}-media`)) {
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
   * actions.className = 'mtrl-card-actions';
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
    if (actionsElement && actionsElement.classList.contains(`${component.getClass('card')}-actions`)) {
      // Remove existing actions if present
      const existingActions = component.element.querySelector(`.${component.getClass('card')}-actions`);
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

    if (typeof dragStartCallback === 'function') {
      component.element.addEventListener('dragstart', (e: DragEvent) => {
        component.element.setAttribute('aria-grabbed', 'true');
        dragStartCallback(e);
      });
      
      component.element.addEventListener('dragend', () => {
        component.element.setAttribute('aria-grabbed', 'false');
      });
    }

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