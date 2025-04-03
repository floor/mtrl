// src/components/chip/chip-set.ts
import { PREFIX } from '../../core/config'
import createChip from './chip'
import { ChipComponent } from './types'

/**
 * Configuration interface for the ChipSet component
 * @category Components
 */
export interface ChipSetConfig {
  /** 
   * Array of chip configurations to initialize 
   * @default []
   */
  chips?: any[];
  
  /** 
   * Whether the chip set is horizontally scrollable 
   * @default false
   */
  scrollable?: boolean;
  
  /** 
   * Whether the chip set is vertically stacked 
   * @default false
   */
  vertical?: boolean;
  
  /** 
   * Additional CSS classes 
   */
  class?: string;
  
  /** 
   * CSS selector for filtering behavior 
   */
  selector?: string | null;
  
  /** 
   * Whether multiple chips can be selected simultaneously 
   * @default false
   */
  multiSelect?: boolean;
  
  /** 
   * Callback function when chip selection changes 
   */
  onChange?: (selectedValues: (string | null)[], changedValue: string | null) => void;
}

/**
 * ChipSet component interface
 * @category Components
 */
export interface ChipSetComponent {
  /** The chip set's DOM element */
  element: HTMLElement;
  
  /**
   * Adds a new chip to the chip set
   * @param chipConfig - Configuration for the chip
   * @returns The chip set instance for chaining
   */
  addChip: (chipConfig: any) => ChipSetComponent;
  
  /**
   * Removes a chip from the chip set
   * @param chipOrIndex - Chip instance or index to remove
   * @returns The chip set instance for chaining
   */
  removeChip: (chipOrIndex: ChipComponent | number) => ChipSetComponent;
  
  /**
   * Gets all chip instances in the set
   * @returns Array of chip instances
   */
  getChips: () => ChipComponent[];
  
  /**
   * Gets currently selected chips
   * @returns Array of selected chip instances
   */
  getSelectedChips: () => ChipComponent[];
  
  /**
   * Gets the values of selected chips
   * @returns Array of selected chip values
   */
  getSelectedValues: () => (string | null)[];
  
  /**
   * Selects chips by their values
   * @param values - Value or array of values to select
   * @returns The chip set instance for chaining
   */
  selectByValue: (values: string | string[]) => ChipSetComponent;
  
  /**
   * Clears all selections
   * @returns The chip set instance for chaining
   */
  clearSelection: () => ChipSetComponent;
  
  /**
   * Sets the scrollable state of the chip set
   * @param isScrollable - Whether the chip set should be scrollable
   * @returns The chip set instance for chaining
   */
  setScrollable: (isScrollable: boolean) => ChipSetComponent;
  
  /**
   * Sets the vertical layout state
   * @param isVertical - Whether the chip set should be vertically stacked
   * @returns The chip set instance for chaining
   */
  setVertical: (isVertical: boolean) => ChipSetComponent;
  
  /**
   * Destroys the chip set and all contained chips
   */
  destroy: () => void;
  
  /**
   * Adds an event listener to the chip set
   * @param event - Event name ('change', etc.)
   * @param handler - Event handler function
   * @returns The chip set instance for chaining
   */
  on: (event: string, handler: Function) => ChipSetComponent;
  
  /**
   * Removes an event listener from the chip set
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The chip set instance for chaining
   */
  off: (event: string, handler: Function) => ChipSetComponent;
}

/**
 * Creates a chip set container for grouping related chips
 * @param {ChipSetConfig} config - ChipSet configuration
 * @returns {ChipSetComponent} ChipSet component instance
 */
const createChipSet = (config: ChipSetConfig = {}): ChipSetComponent => {
  const {
    chips = [],
    scrollable = false,
    vertical = false,
    class: customClass,
    selector = null,
    multiSelect = false,
    onChange = null
  } = config

  // Create container element
  const element = document.createElement('div')
  element.className = `${PREFIX}-chip-set`

  if (customClass) {
    element.classList.add(customClass)
  }

  if (scrollable) {
    element.classList.add(`${PREFIX}-chip-set--scrollable`)
  }

  if (vertical) {
    element.classList.add(`${PREFIX}-chip-set--vertical`)
  }

  // Store chip instances
  const chipInstances: ChipComponent[] = []
  
  // Event listeners storage
  const eventListeners: Record<string, Function[]> = {
    change: []
  }

  /**
   * Dispatches custom events to registered handlers
   * @param {string} eventName - Name of the event to trigger
   * @param {any[]} args - Arguments to pass to the handlers
   */
  const dispatchEvent = (eventName: string, ...args: any[]): void => {
    if (eventListeners[eventName]) {
      eventListeners[eventName].forEach(handler => handler(...args))
    }
  }

  /**
   * Updates chip selection states based on multiSelect configuration
   * @param {ChipComponent} selectedChip - The chip that was clicked/selected
   */
  const handleSelection = (selectedChip: ChipComponent): void => {
    if (!multiSelect) {
      // Single selection mode - deselect all other chips
      chipInstances.forEach(chip => {
        if (chip !== selectedChip && chip.isSelected()) {
          chip.setSelected(false)
        }
      })
    }

    // Get all currently selected chips and their values
    const selectedChips = chipInstances.filter(chip => chip.isSelected())
    const selectedValues = selectedChips.map(chip => chip.getValue())
    const changedValue = selectedChip ? selectedChip.getValue() : null
    
    // Call onChange callback if provided
    if (typeof onChange === 'function') {
      onChange(selectedValues, changedValue)
    }
    
    // Dispatch change event to all registered handlers
    dispatchEvent('change', selectedValues, changedValue)
  }

  /**
   * Adds a chip to the chip set
   * @param {Object} chipConfig - Configuration for the chip
   * @returns {ChipComponent} The created chip instance
   */
  const addChip = (chipConfig: any): ChipComponent => {
    const chipInstance = createChip({
      ...chipConfig,
      onSelect: (chip: ChipComponent) => {
        handleSelection(chip)
        if (chipConfig.onSelect) {
          chipConfig.onSelect(chip)
        }
      }
    })

    element.appendChild(chipInstance.element)
    chipInstances.push(chipInstance)

    // Add click handler to toggle selection
    chipInstance.element.addEventListener('click', () => {
      if (!chipInstance.isDisabled()) {
        chipInstance.toggleSelected()
        handleSelection(chipInstance)
      }
    })

    return chipInstance
  }

  // Initialize with provided chips
  chips.forEach(chipConfig => addChip(chipConfig))

  return {
    element,

    /**
     * Adds a new chip to the chip set
     * @param {Object} chipConfig - Configuration for the chip
     * @returns {ChipSetComponent} The chip set instance for chaining
     */
    addChip(chipConfig): ChipSetComponent {
      addChip(chipConfig)
      return this
    },

    /**
     * Removes a chip from the chip set
     * @param {ChipComponent|number} chipOrIndex - Chip instance or index to remove
     * @returns {ChipSetComponent} The chip set instance for chaining
     */
    removeChip(chipOrIndex): ChipSetComponent {
      const index = typeof chipOrIndex === 'number'
        ? chipOrIndex
        : chipInstances.indexOf(chipOrIndex)

      if (index >= 0 && index < chipInstances.length) {
        const chip = chipInstances[index]
        chip.destroy()
        chipInstances.splice(index, 1)
      }

      return this
    },

    /**
     * Gets all chip instances in the set
     * @returns {ChipComponent[]} Array of chip instances
     */
    getChips(): ChipComponent[] {
      return [...chipInstances]
    },

    /**
     * Gets currently selected chips
     * @returns {ChipComponent[]} Array of selected chip instances
     */
    getSelectedChips(): ChipComponent[] {
      return chipInstances.filter(chip => chip.isSelected())
    },

    /**
     * Gets the values of selected chips
     * @returns {(string|null)[]} Array of selected chip values
     */
    getSelectedValues(): (string | null)[] {
      return this.getSelectedChips().map(chip => chip.getValue())
    },

    /**
     * Selects chips by their values
     * @param {string|string[]} values - Value or array of values to select
     * @returns {ChipSetComponent} The chip set instance for chaining
     */
    selectByValue(values): ChipSetComponent {
      const valueArray = Array.isArray(values) ? values : [values]

      chipInstances.forEach(chip => {
        const shouldSelect = valueArray.includes(chip.getValue())
        if (shouldSelect !== chip.isSelected()) {
          chip.setSelected(shouldSelect)
        }
      })
      
      // Dispatch change event if any chip selection has changed
      const selectedValues = this.getSelectedValues()
      if (selectedValues.length > 0) {
        dispatchEvent('change', selectedValues, null)
      }

      return this
    },

    /**
     * Clears all selections
     * @returns {ChipSetComponent} The chip set instance for chaining
     */
    clearSelection(): ChipSetComponent {
      const selectedValues = this.getSelectedValues()
      const hadSelectedChips = selectedValues.length > 0
      
      chipInstances.forEach(chip => {
        chip.setSelected(false)
      })
      
      // Only dispatch if there were actually chips deselected
      if (hadSelectedChips) {
        dispatchEvent('change', [], null)
      }
      
      return this
    },

    /**
     * Sets the scrollable state of the chip set
     * @param {boolean} isScrollable - Whether the chip set should be scrollable
     * @returns {ChipSetComponent} The chip set instance for chaining
     */
    setScrollable(isScrollable): ChipSetComponent {
      if (isScrollable) {
        element.classList.add(`${PREFIX}-chip-set--scrollable`)
      } else {
        element.classList.remove(`${PREFIX}-chip-set--scrollable`)
      }
      return this
    },

    /**
     * Sets the vertical layout state
     * @param {boolean} isVertical - Whether the chip set should be vertically stacked
     * @returns {ChipSetComponent} The chip set instance for chaining
     */
    setVertical(isVertical): ChipSetComponent {
      if (isVertical) {
        element.classList.add(`${PREFIX}-chip-set--vertical`)
      } else {
        element.classList.remove(`${PREFIX}-chip-set--vertical`)
      }
      return this
    },
    
    /**
     * Adds an event listener to the chip set
     * @param {string} event - Event name ('change', etc.)
     * @param {Function} handler - Event handler function
     * @returns {ChipSetComponent} The chip set instance for chaining
     */
    on(event, handler): ChipSetComponent {
      if (!eventListeners[event]) {
        eventListeners[event] = []
      }
      
      eventListeners[event].push(handler)
      return this
    },
    
    /**
     * Removes an event listener from the chip set
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     * @returns {ChipSetComponent} The chip set instance for chaining
     */
    off(event, handler): ChipSetComponent {
      if (eventListeners[event]) {
        const index = eventListeners[event].indexOf(handler)
        if (index !== -1) {
          eventListeners[event].splice(index, 1)
        }
      }
      return this
    },

    /**
     * Destroys the chip set and all contained chips
     */
    destroy(): void {
      chipInstances.forEach(chip => chip.destroy())
      chipInstances.length = 0
      
      // Clear all event listeners
      Object.keys(eventListeners).forEach(event => {
        eventListeners[event] = []
      })
      
      element.remove()
    }
  }
}

export default createChipSet