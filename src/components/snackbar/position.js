// src/components/snackbar/position.js

import { SNACKBAR_POSITIONS } from './constants'

/**
 * Adds position handling to snackbar
 * @param {Object} config - Position configuration
 * @param {string} config.prefix - Component prefix
 * @param {string} config.position - Position variant (start, center, end)
 */
export const withPosition = (config) => (component) => {
  const position = config.position || SNACKBAR_POSITIONS.CENTER
  const positionClass = `${config.prefix}-snackbar--${position}`

  // Add position class
  component.element.classList.add(positionClass)

  // Method to update position
  const setPosition = (newPosition) => {
    // Remove current position class
    component.element.classList.remove(positionClass)

    // Add new position class
    const newPositionClass = `${config.prefix}-snackbar--${newPosition}`
    component.element.classList.add(newPositionClass)

    // Update visible state transform for center position
    if (component.element.classList.contains(`${config.prefix}-snackbar--visible`)) {
      if (newPosition === SNACKBAR_POSITIONS.CENTER) {
        component.element.style.transform = 'translateX(-50%) scale(1)'
      } else {
        component.element.style.transform = 'scale(1)'
      }
    }
  }

  return {
    ...component,
    position: {
      /**
       * Get current position
       * @returns {string} Current position
       */
      getPosition: () => position,

      /**
       * Set new position
       * @param {string} newPosition - New position to set
       * @returns {Object} Component instance
       */
      setPosition: (newPosition) => {
        if (Object.values(SNACKBAR_POSITIONS).includes(newPosition)) {
          setPosition(newPosition)
          return component
        } else {
          console.warn(`Invalid position: ${newPosition}. Using default: ${SNACKBAR_POSITIONS.CENTER}`)
          setPosition(SNACKBAR_POSITIONS.CENTER)
          return component
        }
      }
    }
  }
}
