// src/components/chips/features/container.ts
import { ChipsConfig } from '../types';

/**
 * Adds container layout features to chips component
 * 
 * @param config Chips configuration
 * @returns Component enhancer that adds container layout functionality
 */
/** What this feature reads off the component it is handed. */
interface ContainerHost {
  element: HTMLElement;
  getClass: (name: string) => string;
}

export const withContainer =
  (config: ChipsConfig) =>
  // Generic, so the accumulated pipeline type survives to the features after
  // this one. A concrete parameter type would erase it — the defect fixed in
  // textfield's withDensity (#109).
  <C extends ContainerHost>(component: C) => {
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