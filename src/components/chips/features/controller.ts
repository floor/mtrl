// src/components/chips/features/controller.ts
import { ChipsConfig } from '../types';
import createChip from '../chip/chip';
import { CHIPS_EVENTS } from '../constants';

/**
 * Add controller functionality to chips component
 * Manages state, events, user interactions, and UI rendering
 * 
 * @param config Chips configuration
 * @returns Component enhancer with chips controller functionality
 */
export const withController = (config: ChipsConfig) => component => {
  // Ensure component has required properties
  if (!component.element || !component.components) {
    console.warn('Cannot initialize chips controller: missing element or components');
    return component;
  }
  
  // Store event listeners
  const eventListeners = {
    change: [],
    add: [],
    remove: []
  };
  
  // Track current focused chip index for keyboard navigation
  let focusedChipIndex = -1;
  
  /**
   * Dispatches custom events to registered handlers
   * @param {string} eventName - Name of the event to trigger
   * @param {any[]} args - Arguments to pass to the handlers
   */
  const dispatchEvent = (eventName, ...args) => {
    if (eventListeners[eventName]) {
      eventListeners[eventName].forEach(handler => handler(...args));
    }
  };

  const handleSelection = (selectedChip) => {
    // Always ensure the chip's class is set correctly
    if (selectedChip.isSelected()) {
      selectedChip.element.classList.add(`${component.getClass('chip')}--selected`);
      selectedChip.element.setAttribute('aria-selected', 'true');
    } else {
      selectedChip.element.classList.remove(`${component.getClass('chip')}--selected`);
      selectedChip.element.setAttribute('aria-selected', 'false');
    }

    if (!config.multiSelect) {
      // Single selection mode - deselect all other chips
      component.chipInstances.forEach(chip => {
        if (chip !== selectedChip && chip.isSelected()) {
          chip.setSelected(false);
          chip.element.classList.remove(`${component.getClass('chip')}--selected`);
          chip.element.setAttribute('aria-selected', 'false');
        }
      });
      
      // If this was a deselection, and it's the only selected chip in single-select mode,
      // prevent deselection (keep it selected)
      if (!selectedChip.isSelected() && getSelectedChips().length === 0) {
        selectedChip.setSelected(true);
        selectedChip.element.classList.add(`${component.getClass('chip')}--selected`);
        selectedChip.element.setAttribute('aria-selected', 'true');
      }
    } else {
      // In multi-select mode, we allow deselection of all chips
      // No need to enforce at least one selection
    }

    // Get all currently selected chips and their values
    const selectedChips = component.chipInstances.filter(chip => chip.isSelected());
    const selectedValues = selectedChips.map(chip => chip.getValue());
    const changedValue = selectedChip ? selectedChip.getValue() : null;
    
    // Call onChange callback if provided
    if (typeof config.onChange === 'function') {
      config.onChange(selectedValues, changedValue);
    }
    
    // Dispatch change event to all registered handlers
    dispatchEvent(CHIPS_EVENTS.CHANGE, selectedValues, changedValue);
  };
  
  /**
   * Handles keyboard navigation between chips
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyboardNavigation = (event) => {
    if (component.chipInstances.length === 0) return;

    // Only handle arrow keys, Enter, and Space
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(event.key)) {
      return;
    }

    // Handle enter and space for activation/selection
    if (event.key === 'Enter' || event.key === ' ') {
      if (focusedChipIndex >= 0 && focusedChipIndex < component.chipInstances.length) {
        event.preventDefault();
        const chip = component.chipInstances[focusedChipIndex];
        if (!chip.isDisabled()) {
          chip.toggleSelected();
          
          // Ensure selection state is reflected in the DOM
          if (chip.isSelected()) {
            chip.element.classList.add(`${component.getClass('chip')}--selected`);
            chip.element.setAttribute('aria-selected', 'true');
          } else {
            chip.element.classList.remove(`${component.getClass('chip')}--selected`);
            chip.element.setAttribute('aria-selected', 'false');
          }
          
          handleSelection(chip);
        }
        return;
      }
    }

    // Handle navigation keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const isVertical = component.layout && component.layout.isVertical();
      let newIndex = focusedChipIndex;

      // If no chip is focused, start with the first one
      if (focusedChipIndex === -1) {
        newIndex = 0;
      } else {
        // Move based on key and layout direction
        if ((isVertical && event.key === 'ArrowUp') || (!isVertical && event.key === 'ArrowLeft')) {
          newIndex = Math.max(0, focusedChipIndex - 1);
        } else if ((isVertical && event.key === 'ArrowDown') || (!isVertical && event.key === 'ArrowRight')) {
          newIndex = Math.min(component.chipInstances.length - 1, focusedChipIndex + 1);
        }
      }

      // Update focus if changed
      if (newIndex !== focusedChipIndex) {
        // Remove focus from current chip
        if (focusedChipIndex >= 0 && focusedChipIndex < component.chipInstances.length) {
          component.chipInstances[focusedChipIndex].element.blur();
        }

        // Focus new chip
        focusedChipIndex = newIndex;
        component.chipInstances[focusedChipIndex].element.focus();
        
        // If scrollable, ensure the focused chip is visible
        if (component.layout && component.layout.isScrollable()) {
          scrollToChip(focusedChipIndex);
        }
      }
    }
  };
  
  /**
   * Scrolls the chips container to make a specific chip visible
   * @param {ChipComponent|number} chipOrIndex - Chip instance or index to scroll to
   */
  const scrollToChip = (chipOrIndex) => {
    const isScrollable = component.layout && component.layout.isScrollable();
    if (!isScrollable) return;
    
    const index = typeof chipOrIndex === 'number'
      ? chipOrIndex
      : component.chipInstances.indexOf(chipOrIndex);
      
    if (index >= 0 && index < component.chipInstances.length) {
      const chipElement = component.chipInstances[index].element;
      const container = component.components.chipContainer || component.element;
      
      // Calculate scroll position to center the chip
      const containerRect = container.getBoundingClientRect();
      const chipRect = chipElement.getBoundingClientRect();
      
      const isVertical = component.layout && component.layout.isVertical();
      
      if (isVertical) {
        // For vertical scroll
        const scrollTop = chipElement.offsetTop - container.offsetTop - 
          (containerRect.height / 2) + (chipRect.height / 2);
        
        container.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        });
      } else {
        // For horizontal scroll
        const scrollLeft = chipElement.offsetLeft - container.offsetLeft - 
          (containerRect.width / 2) + (chipRect.width / 2);
        
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }
  };
  
  /**
   * Adds a chip to the chips container
   * @param {Object} chipConfig - Configuration for the chip
   * @returns {ChipComponent} The created chip instance
   */
  const addChip = (chipConfig) => {
    // CHANGE: Remove the onSelect handler that calls handleSelection
    const chipInstance = createChip({
      ...chipConfig,
      // Only pass through the user's onSelect handler, don't create a path to handleSelection
      onSelect: chipConfig.onSelect
    });

    // Get the container element to append to
    const container = component.components.chipContainer || component.element;
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    fragment.appendChild(chipInstance.element);
    container.appendChild(fragment);
    
    component.chipInstances.push(chipInstance);

    // This click handler is the ONLY path to handleSelection
    chipInstance.element.addEventListener('click', () => {
      if (!chipInstance.isDisabled()) {
        chipInstance.toggleSelected();
        
        // Explicitly ensure selected state reflects in the DOM
        if (chipInstance.isSelected()) {
          chipInstance.element.classList.add(`${component.getClass('chip')}--selected`);
          chipInstance.element.setAttribute('aria-selected', 'true');
        } else {
          chipInstance.element.classList.remove(`${component.getClass('chip')}--selected`);
          chipInstance.element.setAttribute('aria-selected', 'false');
        }
        
        handleSelection(chipInstance);
        
        // Update focus tracking
        focusedChipIndex = component.chipInstances.indexOf(chipInstance);
      }
    });

    // Dispatch add event
    dispatchEvent(CHIPS_EVENTS.ADD, chipInstance);

    return chipInstance;
  };
  
  /**
   * Removes a chip from the chips container
   * @param {ChipComponent|number} chipOrIndex - Chip instance or index to remove
   */
  const removeChip = (chipOrIndex) => {
    const index = typeof chipOrIndex === 'number'
      ? chipOrIndex
      : component.chipInstances.indexOf(chipOrIndex);

    if (index >= 0 && index < component.chipInstances.length) {
      const chip = component.chipInstances[index];
      
      // Dispatch remove event before actual removal
      dispatchEvent(CHIPS_EVENTS.REMOVE, chip);
      
      chip.destroy();
      component.chipInstances.splice(index, 1);
      
      // Update focused index if needed
      if (index === focusedChipIndex) {
        focusedChipIndex = -1;
      } else if (index < focusedChipIndex) {
        focusedChipIndex--;
      }
    }
  };
  
  /**
   * Gets all chip instances in the container
   * @returns {ChipComponent[]} Array of chip instances
   */
  const getChips = () => {
    return [...component.chipInstances];
  };
  
  /**
   * Gets currently selected chips
   * @returns {ChipComponent[]} Array of selected chip instances
   */
  const getSelectedChips = () => {
    return component.chipInstances.filter(chip => chip.isSelected());
  };
  
  /**
   * Gets the values of selected chips
   * @returns {(string|null)[]} Array of selected chip values
   */
  const getSelectedValues = () => {
    return getSelectedChips().map(chip => chip.getValue());
  };
  
  /**
   * Selects chips by their values
   * @param {string|string[]} values - Value or array of values to select
   * @param {boolean} triggerEvent - Whether to trigger change event (default: true)
   */
  const selectByValue = (values, triggerEvent = true, exclusive = !config.multiSelect) => {
    const valueArray = Array.isArray(values) ? values : [values];
    let selectionChanged = false;

    if (exclusive) {
      // First handle deselection if exclusive mode
      component.chipInstances.forEach(chip => {
        const shouldSelect = valueArray.includes(chip.getValue());
        if (!shouldSelect && chip.isSelected()) {
          chip.setSelected(false);
          chip.element.classList.remove(`${component.getClass('chip')}--selected`);
          chip.element.setAttribute('aria-selected', 'false');
          selectionChanged = true;
        }
      });
    }

    // Then handle selection
    component.chipInstances.forEach(chip => {
      const shouldSelect = valueArray.includes(chip.getValue());
      if (shouldSelect && !chip.isSelected()) {
        chip.setSelected(true);
        chip.element.classList.add(`${component.getClass('chip')}--selected`);
        chip.element.setAttribute('aria-selected', 'true');
        selectionChanged = true;
      }
    });

    
    // Dispatch change event if any chip selection has changed AND if triggerEvent is true
    if (selectionChanged && triggerEvent) {
      const selectedValues = getSelectedValues();
      dispatchEvent(CHIPS_EVENTS.CHANGE, selectedValues, null);
    }
  };
  
  /**
   * Clears all selections
   * @param {boolean} triggerEvent - Whether to trigger change event (default: true)
   */
  const clearSelection = (triggerEvent = true) => {
    const selectedValues = getSelectedValues();
    const hadSelectedChips = selectedValues.length > 0;
    
    component.chipInstances.forEach(chip => {
      chip.setSelected(false);
      chip.element.classList.remove(`${component.getClass('chip')}--selected`);
      chip.element.setAttribute('aria-selected', 'false');
    });
    
    // Only dispatch if there were actually chips deselected AND triggerEvent is true
    if (hadSelectedChips && triggerEvent) {
      dispatchEvent(CHIPS_EVENTS.CHANGE, [], null);
    }
  };
  
  /**
   * Enables keyboard navigation between chips in the container
   */
  const enableKeyboardNavigation = () => {
    // Add keyboard event listener to the chips container
    component.element.tabIndex = 0; // Make the chips container focusable
    component.element.addEventListener('keydown', handleKeyboardNavigation);
  };
  
  /**
   * Disables keyboard navigation
   */
  const disableKeyboardNavigation = () => {
    component.element.removeEventListener('keydown', handleKeyboardNavigation);
  };
  
  // Initialize keyboard navigation
  enableKeyboardNavigation();
  
  // Setup event listeners when element is available
  if (component.element) {
    component.element.addEventListener('keydown', handleKeyboardNavigation);
  }
  
  // Setup lifecycle cleanup
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    
    component.lifecycle.destroy = () => {
      // Clean up event listeners
      component.element.removeEventListener('keydown', handleKeyboardNavigation);
      
      // Clean up all chip instances
      component.chipInstances.forEach(chip => chip.destroy());
      component.chipInstances.length = 0;
      
      // Clear all event listeners
      Object.keys(eventListeners).forEach(event => {
        eventListeners[event] = [];
      });
      
      // Call original destroy
      originalDestroy();
    };
  }
  
  return {
    ...component,
    // Add chips controller feature
    chips: {
      addChip,
      removeChip,
      getChips,
      getSelectedChips,
      getSelectedValues,
      selectByValue,
      clearSelection,
      scrollToChip
    },
    // Add keyboard navigation feature
    keyboard: {
      enable: enableKeyboardNavigation,
      disable: disableKeyboardNavigation
    },
    // Event management
    on(event, handler) {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      
      eventListeners[event].push(handler);
      return this;
    },
    off(event, handler) {
      if (eventListeners[event]) {
        const index = eventListeners[event].indexOf(handler);
        if (index !== -1) {
          eventListeners[event].splice(index, 1);
        }
      }
      return this;
    }
  };
};