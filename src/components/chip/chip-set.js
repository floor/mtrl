// src/components/chip/chip-set.js
import { PREFIX } from '../../core/config'
import createChip from './chip'

/**
 * Creates a chip set container for grouping related chips
 * @param {Object} config - ChipSet configuration
 * @param {Array} [config.chips=[]] - Array of chip configurations to initialize
 * @param {boolean} [config.scrollable=false] - Whether the chip set is horizontally scrollable
 * @param {boolean} [config.vertical=false] - Whether the chip set is vertically stacked
 * @param {string} [config.class] - Additional CSS classes
 * @param {string} [config.selector] - CSS selector for filtering behavior
 * @param {boolean} [config.multiSelect=false] - Whether multiple chips can be selected simultaneously
 * @param {Function} [config.onChange] - Callback function when chip selection changes
 * @returns {Object} ChipSet component instance
 */
const createChipSet = (config = {}) => {
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
  const chipInstances = []
  
  /**
   * Updates chip selection states based on multiSelect configuration
   * @param {Object} selectedChip - The chip that was clicked/selected
   */
  const handleSelection = (selectedChip) => {
    if (!multiSelect) {
      // Single selection mode - deselect all other chips
      chipInstances.forEach(chip => {
        if (chip !== selectedChip && chip.isSelected()) {
          chip.setSelected(false)
        }
      })
    }
    
    // Call onChange callback if provided
    if (typeof onChange === 'function') {
      const selectedChips = chipInstances.filter(chip => chip.isSelected())
      onChange(selectedChips, selectedChip)
    }
  }
  
  /**
   * Adds a chip to the chip set
   * @param {Object} chipConfig - Configuration for the chip
   * @returns {Object} The created chip instance
   */
  const addChip = (chipConfig) => {
    const chipInstance = createChip({
      ...chipConfig,
      onSelect: (chip) => {
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
      if (!chipInstance.element.getAttribute('aria-disabled') === 'true') {
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
     * @returns {Object} The chip set instance for chaining
     */
    addChip(chipConfig) {
      addChip(chipConfig)
      return this
    },
    
    /**
     * Removes a chip from the chip set
     * @param {Object|number} chipOrIndex - Chip instance or index to remove
     * @returns {Object} The chip set instance for chaining
     */
    removeChip(chipOrIndex) {
      let index = typeof chipOrIndex === 'number' 
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
     * @returns {Array} Array of chip instances
     */
    getChips() {
      return [...chipInstances]
    },
    
    /**
     * Gets currently selected chips
     * @returns {Array} Array of selected chip instances
     */
    getSelectedChips() {
      return chipInstances.filter(chip => chip.isSelected())
    },
    
    /**
     * Gets the values of selected chips
     * @returns {Array} Array of selected chip values
     */
    getSelectedValues() {
      return this.getSelectedChips().map(chip => chip.getValue())
    },
    
    /**
     * Selects chips by their values
     * @param {Array|string} values - Value or array of values to select
     * @returns {Object} The chip set instance for chaining
     */
    selectByValue(values) {
      const valueArray = Array.isArray(values) ? values : [values]
      
      chipInstances.forEach(chip => {
        const shouldSelect = valueArray.includes(chip.getValue())
        if (shouldSelect !== chip.isSelected()) {
          chip.setSelected(shouldSelect)
        }
      })
      
      return this
    },
    
    /**
     * Clears all selections
     * @returns {Object} The chip set instance for chaining
     */
    clearSelection() {
      chipInstances.forEach(chip => {
        chip.setSelected(false)
      })
      return this
    },
    
    /**
     * Sets the scrollable state of the chip set
     * @param {boolean} isScrollable - Whether the chip set should be scrollable
     * @returns {Object} The chip set instance for chaining
     */
    setScrollable(isScrollable) {
      if (isScrollable) {
        element.classList.add(`${PREFIX}-chip-set--scrollable