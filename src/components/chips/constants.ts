// src/components/chips/constants.ts

/**
 * Available variants for the Chip component
 * @enum {string}
 */
export const CHIP_VARIANTS = {
  /** Standard filled chip with solid background */
  FILLED: 'filled',

  /** Outlined chip with transparent background and border */
  OUTLINED: 'outlined',

  /** Elevated chip with shadow */
  ELEVATED: 'elevated',

  /** Assist chip for suggesting actions */
  ASSIST: 'assist',

  /** Filter chip for filtering content */
  FILTER: 'filter',

  /** Input chip for representing user input */
  INPUT: 'input',

  /** Suggestion chip for presenting options */
  SUGGESTION: 'suggestion'
};

/**
 * Available event types for Chip component
 * @enum {string}
 */
export const CHIP_EVENTS = {
  /** Fired when chip selection state changes */
  CHANGE: 'change',
  
  /** Fired when chip is selected */
  SELECT: 'select',
  
  /** Fired when chip is deselected */
  DESELECT: 'deselect',
  
  /** Fired when chip is about to be removed */
  REMOVE: 'remove'
};

/**
 * Available event types for Chips container component
 * @enum {string}
 */
export const CHIPS_EVENTS = {
  /** Fired when any chip selection changes */
  CHANGE: 'change',
  
  /** Fired when a chip is added to the container */
  ADD: 'add',
  
  /** Fired when a chip is removed from the container */
  REMOVE: 'remove'
};