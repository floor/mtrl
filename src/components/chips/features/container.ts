// src/components/chips/features/container.ts
import { ChipsConfig } from '../types';

/**
 * Adds container layout features to chips component
 * 
 * @param config Chips configuration
 * @returns Component enhancer that adds container layout functionality
 */
export const withContainer = (config: ChipsConfig) => component => {
  // Track current layout state
  const state = {
    scrollable: config.scrollable === true,
    vertical: config.vertical === true
  };
  
  return {
    ...component,
    
    // Layout management API
    layout: {
      /**
       * Sets the scrollable state of the chips container
       * @param {boolean} isScrollable - Whether the chips container should be scrollable
       * @returns Layout controller for chaining
       */
      setScrollable(isScrollable: boolean) {
        state.scrollable = isScrollable;
        
        if (component.element) {
          if (isScrollable) {
            component.element.classList.add(`${component.getClass('chips')}--scrollable`);
          } else {
            component.element.classList.remove(`${component.getClass('chips')}--scrollable`);
          }
        }
        
        return this;
      },
      
      /**
       * Gets the scrollable state
       * @returns {boolean} Whether the container is scrollable
       */
      isScrollable() {
        return state.scrollable;
      },
      
      /**
       * Sets the vertical layout state
       * @param {boolean} isVertical - Whether the chips container should be vertically stacked
       * @returns Layout controller for chaining
       */
      setVertical(isVertical: boolean) {
        state.vertical = isVertical;
        
        if (component.element) {
          if (isVertical) {
            component.element.classList.add(`${component.getClass('chips')}--vertical`);
          } else {
            component.element.classList.remove(`${component.getClass('chips')}--vertical`);
          }
        }
        
        return this;
      },
      
      /**
       * Gets the vertical state
       * @returns {boolean} Whether the container has vertical layout
       */
      isVertical() {
        return state.vertical;
      }
    }
  };
};