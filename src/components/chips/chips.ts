// src/components/chips/chips.ts
import { PREFIX } from '../../core/config';
import createChip from './chip/chip';
import { ChipComponent, ChipsConfig, ChipsComponent } from './types';

/**
 * Creates a chips container for grouping related chips
 * @param {ChipsConfig} config - Chips configuration
 * @returns {ChipsComponent} Chips component instance
 */
const createChips = (config: ChipsConfig = {}): ChipsComponent => {
  const {
    chips = [],
    scrollable = false,
    vertical = false,
    class: customClass,
    selector = null,
    multiSelect = false,
    onChange = null
  } = config;

  // Create container element
  const element = document.createElement('div');
  element.className = `${PREFIX}-chips`;

  if (customClass) {
    element.classList.add(customClass);
  }

  if (scrollable) {
    element.classList.add(`${PREFIX}-chips--scrollable`);
  }

  if (vertical) {
    element.classList.add(`${PREFIX}-chips--vertical`);
  }

  // Store chip instances
  const chipInstances: ChipComponent[] = [];
  
  // Event listeners storage
  const eventListeners: Record<string, Function[]> = {
    change: []
  };

  // Track current focused chip index for keyboard navigation
  let focusedChipIndex = -1;

  /**
   * Dispatches custom events to registered handlers
   * @param {string} eventName - Name of the event to trigger
   * @param {any[]} args - Arguments to pass to the handlers
   */
  const dispatchEvent = (eventName: string, ...args: any[]): void => {
    if (eventListeners[eventName]) {
      eventListeners[eventName].forEach(handler => handler(...args));
    }
  };

  /**
   * Updates chip selection states based on multiSelect configuration
   * @param {ChipComponent} selectedChip - The chip that was clicked/selected
   */
  const handleSelection = (selectedChip: ChipComponent): void => {
    if (!multiSelect) {
      // Single selection mode - deselect all other chips
      chipInstances.forEach(chip => {
        if (chip !== selectedChip && chip.isSelected()) {
          chip.setSelected(false);
        }
      });
    }

    // Get all currently selected chips and their values
    const selectedChips = chipInstances.filter(chip => chip.isSelected());
    const selectedValues = selectedChips.map(chip => chip.getValue());
    const changedValue = selectedChip ? selectedChip.getValue() : null;
    
    // Call onChange callback if provided
    if (typeof onChange === 'function') {
      onChange(selectedValues, changedValue);
    }
    
    // Dispatch change event to all registered handlers
    dispatchEvent('change', selectedValues, changedValue);
  };

  /**
   * Handles keyboard navigation between chips
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyboardNavigation = (event: KeyboardEvent): void => {
    if (chipInstances.length === 0) return;

    // Only handle arrow keys
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    let newIndex = focusedChipIndex;

    // If no chip is focused, start with the first one
    if (focusedChipIndex === -1) {
      newIndex = 0;
    } else {
      // Move based on key and layout direction
      if ((vertical && event.key === 'ArrowUp') || (!vertical && event.key === 'ArrowLeft')) {
        newIndex = Math.max(0, focusedChipIndex - 1);
      } else if ((vertical && event.key === 'ArrowDown') || (!vertical && event.key === 'ArrowRight')) {
        newIndex = Math.min(chipInstances.length - 1, focusedChipIndex + 1);
      }
    }

    // Update focus if changed
    if (newIndex !== focusedChipIndex) {
      // Remove focus from current chip
      if (focusedChipIndex >= 0 && focusedChipIndex < chipInstances.length) {
        chipInstances[focusedChipIndex].element.blur();
      }

      // Focus new chip
      focusedChipIndex = newIndex;
      chipInstances[focusedChipIndex].element.focus();
      
      // If scrollable, ensure the focused chip is visible
      if (scrollable) {
        scrollToChip(focusedChipIndex);
      }
    }
  };

  /**
   * Adds a chip to the chips container
   * @param {Object} chipConfig - Configuration for the chip
   * @returns {ChipComponent} The created chip instance
   */
  const addChip = (chipConfig: any): ChipComponent => {
    const chipInstance = createChip({
      ...chipConfig,
      onSelect: (chip: ChipComponent) => {
        handleSelection(chip);
        if (chipConfig.onSelect) {
          chipConfig.onSelect(chip);
        }
      }
    });

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    fragment.appendChild(chipInstance.element);
    element.appendChild(fragment);
    
    chipInstances.push(chipInstance);

    // Add click handler to toggle selection
    chipInstance.element.addEventListener('click', () => {
      if (!chipInstance.isDisabled()) {
        chipInstance.toggleSelected();
        handleSelection(chipInstance);
        
        // Update focus tracking
        focusedChipIndex = chipInstances.indexOf(chipInstance);
      }
    });
    
    // Track focus/blur for keyboard navigation
    chipInstance.element.addEventListener('focus', () => {
      focusedChipIndex = chipInstances.indexOf(chipInstance);
    });
    
    chipInstance.element.addEventListener('blur', () => {
      if (focusedChipIndex === chipInstances.indexOf(chipInstance)) {
        focusedChipIndex = -1;
      }
    });

    return chipInstance;
  };
  
  /**
   * Scrolls the chips container to make a specific chip visible
   * @param {ChipComponent|number} chipOrIndex - Chip instance or index to scroll to
   */
  const scrollToChip = (chipOrIndex: ChipComponent | number): void => {
    if (!scrollable) return;
    
    const index = typeof chipOrIndex === 'number'
      ? chipOrIndex
      : chipInstances.indexOf(chipOrIndex);
      
    if (index >= 0 && index < chipInstances.length) {
      const chipElement = chipInstances[index].element;
      
      // Calculate scroll position to center the chip
      const chipsRect = element.getBoundingClientRect();
      const chipRect = chipElement.getBoundingClientRect();
      
      if (vertical) {
        // For vertical scroll
        const scrollTop = chipElement.offsetTop - element.offsetTop - 
          (chipsRect.height / 2) + (chipRect.height / 2);
        
        element.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        });
      } else {
        // For horizontal scroll
        const scrollLeft = chipElement.offsetLeft - element.offsetLeft - 
          (chipsRect.width / 2) + (chipRect.width / 2);
        
        element.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });
      }
    }
  };
  
  /**
   * Enables keyboard navigation between chips in the container
   */
  const enableKeyboardNavigation = (): void => {
    // Add keyboard event listener to the chips container
    element.tabIndex = 0; // Make the chips container focusable
    
    element.addEventListener('keydown', handleKeyboardNavigation);
  };

  // Initialize with provided chips
  chips.forEach(chipConfig => addChip(chipConfig));
  
  // Enable keyboard navigation by default
  enableKeyboardNavigation();

  return {
    element,

    /**
     * Adds a new chip to the chips container
     * @param {Object} chipConfig - Configuration for the chip
     * @returns {ChipsComponent} The chips instance for chaining
     */
    addChip(chipConfig): ChipsComponent {
      addChip(chipConfig);
      return this;
    },

    /**
     * Removes a chip from the chips container
     * @param {ChipComponent|number} chipOrIndex - Chip instance or index to remove
     * @returns {ChipsComponent} The chips instance for chaining
     */
    removeChip(chipOrIndex): ChipsComponent {
      const index = typeof chipOrIndex === 'number'
        ? chipOrIndex
        : chipInstances.indexOf(chipOrIndex);

      if (index >= 0 && index < chipInstances.length) {
        const chip = chipInstances[index];
        chip.destroy();
        chipInstances.splice(index, 1);
        
        // Update focused index if needed
        if (index === focusedChipIndex) {
          focusedChipIndex = -1;
        } else if (index < focusedChipIndex) {
          focusedChipIndex--;
        }
      }

      return this;
    },

    /**
     * Gets all chip instances in the container
     * @returns {ChipComponent[]} Array of chip instances
     */
    getChips(): ChipComponent[] {
      return [...chipInstances];
    },

    /**
     * Gets currently selected chips
     * @returns {ChipComponent[]} Array of selected chip instances
     */
    getSelectedChips(): ChipComponent[] {
      return chipInstances.filter(chip => chip.isSelected());
    },

    /**
     * Gets the values of selected chips
     * @returns {(string|null)[]} Array of selected chip values
     */
    getSelectedValues(): (string | null)[] {
      return this.getSelectedChips().map(chip => chip.getValue());
    },

    /**
     * Selects chips by their values
     * @param {string|string[]} values - Value or array of values to select
     * @returns {ChipsComponent} The chips instance for chaining
     */
    selectByValue(values): ChipsComponent {
      const valueArray = Array.isArray(values) ? values : [values];

      chipInstances.forEach(chip => {
        const shouldSelect = valueArray.includes(chip.getValue());
        if (shouldSelect !== chip.isSelected()) {
          chip.setSelected(shouldSelect);
        }
      });
      
      // Dispatch change event if any chip selection has changed
      const selectedValues = this.getSelectedValues();
      if (selectedValues.length > 0) {
        dispatchEvent('change', selectedValues, null);
      }

      return this;
    },

    /**
     * Clears all selections
     * @returns {ChipsComponent} The chips instance for chaining
     */
    clearSelection(): ChipsComponent {
      const selectedValues = this.getSelectedValues();
      const hadSelectedChips = selectedValues.length > 0;
      
      chipInstances.forEach(chip => {
        chip.setSelected(false);
      });
      
      // Only dispatch if there were actually chips deselected
      if (hadSelectedChips) {
        dispatchEvent('change', [], null);
      }
      
      return this;
    },

    /**
     * Sets the scrollable state of the chips container
     * @param {boolean} isScrollable - Whether the chips container should be scrollable
     * @returns {ChipsComponent} The chips instance for chaining
     */
    setScrollable(isScrollable): ChipsComponent {
      if (isScrollable) {
        element.classList.add(`${PREFIX}-chips--scrollable`);
      } else {
        element.classList.remove(`${PREFIX}-chips--scrollable`);
      }
      return this;
    },

    /**
     * Sets the vertical layout state
     * @param {boolean} isVertical - Whether the chips container should be vertically stacked
     * @returns {ChipsComponent} The chips instance for chaining
     */
    setVertical(isVertical): ChipsComponent {
      if (isVertical) {
        element.classList.add(`${PREFIX}-chips--vertical`);
      } else {
        element.classList.remove(`${PREFIX}-chips--vertical`);
      }
      return this;
    },
    
    /**
     * Scrolls to a specific chip
     * @param {ChipComponent|number} chipOrIndex - Chip instance or index to scroll to
     * @returns {ChipsComponent} The chips instance for chaining
     */
    scrollToChip(chipOrIndex): ChipsComponent {
      scrollToChip(chipOrIndex);
      return this;
    },
    
    /**
     * Enables keyboard navigation between chips in the container
     * @returns {ChipsComponent} The chips instance for chaining
     */
    enableKeyboardNavigation(): ChipsComponent {
      enableKeyboardNavigation();
      return this;
    },
    
    /**
     * Adds an event listener to the chips container
     * @param {string} event - Event name ('change', etc.)
     * @param {Function} handler - Event handler function
     * @returns {ChipsComponent} The chips instance for chaining
     */
    on(event, handler): ChipsComponent {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      
      eventListeners[event].push(handler);
      return this;
    },
    
    /**
     * Removes an event listener from the chips container
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     * @returns {ChipsComponent} The chips instance for chaining
     */
    off(event, handler): ChipsComponent {
      if (eventListeners[event]) {
        const index = eventListeners[event].indexOf(handler);
        if (index !== -1) {
          eventListeners[event].splice(index, 1);
        }
      }
      return this;
    },

    /**
     * Destroys the chips container and all contained chips
     */
    destroy(): void {
      chipInstances.forEach(chip => chip.destroy());
      chipInstances.length = 0;
      
      // Clear all event listeners
      Object.keys(eventListeners).forEach(event => {
        eventListeners[event] = [];
      });
      
      // Remove keyboard event listener
      element.removeEventListener('keydown', handleKeyboardNavigation);
      
      element.remove();
    }
  };
};

export default createChips;