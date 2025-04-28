// src/components/chips/chip/constants.ts

/**
 * CSS classes used in the Chip component
 */
export const CHIP_CLASSES = {
  /** The main chip container element */
  ROOT: 'chip',
  /** The chip content container */
  CONTENT: 'chip-content',
  /** The text label within the chip */
  LABEL: 'chip-label',
  /** The leading icon container */
  LEADING_ICON: 'chip-leading-icon',
  /** The trailing icon container */
  TRAILING_ICON: 'chip-trailing-icon',
  /** Applied when chip is selected */
  SELECTED: 'chip--selected',
  /** Applied when chip is disabled */
  DISABLED: 'chip--disabled',
  /** Applied when chip is focused */
  FOCUSED: 'chip--focused',
  /** Applied when chip is hovered */
  HOVERED: 'chip--hovered'
} as const;

/**
 * Chip states
 */
export const CHIP_STATES = {
  /** Default state */
  DEFAULT: 'default',
  /** Selected state */
  SELECTED: 'selected',
  /** Disabled state */
  DISABLED: 'disabled',
  /** Focused state */
  FOCUSED: 'focused',
  /** Hovered state */
  HOVERED: 'hovered'
} as const;