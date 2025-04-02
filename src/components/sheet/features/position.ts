// src/components/sheet/features/position.ts
import { SheetConfig, SHEET_POSITIONS } from '../types';

/**
 * Adds position functionality to a component
 * @param {SheetConfig} config - Component configuration with position
 * @returns {Function} Higher-order function that adds position to a component
 */
export const withPosition = (config: SheetConfig) => (component) => {
  const { position = SHEET_POSITIONS.BOTTOM } = config;
  const positionClass = `${component.getClass('sheet')}--${position.toLowerCase()}`;
  
  // Add position class to element
  component.element.classList.add(positionClass);
  
  return {
    ...component,
    position: {
      /**
       * Changes the position of the component
       * @param {string} newPosition - New position value
       */
      setPosition(newPosition: string) {
        // Remove current position class
        component.element.classList.remove(positionClass);
        
        // Add new position class
        const newPositionClass = `${component.getClass('sheet')}--${newPosition.toLowerCase()}`;
        component.element.classList.add(newPositionClass);
      },
      
      /**
       * Gets the current position
       * @returns {string} Current position
       */
      getPosition() {
        return position;
      }
    }
  };
};
