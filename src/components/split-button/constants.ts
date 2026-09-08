// src/components/split-button/constants.ts
//
// Measurements from the Material 3 split button tokens (Compose
// SplitButtonXSmallTokens through SplitButtonXLargeTokens) and from
// m3.material.io/components/split-button/specs.

/**
 * Visual styles, the same set the button offers
 * @category Components
 */
export const SPLIT_BUTTON_VARIANTS = {
  FILLED: "filled",
  TONAL: "tonal",
  OUTLINED: "outlined",
  ELEVATED: "elevated",
} as const;

/**
 * Sizes, matching the button and icon button scale
 * @category Components
 */
export const SPLIT_BUTTON_SIZES = {
  XS: "xs",
  S: "s",
  M: "m",
  L: "l",
  XL: "xl",
} as const;

/**
 * Events the component emits
 * @category Components
 */
export const SPLIT_BUTTON_EVENTS = {
  /** The leading button was activated */
  CLICK: "click",
  /** The trailing button opened whatever it opens */
  EXPAND: "expand",
  /** The trailing button closed it */
  COLLAPSE: "collapse",
  /** Either of the two, carrying the new state */
  CHANGE: "change",
  /** A menu item was chosen, when the component owns a menu */
  SELECT: "select",
} as const;

/**
 * Defaults
 * @category Components
 */
export const SPLIT_BUTTON_DEFAULTS = {
  VARIANT: SPLIT_BUTTON_VARIANTS.FILLED,
  SIZE: SPLIT_BUTTON_SIZES.S,
  /** Accessible name of the trailing button when none is given */
  TRAILING_LABEL: "More options",
  /** How far the menu sits from the button (M3 split button guidelines) */
  MENU_OFFSET: 4,
} as const;

/**
 * CSS class names, without the prefix
 * @category Components
 */
export const SPLIT_BUTTON_CLASSES = {
  ROOT: "split-button",
  LEADING: "split-button__leading",
  TRAILING: "split-button__trailing",
  CHEVRON: "split-button__chevron",
  EXPANDED: "split-button--expanded",
} as const;

/**
 * The trailing button's icon. It always points down and turns 180 degrees
 * when the button is activated, so it should not be swapped out
 * (M3 split button guidelines, "Anatomy").
 * @category Components
 */
export const SPLIT_BUTTON_CHEVRON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">' +
  '<path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/></svg>';
