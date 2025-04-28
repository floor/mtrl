// src/components/checkbox/constants.ts

/**
 * Visual variants for checkbox styling
 * 
 * Material Design 3 checkboxes can use different visual styles
 * while maintaining the same functionality.
 * 
 * @category Components
 */
export const CHECKBOX_VARIANTS = {
  /** Checkbox with filled background when checked */
  FILLED: 'filled',
  /** Checkbox with outlined style (less prominent) */
  OUTLINED: 'outlined'
} as const;

/**
 * Label position options for the checkbox
 * 
 * Controls whether the label appears before or after the checkbox.
 * 
 * @category Components
 */
export const CHECKBOX_LABEL_POSITION = {
  /** Label appears before (to the left of) the checkbox */
  START: 'start',
  /** Label appears after (to the right of) the checkbox (default) */
  END: 'end'
} as const;

/**
 * Checkbox state classes
 * 
 * These classes are applied to the checkbox element to reflect its current state.
 * They can be used for styling or for selection in tests.
 * 
 * @category Components
 */
export const CHECKBOX_STATES = {
  /** Applied when the checkbox is checked */
  CHECKED: 'checked',
  /** Applied when the checkbox is in indeterminate state */
  INDETERMINATE: 'indeterminate',
  /** Applied when the checkbox is disabled */
  DISABLED: 'disabled',
  /** Applied when the checkbox has focus */
  FOCUSED: 'focused'
} as const;

/**
 * Checkbox element classes
 * 
 * These classes are applied to different parts of the checkbox component.
 * They follow the BEM naming convention used throughout the library.
 * 
 * @category Components
 */
export const CHECKBOX_CLASSES = {
  /** The main checkbox container element */
  ROOT: 'checkbox',
  /** The actual input element (usually hidden) */
  INPUT: 'checkbox-input',
  /** The visual checkbox icon */
  ICON: 'checkbox-icon',
  /** The text label associated with the checkbox */
  LABEL: 'checkbox-label'
} as const;