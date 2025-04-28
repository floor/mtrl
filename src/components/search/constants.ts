// src/components/search/constants.ts

/**
 * Search component variants
 */
export const SEARCH_VARIANTS = {
  /** Standard search box */
  STANDARD: 'standard',
  /** Search in bar layout */
  BAR: 'bar',
  /** Search in rail layout */
  RAIL: 'rail',
  /** Search in drawer layout */
  DRAWER: 'drawer',
  /** Modal search that expands to take focus */
  MODAL: 'modal'
} as const;

/**
 * Search component states
 */
export const SEARCH_STATES = {
  /** Search is focused */
  FOCUSED: 'focused',
  /** Search is expanded (for bar or modal variants) */
  EXPANDED: 'expanded',
  /** Search is collapsed (for bar or modal variants) */
  COLLAPSED: 'collapsed',
  /** Search has content */
  POPULATED: 'populated',
  /** Search is disabled */
  DISABLED: 'disabled',
  /** Search is showing suggestions */
  SUGGESTING: 'suggesting'
} as const;

/**
 * Search component events
 */
export const SEARCH_EVENTS = {
  /** Fired when search input is focused */
  FOCUS: 'focus',
  /** Fired when search input loses focus */
  BLUR: 'blur',
  /** Fired when input value changes */
  INPUT: 'input',
  /** Fired when search is submitted */
  SUBMIT: 'submit',
  /** Fired when search is cleared */
  CLEAR: 'clear',
  /** Fired when an icon is clicked */
  ICON_CLICK: 'iconClick'
} as const;

/**
 * Default search icons (standard set)
 */
export const SEARCH_ICONS = {
  /** Default search icon */
  SEARCH: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
  /** Clear/close icon */
  CLEAR: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  /** Back arrow icon */
  BACK: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
  /** Settings/options icon */
  SETTINGS: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>'
} as const;

/**
 * Default configuration values
 */
export const SEARCH_DEFAULTS = {
  /** Default variant */
  VARIANT: SEARCH_VARIANTS.STANDARD,
  /** Default placeholder text */
  PLACEHOLDER: 'Search',
  /** Default value */
  VALUE: '',
  /** Default leading icon */
  LEADING_ICON: SEARCH_ICONS.SEARCH,
  /** Whether to show clear button by default */
  SHOW_CLEAR_BUTTON: true,
  /** Default max width (in pixels) */
  MAX_WIDTH: 480,
  /** Default min width (in pixels) */
  MIN_WIDTH: 240,
  /** Whether the component is full width by default */
  FULL_WIDTH: false,
  /** Whether to show dividers between suggestion groups */
  SHOW_DIVIDERS: true
} as const;

/**
 * CSS classes for search component elements
 */
export const SEARCH_CLASSES = {
  /** Container element */
  CONTAINER: 'search',
  /** Variant modifier class prefix */
  VARIANT_PREFIX: 'search--',
  /** Search input element */
  INPUT: 'search__input',
  /** Leading icon container */
  LEADING_ICON: 'search__leading-icon',
  /** Trailing icon container */
  TRAILING_ICON: 'search__trailing-icon',
  /** Second trailing icon container */
  TRAILING_ICON2: 'search__trailing-icon2',
  /** Avatar container */
  AVATAR: 'search__avatar',
  /** Clear button */
  CLEAR_BUTTON: 'search__clear-button',
  /** Suggestions container */
  SUGGESTIONS: 'search__suggestions',
  /** Individual suggestion item */
  SUGGESTION_ITEM: 'search__suggestion-item',
  /** Suggestion divider */
  SUGGESTION_DIVIDER: 'search__suggestion-divider',
  /** Suggestion icon */
  SUGGESTION_ICON: 'search__suggestion-icon',
  /** Suggestion text */
  SUGGESTION_TEXT: 'search__suggestion-text',
  /** Focused state */
  FOCUSED: 'search--focused',
  /** Expanded state */
  EXPANDED: 'search--expanded',
  /** Populated state (has value) */
  POPULATED: 'search--populated',
  /** Disabled state */
  DISABLED: 'search--disabled',
  /** Full width modifier */
  FULL_WIDTH: 'search--full-width',
  /** Showing suggestions state */
  SUGGESTING: 'search--suggesting'
} as const;