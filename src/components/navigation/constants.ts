// src/components/navigation/constants.ts

/**
 * Navigation variants following Material Design 3
 */
export const NAV_VARIANTS = {
  RAIL: 'rail', // Vertical slim navigation
  DRAWER: 'drawer', // Expandable side navigation
  BAR: 'bar', // Bottom or top navigation bar
  DRAWER_MODAL: 'modal', // Modal drawer overlay
  DRAWER_STANDARD: 'standard' // Standard permanent drawer
} as const;

/**
 * Navigation positions
 */
export const NAV_POSITIONS = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom'
} as const;

/**
 * Navigation behaviors
 */
export const NAV_BEHAVIORS = {
  FIXED: 'fixed', // Always visible
  DISMISSIBLE: 'dismissible', // Can be dismissed/hidden
  MODAL: 'modal' // Overlays content with scrim
} as const;

/**
 * Navigation state classes
 */
export const NAV_STATES = {
  ACTIVE: 'active', // Currently selected item
  DISABLED: 'disabled', // Disabled state
  EXPANDED: 'expanded', // Drawer expanded state
  COLLAPSED: 'collapsed', // Drawer collapsed state
  HOVERED: 'hovered', // Hover state
  FOCUSED: 'focused', // Keyboard focus state
  PRESSED: 'pressed' // Press/click state
} as const;

/**
 * Navigation element classes
 */
export const NAV_CLASSES = {
  ROOT: 'nav',
  ITEM: 'nav-item',
  ITEM_CONTAINER: 'nav-item-container',
  ICON: 'nav-item-icon',
  LABEL: 'nav-item-label',
  BADGE: 'nav-item-badge',
  DIVIDER: 'nav-divider',
  SCRIM: 'nav-scrim',
  GROUP: 'nav-group',
  GROUP_TITLE: 'nav-group-title',
  SUBTITLE: 'nav-subtitle',
  NESTED_CONTAINER: 'nav-nested-container',
  NESTED_ITEM: 'nav-nested-item',
  EXPAND_ICON: 'nav-expand-icon'
} as const;

/**
 * Validation schema for navigation configuration
 */
export const NAV_SCHEMA = {
  type: 'object',
  properties: {
    variant: {
      type: 'string',
      enum: Object.values(NAV_VARIANTS),
      optional: true,
      default: NAV_VARIANTS.RAIL
    },
    position: {
      type: 'string',
      enum: Object.values(NAV_POSITIONS),
      optional: true,
      default: NAV_POSITIONS.LEFT
    },
    behavior: {
      type: 'string',
      enum: Object.values(NAV_BEHAVIORS),
      optional: true,
      default: NAV_BEHAVIORS.FIXED
    },
    items: {
      type: 'array',
      optional: true,
      default: []
    },
    groups: {
      type: 'array',
      optional: true
    },
    disabled: {
      type: 'boolean',
      optional: true
    },
    expanded: {
      type: 'boolean',
      optional: true
    },
    showLabels: {
      type: 'boolean',
      optional: true,
      default: true
    },
    scrimEnabled: {
      type: 'boolean',
      optional: true,
      default: false
    },
    class: {
      type: 'string',
      optional: true
    }
  }
} as const;

/**
 * Navigation item states
 */
export const NAV_ITEM_STATES = {
  EXPANDED: 'expanded',
  COLLAPSED: 'collapsed'
} as const;

/**
 * Navigation item schema
 * Enhanced with support for nested items
 */
export const NAV_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      required: true
    },
    icon: {
      type: 'string',
      required: true
    },
    label: {
      type: 'string',
      required: true
    },
    badge: {
      type: 'string',
      optional: true
    },
    disabled: {
      type: 'boolean',
      optional: true
    },
    subtitle: {
      type: 'string',
      optional: true
    },
    groupId: {
      type: 'string',
      optional: true
    },
    items: {
      type: 'array',
      optional: true,
      description: 'Nested navigation items'
    },
    expanded: {
      type: 'boolean',
      optional: true,
      default: false
    }
  }
} as const;

/**
 * Navigation group schema
 */
export const NAV_GROUP_SCHEMA = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      required: true
    },
    title: {
      type: 'string',
      required: true
    },
    expanded: {
      type: 'boolean',
      optional: true,
      default: true
    }
  }
} as const;