// src/components/navigation/constants.ts

/**
 * Navigation variants following Material Design 3
 */
export const NAV_VARIANTS = {
  /** Navigation rail - thin vertical bar with icons and optional labels */
  RAIL: 'rail',
  /** Drawer navigation - wider drawer that can expand/collapse */
  DRAWER: 'drawer',
  /** Bar navigation - horizontal navigation bar */
  BAR: 'bar',
  /** Modal navigation - floating navigation that appears on demand */
  MODAL: 'modal',
  /** Standard navigation - basic navigation layout */
  STANDARD: 'standard'
} as const;

/**
 * Navigation positions
 */
export const NAV_POSITIONS = {
  /** Left side of the screen */
  LEFT: 'left',
  /** Right side of the screen */
  RIGHT: 'right',
  /** Top of the screen */
  TOP: 'top',
  /** Bottom of the screen */
  BOTTOM: 'bottom'
} as const;

/**
 * Navigation behaviors
 */
export const NAV_BEHAVIORS = {
  /** Fixed in place, always visible */
  FIXED: 'fixed',
  /** Can be dismissed/hidden */
  DISMISSIBLE: 'dismissible',
  /** Modal overlay that can be opened/closed */
  MODAL: 'modal'
} as const;

/**
 * Navigation item states
 */
export const NAV_ITEM_STATES = {
  /** Currently selected item */
  ACTIVE: 'active',
  /** Item cannot be interacted with */
  DISABLED: 'disabled',
  /** Item with children is expanded */
  EXPANDED: 'expanded',
  /** Item with children is collapsed */
  COLLAPSED: 'collapsed',
  /** Mouse is hovering over the item */
  HOVERED: 'hovered',
  /** Item has keyboard focus */
  FOCUSED: 'focused',
  /** Item is being pressed */
  PRESSED: 'pressed'
} as const;

/**
 * Navigation event names
 */
export const NAV_EVENTS = {
  /** Fired when an item is selected */
  CHANGE: 'change',
  /** Fired when navigation is expanded */
  EXPAND: 'expand',
  /** Fired when navigation is collapsed */
  COLLAPSE: 'collapse',
  /** Fired when a nested item group is expanded */
  GROUP_EXPAND: 'group:expand',
  /** Fired when a nested item group is collapsed */
  GROUP_COLLAPSE: 'group:collapse'
} as const;

/**
 * Default configuration values
 */
export const NAV_DEFAULTS = {
  /** Default navigation variant */
  VARIANT: NAV_VARIANTS.STANDARD,
  /** Default navigation position */
  POSITION: NAV_POSITIONS.LEFT,
  /** Default navigation behavior */
  BEHAVIOR: NAV_BEHAVIORS.FIXED,
  /** Whether navigation is expanded by default */
  EXPANDED: false,
  /** Whether to show item labels by default */
  SHOW_LABELS: true,
  /** Whether scrim is enabled for modal navigation */
  SCRIM_ENABLED: true
} as const;

/**
 * CSS classes for navigation elements
 */
export const NAV_CLASSES = {
  /** Container element */
  CONTAINER: 'nav',
  /** Navigation variant class prefix */
  VARIANT_PREFIX: 'nav--',
  /** Navigation position class prefix */
  POSITION_PREFIX: 'nav--pos-',
  /** Navigation behavior class prefix */
  BEHAVIOR_PREFIX: 'nav--',
  /** Expanded state class */
  EXPANDED: 'nav--expanded',
  /** Disabled state class */
  DISABLED: 'nav--disabled',
  /** Navigation item */
  ITEM: 'nav-item',
  /** Item container (wrapper) */
  ITEM_CONTAINER: 'nav-item-container',
  /** Navigation item icon */
  ICON: 'nav-item-icon',
  /** Navigation item text label */
  LABEL: 'nav-item-label',
  /** Navigation item badge */
  BADGE: 'nav-item-badge',
  /** Navigation divider */
  DIVIDER: 'nav-divider',
  /** Modal background scrim */
  SCRIM: 'nav-scrim',
  /** Navigation item group */
  GROUP: 'nav-group',
  /** Group title */
  GROUP_TITLE: 'nav-group-title',
  /** Item subtitle */
  SUBTITLE: 'nav-subtitle',
  /** Container for nested items */
  NESTED_CONTAINER: 'nav-nested-container',
  /** Nested navigation item */
  NESTED_ITEM: 'nav-nested-item',
  /** Icon for expanding/collapsing nested items */
  EXPAND_ICON: 'nav-expand-icon',
  /** Active state class */
  ACTIVE: 'nav-item--active',
  /** Disabled state class */
  ITEM_DISABLED: 'nav-item--disabled'
} as const;