// src/components/top-app-bar/constants.ts

/**
 * Top App Bar types
 * @category Components
 */
export const TOP_APP_BAR_TYPES = {
  /** Small height app bar */
  SMALL: 'small',
  /** Medium height app bar */
  MEDIUM: 'medium',
  /** Large height app bar */
  LARGE: 'large',
  /** Center-aligned app bar */
  CENTER: 'center'
} as const;

/**
 * Top App Bar states
 * @category Components
 */
export const TOP_APP_BAR_STATES = {
  /** Default state */
  DEFAULT: 'default',
  /** Scrolled state */
  SCROLLED: 'scrolled',
  /** Fixed state */
  FIXED: 'fixed'
} as const;

/**
 * Default configuration values for top app bar
 * @category Components
 */
export const TOP_APP_BAR_DEFAULTS = {
  /** Default HTML tag */
  TAG: 'header',
  /** Default bar type */
  TYPE: TOP_APP_BAR_TYPES.SMALL,
  /** Whether to enable scrolling behavior */
  SCROLLABLE: true,
  /** Whether to compress medium/large variants on scroll */
  COMPRESSIBLE: true,
  /** Scroll threshold in pixels to trigger scrolled state */
  SCROLL_THRESHOLD: 4
} as const;

/**
 * CSS class names used by the top app bar component
 * @category Components
 */
export const TOP_APP_BAR_CLASSES = {
  /** Root element class */
  ROOT: 'top-app-bar',
  /** Small variant class */
  SMALL: 'top-app-bar--small',
  /** Medium variant class */
  MEDIUM: 'top-app-bar--medium',
  /** Large variant class */
  LARGE: 'top-app-bar--large',
  /** Center-aligned variant class */
  CENTER: 'top-app-bar--center',
  /** Scrolled state class */
  SCROLLED: 'top-app-bar--scrolled',
  /** Fixed state class */
  FIXED: 'top-app-bar--fixed',
  /** Row container class */
  ROW: 'top-app-bar-row',
  /** Section container class */
  SECTION: 'top-app-bar-section',
  /** Leading section class */
  SECTION_LEADING: 'top-app-bar-section--leading',
  /** Headline section class */
  SECTION_HEADLINE: 'top-app-bar-section--headline',
  /** Trailing section class */
  SECTION_TRAILING: 'top-app-bar-section--trailing',
  /** Title element class */
  TITLE: 'top-app-bar-title'
} as const;