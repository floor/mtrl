// src/components/textfield/constants.ts

/**
 * Textfield variant constants
 * @category Components
 */
const TEXTFIELD_VARIANTS = {
  /** Filled variant with background and animated label */
  FILLED: "filled",
  /** Outlined variant with border and animated label */
  OUTLINED: "outlined",
} as const;

/**
 * Textfield state constants
 * @category Components
 */
const TEXTFIELD_STATES = {
  /** Textfield is active (focused) */
  ACTIVE: "active",
  /** Textfield is inactive (not focused) */
  INACTIVE: "inactive",
  /** Textfield is disabled */
  DISABLED: "disabled",
} as const;

/**
 * Textfield type constants
 * @category Components
 */
const TEXTFIELD_TYPES = {
  /** Standard text input */
  TEXT: "text",
  /** Password input with obscured characters */
  PASSWORD: "password",
  /** Email input with email validation */
  EMAIL: "email",
  /** Numeric input */
  NUMBER: "number",
  /** Telephone number input */
  TEL: "tel",
  /** URL input with URL validation */
  URL: "url",
  /** Search input */
  SEARCH: "search",
  /** Multiline text input (textarea) */
  MULTILINE: "multiline",
} as const;

/**
 * Textfield event constants
 * @category Components
 */
const TEXTFIELD_EVENTS = {
  /** Emitted on native input change; setValue() is silent */
  CHANGE: "change",
  /** Fired during input */
  INPUT: "input",
  /** Fired when textfield receives focus */
  FOCUS: "focus",
  /** Fired when textfield loses focus */
  BLUR: "blur",
  /** Fired when the trailing icon button is activated (`trailingIconLabel`; FLO-301) */
  TRAILING: "trailing",
  /** Legacy name, not emitted; listen for keydown on the input and check key === "Enter" */
  ENTER: "enter",
  /** Native input event only; not emitted through on() */
  KEYDOWN: "keydown",
  /** Native input event only; not emitted through on() */
  KEYUP: "keyup",
} as const;

/**
 * Textfield density constants
 * @category Components
 */
const TEXTFIELD_DENSITY = {
  /** Default density (56px height) */
  DEFAULT: "default",
  /** Compact density (40px height) */
  COMPACT: "compact",
} as const;

/**
 * Default textfield configuration values
 * @category Components
 */
const TEXTFIELD_DEFAULTS = {
  /** Default input type */
  TYPE: TEXTFIELD_TYPES.TEXT,
  /** Default visual variant */
  VARIANT: TEXTFIELD_VARIANTS.FILLED,
  /** Default density level */
  DENSITY: TEXTFIELD_DENSITY.DEFAULT,
  /** Default disabled state */
  DISABLED: false,
  /** Default required state */
  REQUIRED: false,
  /** Default error state */
  ERROR: false,
  /** Default label floating behavior (always floats on focus) */
  FLOAT_LABEL: true,
  /** Default animation duration in milliseconds */
  ANIMATION_DURATION: 150,
} as const;

/**
 * CSS class names used by the textfield component
 * In 1.0 the classes are written `text-field` (`mtrl-text-field`,
 * `mtrl-text-field__input`, …): page CSS and `classList` calls that keep
 * `mtrl-textfield` then match nothing, and nothing warns.
 * @category Components
 */
const TEXTFIELD_CLASSES = {
  /** Root element class */
  ROOT: "textfield",
  /** Input element class */
  INPUT: "textfield__input",
  /** Label element class */
  LABEL: "textfield__label",
  /** Reserved slot; the current component has no separate container element. */
  CONTAINER: "textfield__container",
  /** Filled variant class */
  FILLED: "textfield--filled",
  /** Outlined variant class */
  OUTLINED: "textfield--outlined",
  /** Focused state class */
  FOCUSED: "textfield--focused",
  /** Disabled state class */
  DISABLED: "textfield--disabled",
  /** Error state class */
  ERROR: "textfield--error",
  /** Required indicator class */
  REQUIRED: "textfield--required",
  /**
   * @deprecated Applied nowhere and styled by nothing: a floating label is the
   * field's `--populated` or `--focused` state (FLO-295). Kept for
   * compatibility.
   */
  LABEL_FLOATING: "textfield__label--floating",
  /** Supporting text class */
  SUPPORTING_TEXT: "textfield__helper",
  /** Supporting text error class */
  SUPPORTING_TEXT_ERROR: "textfield__helper--error",
  /** Leading icon class */
  LEADING_ICON: "textfield__leading-icon",
  /** Trailing icon class */
  TRAILING_ICON: "textfield__trailing-icon",
  /** Prefix text class */
  PREFIX_TEXT: "textfield__prefix",
  /** Suffix text class */
  SUFFIX_TEXT: "textfield__suffix",
  /** Outline of the outlined variant, drawn in three segments */
  OUTLINE: "textfield__outline",
  /** Outline segment before the label (start corner) */
  OUTLINE_LEADING: "textfield__outline-leading",
  /** Outline segment the floating label sits in */
  OUTLINE_NOTCH: "textfield__outline-notch",
  /** Outline segment after the label */
  OUTLINE_TRAILING: "textfield__outline-trailing",
  /** Outline whose notch is open around the floating label */
  OUTLINE_NOTCHED: "textfield__outline--notched",
  /** Outlined field laid out right to left, from its computed direction */
  RTL: "textfield--rtl",
  /** Multiline class */
  MULTILINE: "textfield--multiline",
} as const;

// Every exported identifier writes "text field" as two words (FLO-383); the
// values (class names, event strings) are unchanged.
export {
  TEXTFIELD_VARIANTS as TEXT_FIELD_VARIANTS,
  TEXTFIELD_STATES as TEXT_FIELD_STATES,
  TEXTFIELD_TYPES as TEXT_FIELD_TYPES,
  TEXTFIELD_EVENTS as TEXT_FIELD_EVENTS,
  TEXTFIELD_DENSITY as TEXT_FIELD_DENSITY,
  TEXTFIELD_DEFAULTS as TEXT_FIELD_DEFAULTS,
  TEXTFIELD_CLASSES as TEXT_FIELD_CLASSES,
  /** @deprecated Use TEXT_FIELD_VARIANTS: M3 writes "text field" as two words. Removed in 1.0 (FLO-383). */
  TEXTFIELD_VARIANTS,
  /** @deprecated Use TEXT_FIELD_STATES: M3 writes "text field" as two words. Removed in 1.0 (FLO-383). */
  TEXTFIELD_STATES,
  /** @deprecated Use TEXT_FIELD_TYPES: M3 writes "text field" as two words. Removed in 1.0 (FLO-383). */
  TEXTFIELD_TYPES,
  /** @deprecated Use TEXT_FIELD_EVENTS: M3 writes "text field" as two words. Removed in 1.0 (FLO-383). */
  TEXTFIELD_EVENTS,
  /** @deprecated Use TEXT_FIELD_DENSITY: M3 writes "text field" as two words. Removed in 1.0 (FLO-383). */
  TEXTFIELD_DENSITY,
  /** @deprecated Use TEXT_FIELD_DEFAULTS: M3 writes "text field" as two words. Removed in 1.0 (FLO-383). */
  TEXTFIELD_DEFAULTS,
  /** @deprecated Use TEXT_FIELD_CLASSES: M3 writes "text field" as two words. Removed in 1.0 (FLO-383). */
  TEXTFIELD_CLASSES,
};
