// src/components/card/api.ts
import { BaseComponent, CardComponent, ApiOptions } from './types';

/**
 * Enhances a card component with API methods
 * 
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Card component
 */
export const withAPI = ({ lifecycle }: ApiOptions) => (component: BaseComponent): CardComponent => ({
  ...component,
  element: component.element,

  /**
   * Adds content to the card
   * 
   * @param {HTMLElement} contentElement - The content element to add
   * @returns {CardComponent} The card instance for chaining
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
   * Adds media to the card
   * 
   * @param {HTMLElement} mediaElement - The media element to add
   * @param {string} [position='top'] - Position to place media ('top', 'bottom')
   * @returns {CardComponent} The card instance for chaining
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
   * Sets the card actions section
   * 
   * @param {HTMLElement} actionsElement - The actions element to add
   * @returns {CardComponent} The card instance for chaining
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
   * Makes the card draggable
   * 
   * @param {Function} [dragStartCallback] - Callback for drag start event
   * @returns {CardComponent} The card instance for chaining
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
   * Sets focus to the card
   * Useful for programmatic focus management
   * 
   * @returns {CardComponent} The card instance for chaining
   */
  focus(): CardComponent {
    component.element.focus();
    return this;
  },

  /**
   * Destroys the card component and removes event listeners
   */
  destroy(): void {
    lifecycle.destroy();
  }
});