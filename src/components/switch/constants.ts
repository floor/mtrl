// src/components/switch/constants.ts

/**
 * Switch label position options
 * @category Components
 */
export const SWITCH_LABEL_POSITIONS = {
  /** Label positioned before the switch (left in LTR layouts) */
  START: 'start',
  /** Label positioned after the switch (right in LTR layouts) */
  END: 'end'
} as const;

/**
 * Switch states
 * @category Components
 */
export const SWITCH_STATES = {
  /** Switch is checked/on */
  CHECKED: 'checked',
  /** Switch is unchecked/off */
  UNCHECKED: 'unchecked',
  /** Switch is disabled */
  DISABLED: 'disabled',
  /** Switch is enabled */
  ENABLED: 'enabled'
} as const;

/**
 * Switch events
 * @category Components
 */
export const SWITCH_EVENTS = {
  /** Fired when switch is checked */
  CHANGE: 'change',
  /** Fired when switch receives focus */
  FOCUS: 'focus',
  /** Fired when switch loses focus */
  BLUR: 'blur'
} as const;

/**
 * Default configuration values for switch
 * @category Components
 */
export const SWITCH_DEFAULTS = {
  /** Default checked state */
  CHECKED: false,
  /** Default disabled state */
  DISABLED: false,
  /** Default required state */
  REQUIRED: false,
  /** Default label position */
  LABEL_POSITION: SWITCH_LABEL_POSITIONS.END,
  /** Default input value */
  VALUE: 'on'
} as const;

/**
 * CSS class names used by the switch component
 * @category Components
 */
export const SWITCH_CLASSES = {
  /** Root element class */
  ROOT: 'switch',
  /** Container element class */
  CONTAINER: 'switch-container',
  /** Content wrapper class */
  CONTENT: 'switch-content',
  /** Label element class */
  LABEL: 'switch-label',
  /** Input element class */
  INPUT: 'switch-input',
  /** Track element class */
  TRACK: 'switch-track',
  /** Thumb element class */
  THUMB: 'switch-thumb',
  /** Label at start position class */
  LABEL_START: 'switch--label-start',
  /** Label at end position class */
  LABEL_END: 'switch--label-end',
  /** Checked state class */
  CHECKED: 'switch--checked',
  /** Disabled state class */
  DISABLED: 'switch--disabled',
  /** Error state class */
  ERROR: 'switch--error',
  /** Helper/supporting text class */
  HELPER: 'switch-helper',
  /** Error helper text class */
  HELPER_ERROR: 'switch-helper--error',
  /** Focus state class */
  FOCUSED: 'switch--focused'
} as const;