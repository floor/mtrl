// src/components/search/constants.ts

/**
 * Search component states (bar = collapsed, view = expanded)
 * @category Components
 */
export const SEARCH_STATES = {
  /** Collapsed search bar state */
  BAR: "bar",
  /** Expanded search view state */
  VIEW: "view",
} as const;

/**
 * Search view display modes
 * @category Components
 */
export const SEARCH_VIEW_MODES = {
  /** Inline docked view (360-720dp width, max 2/3 screen height) */
  DOCKED: "docked",
  /** Full-screen overlay view */
  FULLSCREEN: "fullscreen",
} as const;

/**
 * MD3 Search component measurements
 * @see https://m3.material.io/components/search/specs
 * @category Components
 */
export const SEARCH_MEASUREMENTS = {
  // Search Bar
  BAR_HEIGHT: 56,
  BAR_MIN_WIDTH: 360,
  BAR_MAX_WIDTH: 720,

  // Search View - Docked
  VIEW_DOCKED_HEADER_HEIGHT: 56,
  VIEW_DOCKED_MIN_WIDTH: 360,
  VIEW_DOCKED_MAX_WIDTH: 720,
  VIEW_DOCKED_MIN_HEIGHT: 240,

  // Search View - Fullscreen
  VIEW_FULLSCREEN_HEADER_HEIGHT: 72,

  // Common spacing
  PADDING_HORIZONTAL: 16,
  ICON_SIZE: 24,
  AVATAR_SIZE: 30,
  ICON_SPACING: 16,
} as const;

/**
 * Search component event types
 * @category Components
 */
export const SEARCH_EVENTS = {
  /** Fired when search input receives focus */
  FOCUS: "focus",
  /** Fired when search input loses focus */
  BLUR: "blur",
  /** Fired when input value changes */
  INPUT: "input",
  /** Fired when search is submitted (Enter key or submit action) */
  SUBMIT: "submit",
  /** Fired when search input is cleared */
  CLEAR: "clear",
  /** Fired when search bar expands to view */
  EXPAND: "expand",
  /** Fired when search view collapses to bar */
  COLLAPSE: "collapse",
  /** Fired when a suggestion is selected */
  SUGGESTION_SELECT: "suggestionSelect",
} as const;

/**
 * Default search icons (MD3 standard)
 * @category Components
 */
export const SEARCH_ICONS = {
  /** Search/magnifying glass icon */
  SEARCH:
    '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
  /** Back/arrow left icon (for view state) */
  BACK: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
  /** Clear/close icon */
  CLEAR:
    '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  /** Microphone icon (voice search) */
  MIC: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>',
  /** History/clock icon (for recent searches) */
  HISTORY:
    '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>',
} as const;

/**
 * Default configuration values
 * @category Components
 */
export const SEARCH_DEFAULTS = {
  /** Default state (collapsed bar) */
  STATE: SEARCH_STATES.BAR,
  /** Default view mode when expanded */
  VIEW_MODE: SEARCH_VIEW_MODES.DOCKED,
  /** Default placeholder/supporting text */
  PLACEHOLDER: "Search",
  /** Default value */
  VALUE: "",
  /** Whether to show clear button when input has value */
  SHOW_CLEAR_BUTTON: true,
  /** Default disabled state */
  DISABLED: false,
  /** Default full-width state */
  FULL_WIDTH: false,
} as const;

/**
 * CSS class names used by the search component
 * @category Components
 */
export const SEARCH_CLASSES = {
  // Root element
  ROOT: "search",

  // State modifiers
  STATE_BAR: "search--bar",
  STATE_VIEW: "search--view",

  // View mode modifiers
  VIEW_DOCKED: "search--docked",
  VIEW_FULLSCREEN: "search--fullscreen",

  // Interactive state modifiers
  FOCUSED: "search--focused",
  DISABLED: "search--disabled",
  POPULATED: "search--populated",
  FULL_WIDTH: "search--full-width",

  // Structure elements
  CONTAINER: "search__container",
  HEADER: "search__header",
  INPUT_WRAPPER: "search__input-wrapper",
  INPUT: "search__input",
  DIVIDER: "search__divider",
  CONTENT: "search__content",

  // Icon elements
  LEADING_ICON: "search__leading-icon",
  TRAILING_ICON: "search__trailing-icon",
  CLEAR_BUTTON: "search__clear-button",
  CLEAR_BUTTON_HIDDEN: "search__clear-button--hidden",
  AVATAR: "search__avatar",

  // Suggestions
  SUGGESTIONS: "search__suggestions",
  SUGGESTION_LIST: "search__suggestion-list",
  SUGGESTION_ITEM: "search__suggestion-item",
  SUGGESTION_ITEM_SELECTED: "search__suggestion-item--selected",
  SUGGESTION_ICON: "search__suggestion-icon",
  SUGGESTION_TEXT: "search__suggestion-text",
  SUGGESTION_DIVIDER: "search__suggestion-divider",
} as const;

/**
 * Keyboard keys for search interaction
 * @category Components
 */
export const SEARCH_KEYS = {
  ENTER: "Enter",
  ESCAPE: "Escape",
  ARROW_DOWN: "ArrowDown",
  ARROW_UP: "ArrowUp",
  TAB: "Tab",
} as const;
