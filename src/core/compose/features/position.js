// src/core/compose/features/position.js

/**
 * Available position values
 */
export const POSITIONS = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom',
  START: 'start',
  END: 'end',
  CENTER: 'center'
}

/**
 * Adds positioning functionality to a component
 * @param {Object} config - Component configuration
 * @param {string} config.position - Position value
 * @param {string} [config.prefix='mtrl'] - CSS class prefix
 * @param {string} [config.componentName] - Component name for class generation
 * @returns {Function} Component transformer
 */
export const withPosition = (config) => (component) => {
  if (!config.position || !component.element) return component

  const position = POSITIONS[config.position.toUpperCase()] || config.position
  const className = `${config.prefix}-${config.componentName}--${position}`

  component.element.classList.add(className)

  return {
    ...component,
    position: {
      /**
       * Sets the component's position
       * @param {string} newPosition - New position value
       * @returns {Object} Component instance
       */
      setPosition (newPosition) {
        const oldPosition = position
        const oldClassName = `${config.prefix}-${config.componentName}--${oldPosition}`
        const newClassName = `${config.prefix}-${config.componentName}--${newPosition}`

        component.element.classList.remove(oldClassName)
        component.element.classList.add(newClassName)

        return this
      },

      /**
       * Gets the current position
       * @returns {string} Current position
       */
      getPosition () {
        return position
      }
    }
  }
}
