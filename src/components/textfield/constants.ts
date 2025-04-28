// src/components/textfield/constants.ts

/**
 * Textfield variant constants
 * @category Components
 */
export const TEXTFIELD_VARIANTS = {
  /** Filled variant with background and animated label */
  FILLED: 'filled',
  /** Outlined variant with border and animated label */
  OUTLINED: 'outlined'
} as const;

/**
 * Textfield size constants
 * @category Components
 */
export const TEXTFIELD_SIZES = {
  /** Small textfield */
  SMALL: 'small',
  /** Medium textfield (default) */
  MEDIUM: 'medium',
  /** Large textfield */
  LARGE: 'large'
} as const;

/**
 * Textfield state constants
 * @category Components
 */
export const TEXTFIELD_STATES = {
  /** Textfield is active (focused) */
  ACTIVE: 'active',
  /** Textfield is inactive (not focused) */
  INACTIVE: 'inactive',
  /** Textfield is disabled */
  DISABLED: 'disabled'
} as const;

/**
 * Textfield type constants
 * @category Components
 */
export const TEXTFIELD_TYPES = {
  /** Standard text input */
  TEXT: 'text',
  /** Password input with obscured characters */
  PASSWORD: 'password',
  /** Email input with email validation */
  EMAIL: 'email',
  /** Numeric input */
  NUMBER: 'number',
  /** Telephone number input */
  TEL: 'tel',
  /** URL input with URL validation */
  URL: 'url',
  /** Search input */
  SEARCH: 'search',
  /** Multiline text input (textarea) */
  MULTILINE: 'multiline'
} as const;

/**
 * Textfield event constants
 * @category Components
 */
export const TEXTFIELD_EVENTS = {
  /** Fired when textfield value changes */
  CHANGE: 'change',
  /** Fired during input */
  INPUT: 'input',
  /** Fired when textfield receives focus */
  FOCUS: 'focus',
  /** Fired when textfield loses focus */
  BLUR: 'blur',
  /** Fired when enter key is pressed */
  ENTER: 'enter',
  /** Fired when a key is pressed down */
  KEYDOWN: 'keydown',
  /** Fired when a key is released */
  KEYUP: 'keyup'
} as const;

/**
 * Default textfield configuration values
 * @category Components
 */
export const TEXTFIELD_DEFAULTS = {
  /** Default input type */
  TYPE: TEXTFIELD_TYPES.TEXT,
  /** Default visual variant */
  VARIANT: TEXTFIELD_VARIANTS.FILLED,
  /** Default textfield size */
  SIZE: TEXTFIELD_SIZES.MEDIUM,
  /** Default disabled state */
  DISABLED: false,
  /** Default required state */
  REQUIRED: false,
  /** Default error state */
  ERROR: false,
  /** Default label floating behavior (always floats on focus) */
  FLOAT_LABEL: true,
  /** Default animation duration in milliseconds */
  ANIMATION_DURATION: 150
} as const;

/**
 * CSS class names used by the textfield component
 * @category Components
 */
export const TEXTFIELD_CLASSES = {
  /** Root element class */
  ROOT: 'textfield',
  /** Input element class */
  INPUT: 'textfield-input',
  /** Label element class */
  LABEL: 'textfield-label',
  /** Container element class */
  CONTAINER: 'textfield-container',
  /** Filled variant class */
  FILLED: 'textfield--filled',
  /** Outlined variant class */
  OUTLINED: 'textfield--outlined',
  /** Small size class */
  SMALL: 'textfield--small',
  /** Medium size class */
  MEDIUM: 'textfield--medium',
  /** Large size class */
  LARGE: 'textfield--large',
  /** Focused state class */
  FOCUSED: 'textfield--focused',
  /** Disabled state class */
  DISABLED: 'textfield--disabled',
  /** Error state class */
  ERROR: 'textfield--error',
  /** Required indicator class */
  REQUIRED: 'textfield--required',
  /** Floating label class */
  LABEL_FLOATING: 'textfield-label--floating',
  /** Supporting text class */
  SUPPORTING_TEXT: 'textfield-supporting-text',
  /** Supporting text error class */
  SUPPORTING_TEXT_ERROR: 'textfield-supporting-text--error',
  /** Leading icon class */
  LEADING_ICON: 'textfield-leading-icon',
  /** Trailing icon class */
  TRAILING_ICON: 'textfield-trailing-icon',
  /** Prefix text class */
  PREFIX_TEXT: 'textfield-prefix-text',
  /** Suffix text class */
  SUFFIX_TEXT: 'textfield-suffix-text',
  /** Outline element class (for outlined variant) */
  OUTLINE: 'textfield-outline',
  /** Multiline class */
  MULTILINE: 'textfield--multiline'
} as const;