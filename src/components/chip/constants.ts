// src/components/chip/constants.js

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
 * Available sizes for the Chip component
 * @enum {string}
 */
export const CHIP_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};