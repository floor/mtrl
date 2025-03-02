// src/components/sheet/features/state.ts
import { SHEET_EVENTS } from '../constants';

/**
 * Adds state management functionality to a component
 * @param {Object} config - Component configuration with initial state
 * @returns {Function} Higher-order function that adds state to a component
 */
export const withState = (config) => (component) => {
  const { open: initialOpen = false, dismissible = true } = config;
  let isOpen = initialOpen;
  
  // Create scrim element
  const scrimElement = document.createElement('div');
  scrimElement.className = `${component.getClass('sheet')}-scrim`;
  
  // Add scrim after component in DOM
  component.element.parentNode?.insertBefore(scrimElement, component.element.nextSibling);
  
  // Mark as dismissible if configured
  if (dismissible) {
    component.element.classList.add(`${component.getClass('sheet')}--dismissible`);
    
    // Add click handler to scrim
    scrimElement.addEventListener('click', () => {
      if (dismissible) {
        close();
      }
    });
  }
  
  // Initialize component state
  if (initialOpen) {
    component.element.classList.add(`${component.getClass('sheet')}--open`);
  }
  
  // Add elevation class based on config
  if (config.elevation) {
    component.element.classList.add(`${component.getClass('sheet')}--elevation-${config.elevation}`);
  }
  
  // Add keyboard support (ESC to close)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen && dismissible) {
      close();
    }
  });
  
  /**
   * Opens the sheet
   */
  function open() {
    if (!isOpen) {
      isOpen = true;
      component.element.classList.add(`${component.getClass('sheet')}--open`);
      component.events.emit(SHEET_EVENTS.OPEN);
      
      if (config.onOpen) {
        config.onOpen();
      }
    }
  }
  
  /**
   * Closes the sheet
   */
  function close() {
    if (isOpen) {
      isOpen = false;
      component.element.classList.remove(`${component.getClass('sheet')}--open`);
      component.events.emit(SHEET_EVENTS.CLOSE);
      
      if (config.onClose) {
        config.onClose();
      }
    }
  }
  
  return {
    ...component,
    state: {
      open,
      close,
      
      /**
       * Checks if the sheet is open
       * @returns {boolean} Whether the sheet is open
       */
      isOpen() {
        return isOpen;
      },
      
      /**
       * Sets whether the sheet can be dismissed
       * @param {boolean} canDismiss - Whether the sheet can be dismissed
       */
      setDismissible(canDismiss: boolean) {
        if (canDismiss) {
          component.element.classList.add(`${component.getClass('sheet')}--dismissible`);
        } else {
          component.element.classList.remove(`${component.getClass('sheet')}--dismissible`);
        }
      }
    },
    
    /**
     * Initializes the component (called after creation)
     */
    initialize() {
      // Make sure scrim is in the correct DOM position
      if (scrimElement.parentNode !== component.element.parentNode) {
        component.element.parentNode?.insertBefore(scrimElement, component.element.nextSibling);
      }
    }
  };
};
