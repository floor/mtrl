// src/components/card/api.js

/**
 * Enhances a card component with API methods
 * @param {Object} options - API configuration options
 * @param {Object} options.lifecycle - Object containing lifecycle methods
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Card component
 */
export const withAPI = ({ lifecycle }) => (component) => ({
  ...component,
  element: component.element,

  /**
   * Adds content to the card
   * @param {HTMLElement} contentElement - The content element to add
   * @returns {Object} The card instance for chaining
   */
  addContent (contentElement) {
    if (contentElement && contentElement.classList.contains(`${component.getClass('card')}-content`)) {
      component.element.appendChild(contentElement)
    }
    return this
  },

  /**
   * Sets the card header
   * @param {HTMLElement} headerElement - The header element to add
   * @returns {Object} The card instance for chaining
   */
  setHeader (headerElement) {
    if (headerElement && headerElement.classList.contains(`${component.getClass('card')}-header`)) {
      // Remove existing header if present
      const existingHeader = component.element.querySelector(`.${component.getClass('card')}-header`)
      if (existingHeader) {
        existingHeader.remove()
      }

      // Insert at the beginning of the card
      component.element.insertBefore(headerElement, component.element.firstChild)
    }
    return this
  },

  /**
   * Adds media to the card
   * @param {HTMLElement} mediaElement - The media element to add
   * @param {string} [position='top'] - Position to place media ('top', 'bottom')
   * @returns {Object} The card instance for chaining
   */
  addMedia (mediaElement, position = 'top') {
    if (mediaElement && mediaElement.classList.contains(`${component.getClass('card')}-media`)) {
      if (position === 'top') {
        component.element.insertBefore(mediaElement, component.element.firstChild)
      } else {
        component.element.appendChild(mediaElement)
      }
    }
    return this
  },

  /**
   * Sets the card actions section
   * @param {HTMLElement} actionsElement - The actions element to add
   * @returns {Object} The card instance for chaining
   */
  setActions (actionsElement) {
    if (actionsElement && actionsElement.classList.contains(`${component.getClass('card')}-actions`)) {
      // Remove existing actions if present
      const existingActions = component.element.querySelector(`.${component.getClass('card')}-actions`)
      if (existingActions) {
        existingActions.remove()
      }

      // Add actions at the end
      component.element.appendChild(actionsElement)
    }
    return this
  },

  /**
   * Makes the card draggable
   * @param {Function} [dragStartCallback] - Callback for drag start event
   * @returns {Object} The card instance for chaining
   */
  makeDraggable (dragStartCallback) {
    component.element.setAttribute('draggable', 'true')

    if (typeof dragStartCallback === 'function') {
      component.element.addEventListener('dragstart', dragStartCallback)
    }

    return this
  },

  /**
   * Destroys the card component and removes event listeners
   */
  destroy () {
    lifecycle.destroy()
  }
})
