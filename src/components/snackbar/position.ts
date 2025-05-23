// src/components/snackbar/position.ts
import { BaseComponent, SnackbarPosition } from './types';
import { SNACKBAR_POSITIONS } from './constants';

/**
 * Position configuration for the withPosition function
 */
interface PositionConfig {
  prefix?: string;
  position?: SnackbarPosition;
}

/**
 * Adds position handling to snackbar
 * @param {PositionConfig} config - Position configuration
 * @returns {Function} Higher-order function that adds position features
 */
export const withPosition = (config: PositionConfig) => 
  (component: BaseComponent): BaseComponent => {
    const position = config.position || SNACKBAR_POSITIONS.CENTER;
    const prefix = config.prefix || 'mtrl';
    const positionClass = `${prefix}-snackbar--${position}`;

    // Add position class
    component.element.classList.add(positionClass);

    // Method to update position
    const setPosition = (newPosition: SnackbarPosition): void => {
      // Remove current position class
      component.element.classList.remove(positionClass);

      // Add new position class
      const newPositionClass = `${prefix}-snackbar--${newPosition}`;
      component.element.classList.add(newPositionClass);

      // Update visible state transform for center position
      if (component.element.classList.contains(`${prefix}-snackbar--visible`)) {
        if (newPosition === SNACKBAR_POSITIONS.CENTER) {
          component.element.style.transform = 'translateX(-50%) scale(1)';
        } else {
          component.element.style.transform = 'scale(1)';
        }
      }
    };

    return {
      ...component,
      position: {
        /**
         * Get current position
         * @returns {string} Current position
         */
        getPosition: (): SnackbarPosition => position as SnackbarPosition,

        /**
         * Set new position
         * @param {string} newPosition - New position to set
         * @returns {BaseComponent} Component instance
         */
        setPosition: (newPosition: SnackbarPosition): BaseComponent => {
          if (Object.values(SNACKBAR_POSITIONS).includes(newPosition)) {
            setPosition(newPosition);
            return component;
          } else {
            console.warn(`Invalid position: ${newPosition}. Using default: ${SNACKBAR_POSITIONS.CENTER}`);
            setPosition(SNACKBAR_POSITIONS.CENTER);
            return component;
          }
        }
      }
    };
  };