// src/components/drawer/constants.ts

/**
 * Drawer variants matching MD3 navigation drawer specification
 */
export const DRAWER_VARIANTS = {
  /** Standard drawer — inline, can be permanently visible or toggled */
  STANDARD: "standard",
  /** Modal drawer — overlays content with scrim, for compact/medium screens */
  MODAL: "modal",
} as const;

/**
 * Drawer positions (anchor edge)
 */
export const DRAWER_POSITIONS = {
  /** Start edge (left in LTR, right in RTL) — default per MD3 */
  START: "start",
  /** End edge (right in LTR, left in RTL) */
  END: "end",
} as const;

/**
 * Drawer item types for the items configuration array
 */
export const DRAWER_ITEM_TYPES = {
  /** Navigation destination item */
  ITEM: "item",
  /** Visual separator between groups */
  DIVIDER: "divider",
  /** Section label / subhead for grouping */
  SECTION: "section",
} as const;

/**
 * Drawer events
 */
export const DRAWER_EVENTS = {
  /** Fired when the drawer opens */
  OPEN: "open",
  /** Fired when the drawer closes */
  CLOSE: "close",
  /** Fired when a navigation item is selected */
  SELECT: "select",
} as const;

/**
 * CSS classes used by the drawer component
 */
export const DRAWER_CLASSES = {
  /** Root container */
  ROOT: "drawer",
  /** Scrim overlay (modal variant only) */
  SCRIM: "drawer__scrim",
  /** Inner sheet / panel */
  SHEET: "drawer__sheet",
  /** Headline text */
  HEADLINE: "drawer__headline",
  /** Scrollable items container */
  ITEMS: "drawer__items",
  /** Single navigation item */
  ITEM: "drawer__item",
  /** Item icon */
  ITEM_ICON: "drawer__item-icon",
  /** Item label text */
  ITEM_LABEL: "drawer__item-label",
  /** Item badge */
  ITEM_BADGE: "drawer__item-badge",
  /** Active indicator shape */
  ACTIVE_INDICATOR: "drawer__active-indicator",
  /** Dense/compact variant */
  DENSE: "drawer--dense",
  /** Divider separator */
  DIVIDER: "drawer__divider",
  /** Section label */
  SECTION_LABEL: "drawer__section-label",
} as const;

/**
 * Default animation configuration
 */
export const DRAWER_ANIMATION = {
  /** Animation duration in milliseconds */
  DURATION: 300,
  /** Easing for opening */
  EASING_OPEN: "cubic-bezier(0.0, 0.0, 0.2, 1.0)",
  /** Easing for closing */
  EASING_CLOSE: "cubic-bezier(0.3, 0.0, 1.0, 1.0)",
} as const;

/**
 * Drawer default values
 */
export const DRAWER_DEFAULTS = {
  /** Default variant */
  VARIANT: DRAWER_VARIANTS.STANDARD,
  /** Default position */
  POSITION: DRAWER_POSITIONS.START,
  /** Whether drawer is open by default */
  OPEN: false,
  /** Whether modal can be dismissed via scrim */
  DISMISSIBLE: true,
  /** Default drawer width in pixels */
  WIDTH: 360,
} as const;
