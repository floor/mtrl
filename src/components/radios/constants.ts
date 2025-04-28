// src/components/radios/constants.ts

/**
 * Radio states for styling and behavior
 */
export const RADIO_STATES = {
  /** Radio is selected */
  CHECKED: 'checked',
  /** Radio is not selected */
  UNCHECKED: 'unchecked',
  /** Radio is disabled */
  DISABLED: 'disabled',
  /** Radio has keyboard focus */
  FOCUSED: 'focused'
} as const;

/**
 * Radio layout directions
 */
export const RADIO_DIRECTIONS = {
  /** Radios stacked vertically */
  VERTICAL: 'vertical',
  /** Radios arranged horizontally */
  HORIZONTAL: 'horizontal'
} as const;

/**
 * Radio variants
 */
export const RADIO_VARIANTS = {
  /** Standard radio button */
  STANDARD: 'standard',
  /** Filled radio button */
  FILLED: 'filled',
  /** Outlined radio button */
  OUTLINED: 'outlined'
} as const;

/**
 * Radio label positions
 */
export const RADIO_LABEL_POSITIONS = {
  /** Label to the right of the radio (default) */
  RIGHT: 'right',
  /** Label to the left of the radio */
  LEFT: 'left'
} as const;

/**
 * Radio size options
 */
export const RADIO_SIZES = {
  /** Small radio button */
  SMALL: 'small',
  /** Standard radio button */
  MEDIUM: 'medium',
  /** Large radio button */
  LARGE: 'large'
} as const;

/**
 * Radio events
 */
export const RADIO_EVENTS = {
  /** Fired when a radio button is selected */
  CHANGE: 'change',
  /** Fired when a radio is focused */
  FOCUS: 'focus',
  /** Fired when a radio loses focus */
  BLUR: 'blur'
} as const;

/**
 * Default configuration values
 */
export const RADIO_DEFAULTS = {
  /** Default radio variant */
  VARIANT: RADIO_VARIANTS.STANDARD,
  /** Default radio direction */
  DIRECTION: RADIO_DIRECTIONS.VERTICAL,
  /** Default label position */
  LABEL_POSITION: RADIO_LABEL_POSITIONS.RIGHT,
  /** Default radio size */
  SIZE: RADIO_SIZES.MEDIUM
} as const;

/**
 * CSS classes for radio elements
 */
export const RADIO_CLASSES = {
  /** Container for radio group */
  GROUP: 'radio-group',
  /** Individual radio button */
  RADIO: 'radio',
  /** Radio input element */
  INPUT: 'radio__input',
  /** Radio label */
  LABEL: 'radio__label',
  /** Radio control (the circular part) */
  CONTROL: 'radio__control',
  /** The inner dot of the radio */
  DOT: 'radio__dot',
  /** Radio focus ring */
  FOCUS_RING: 'radio__focus-ring',
  /** Radio ripple effect */
  RIPPLE: 'radio__ripple',
  /** Checked state */
  CHECKED: 'radio--checked',
  /** Disabled state */
  DISABLED: 'radio--disabled',
  /** Focus state */
  FOCUSED: 'radio--focused',
  /** Label right position */
  LABEL_RIGHT: 'radio--label-right',
  /** Label left position */
  LABEL_LEFT: 'radio--label-left',
  /** Small size */
  SMALL: 'radio--small',
  /** Medium size */
  MEDIUM: 'radio--medium',
  /** Large size */
  LARGE: 'radio--large'
} as const;