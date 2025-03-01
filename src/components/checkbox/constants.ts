// src/components/checkbox/constants.ts

/**
 * Visual variants for checkbox
 */
export const CHECKBOX_VARIANTS = {
  FILLED: 'filled',
  OUTLINED: 'outlined'
} as const;

/**
 * Label position options
 */
export const CHECKBOX_LABEL_POSITION = {
  START: 'start',
  END: 'end'
} as const;

/**
 * Checkbox state classes
 */
export const CHECKBOX_STATES = {
  CHECKED: 'checked',
  INDETERMINATE: 'indeterminate',
  DISABLED: 'disabled',
  FOCUSED: 'focused'
} as const;

/**
 * Checkbox element classes
 */
export const CHECKBOX_CLASSES = {
  ROOT: 'checkbox',
  INPUT: 'checkbox-input',
  ICON: 'checkbox-icon',
  LABEL: 'checkbox-label'
} as const;