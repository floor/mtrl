// src/components/search/constants.ts

/**
 * Available search component variants
 */
export const SEARCH_VARIANTS = {
  BAR: 'bar',
  VIEW: 'view'
} as const;

/**
 * Available search component events
 */
export const SEARCH_EVENTS = {
  FOCUS: 'focus',
  BLUR: 'blur',
  INPUT: 'input',
  SUBMIT: 'submit',
  CLEAR: 'clear',
  ICON_CLICK: 'iconClick'
} as const;