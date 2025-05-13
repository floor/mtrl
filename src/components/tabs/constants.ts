// src/components/tabs/constants.ts

/**
 * Tab component variants
 * @category Components
 */
export const TAB_VARIANTS = {
  /** Primary tabs */
  PRIMARY: 'primary',
  /** Secondary tabs */
  SECONDARY: 'secondary'
} as const;

/**
 * Tab states
 * @category Components
 */
export const TAB_STATES = {
  /** Tab is currently active */
  ACTIVE: 'active',
  /** Tab is not currently active */
  INACTIVE: 'inactive',
  /** Tab is disabled */
  DISABLED: 'disabled'
} as const;

/**
 * Tab indicator width strategies
 * @category Components
 */
export const TAB_INDICATOR_WIDTH_STRATEGIES = {
  /** Fixed width defined by fixedWidth */
  FIXED: 'fixed',
  /** Half the tab width */
  DYNAMIC: 'dynamic',
  /** Match the text content width */
  CONTENT: 'content',
  /** Adapts based on variant (primary: text width, secondary: full tab width) */
  AUTO: 'auto'
} as const;

/**
 * Tab events
 * @category Components
 */
export const TAB_EVENTS = {
  /** Fired when a tab is clicked */
  CLICK: 'click',
  /** Fired when a tab receives focus */
  FOCUS: 'focus',
  /** Fired when a tab loses focus */
  BLUR: 'blur'
} as const;

/**
 * Tabs component events
 * @category Components
 */
export const TABS_EVENTS = {
  /** Fired when the active tab changes */
  CHANGE: 'change'
} as const;

/**
 * Default values for tabs component
 * @category Components
 */
export const TABS_DEFAULTS = {
  /** Default tab variant */
  VARIANT: TAB_VARIANTS.PRIMARY,
  /** Whether tabs are horizontally scrollable */
  SCROLLABLE: true,
  /** Whether to show a divider below the tabs */
  SHOW_DIVIDER: true,
  /** Default indicator height in pixels */
  INDICATOR_HEIGHT: 3,
  /** Default indicator width strategy */
  INDICATOR_WIDTH_STRATEGY: TAB_INDICATOR_WIDTH_STRATEGIES.AUTO,
  /** Default fixed width for fixed indicator in pixels */
  INDICATOR_FIXED_WIDTH: 40,
  /** Default indicator animation duration in milliseconds */
  INDICATOR_ANIMATION_DURATION: 250,
  /** Default indicator animation timing function */
  INDICATOR_ANIMATION_TIMING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Default icon size */
  ICON_SIZE: '24px',
  /** Whether to enable ripple effect on tabs */
  RIPPLE: true
} as const;

/**
 * Tab layout types
 * @category Components
 */
export const TAB_LAYOUT = {
  /** Icon-only tab layout */
  ICON_ONLY: 'icon-only',
  /** Text-only tab layout */
  TEXT_ONLY: 'text-only',
  /** Icon and text layout */
  ICON_AND_TEXT: 'icon-and-text'
} as const;

/**
 * CSS class names used by the tabs component
 * @category Components
 */
export const TABS_CLASSES = {
  /** Root element class */
  ROOT: 'tabs',
  /** Root element with primary variant */
  PRIMARY: 'tabs--primary',
  /** Root element with secondary variant */
  SECONDARY: 'tabs--secondary',
  /** Root element with scrollable tabs */
  SCROLLABLE: 'tabs--scrollable',
  /** Scroll container element */
  SCROLL: 'tabs-scroll',
  /** Divider element */
  DIVIDER: 'tabs-divider',
  /** Indicator element */
  INDICATOR: 'tabs-indicator'
} as const;

/**
 * CSS class names used by the tab component
 * @category Components
 */
export const TAB_CLASSES = {
  /** Root element class */
  ROOT: 'tab',
  /** Active state class */
  ACTIVE: 'tab--active',
  /** Inactive state class */
  INACTIVE: 'tab--inactive',
  /** Disabled state class */
  DISABLED: 'tab--disabled',
  /** Text content container */
  TEXT: 'tab-text',
  /** Icon container */
  ICON: 'tab-icon',
  /** Ripple effect container */
  RIPPLE: 'tab-ripple',
  /** Root element with primary variant */
  PRIMARY: 'tab--primary',
  /** Root element with secondary variant */
  SECONDARY: 'tab--secondary',
  /** Container for text and icon */
  CONTAINER: 'tab-container',
  /** Badge container */
  BADGE: 'tab-badge'
} as const;