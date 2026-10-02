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
 * @deprecated Read only by `RADIO_DEFAULTS`, which the component does not read:
 * it builds its class names itself and has one size and variant (FLO-266).
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
 * @deprecated Read only by `RADIO_DEFAULTS`, which the component does not read:
 * it builds its class names itself and has one size and variant (FLO-266).
 */
export const RADIO_LABEL_POSITIONS = {
  /** Label to the right of the radio (default) */
  RIGHT: 'right',
  /** Label to the left of the radio */
  LEFT: 'left'
} as const;

/**
 * @deprecated Read only by `RADIO_DEFAULTS`, which the component does not read:
 * it builds its class names itself and has one size and variant (FLO-266).
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
  /** Native input focus event; listen on the input, not the group emitter. */
  FOCUS: 'focus',
  /** Native input blur event; listen on the input, not the group emitter. */
  BLUR: 'blur'
} as const;

/**
 * Default configuration values
 */
export const RADIO_DEFAULTS = {
  /** @deprecated The radios have no variant option; nothing reads this. Removed in 1.0. */
  VARIANT: RADIO_VARIANTS.STANDARD,
  /** Default radio direction */
  DIRECTION: RADIO_DIRECTIONS.VERTICAL,
  /** @deprecated The radios have no label position option; nothing reads this. Removed in 1.0. */
  LABEL_POSITION: RADIO_LABEL_POSITIONS.RIGHT,
  /** @deprecated The radios have no size option; nothing reads this. Removed in 1.0. */
  SIZE: RADIO_SIZES.MEDIUM
} as const;

/**
 * @deprecated Read by nothing: the component builds its class names itself
 * and has one size and variant (FLO-266).
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
