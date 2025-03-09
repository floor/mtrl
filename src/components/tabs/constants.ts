// src/components/tabs/constants.ts

/**
 * Tab variants
 */
export const TABS_VARIANTS = {
  /** Primary tabs (standard MD3 style) */
  PRIMARY: 'primary',
  /** Secondary tabs (less prominent variant) */
  SECONDARY: 'secondary'
};

/**
 * Tab states
 */
export const TAB_STATES = {
  /** Active (selected) tab state */
  ACTIVE: 'active',
  /** Inactive (unselected) tab state */
  INACTIVE: 'inactive',
  /** Disabled tab state */
  DISABLED: 'disabled'
};

/**
 * Tab layout types
 */
export const TAB_LAYOUT = {
  /** Icon-only tab layout */
  ICON_ONLY: 'icon-only',
  /** Text-only tab layout */
  TEXT_ONLY: 'text-only',
  /** Icon and text layout */
  ICON_AND_TEXT: 'icon-and-text'
};

/**
 * Tab interaction states (for styling)
 */
export const TAB_INTERACTION_STATES = {
  /** Default enabled state */
  ENABLED: 'enabled',
  /** Hover state */
  HOVER: 'hover',
  /** Focus state */
  FOCUS: 'focus',
  /** Pressed/active state */
  PRESSED: 'pressed'
};

/**
 * Tab animation constants
 */
export const TAB_ANIMATION = {
  /** Standard transition duration in ms */
  TRANSITION_DURATION: 200,
  /** Standard transition timing function */
  TRANSITION_TIMING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Ripple animation duration in ms */
  RIPPLE_DURATION: 400
};

/**
 * Tab accessibility roles
 */
export const TAB_A11Y = {
  /** Tab role */
  TAB_ROLE: 'tab',
  /** Tablist role */
  TABLIST_ROLE: 'tablist',
  /** Tabpanel role */
  TABPANEL_ROLE: 'tabpanel'
};

/**
 * MD3 tokens for tab colors
 */
export const TAB_COLORS = {
  /** Surface color for container */
  SURFACE: 'surface',
  /** Primary color for active tab and indicator */
  PRIMARY: 'primary',
  /** On-surface color for active secondary tabs */
  ON_SURFACE: 'on-surface',
  /** On-surface-variant for inactive tabs */
  ON_SURFACE_VARIANT: 'on-surface-variant',
  /** Outline variant for divider */
  OUTLINE_VARIANT: 'outline-variant'
};