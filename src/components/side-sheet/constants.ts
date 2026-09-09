// src/components/side-sheet/constants.ts

/**
 * Side sheet variants.
 *
 * A standard sheet is docked: it sits in the layout beside the page and leaves
 * it usable. A modal sheet floats over the page behind a scrim and takes focus.
 * They differ in colour as well as behaviour, which is why the variant is not
 * only a class (m3.material.io/components/side-sheets).
 */
export const SIDE_SHEET_VARIANTS = {
  STANDARD: "standard",
  MODAL: "modal",
} as const;

/**
 * Which edge the sheet is docked to.
 *
 * These are logical, not physical: `end` is the right edge in a left-to-right
 * document and the left edge in a right-to-left one, so a sheet does not need
 * reconfiguring per language.
 */
export const SIDE_SHEET_POSITIONS = {
  START: "start",
  END: "end",
} as const;

/**
 * Defaults, from the M3 side sheet specs and the Android implementation.
 */
export const SIDE_SHEET_DEFAULTS = {
  VARIANT: SIDE_SHEET_VARIANTS.MODAL,
  /** Side sheets dock to the trailing edge unless told otherwise */
  POSITION: SIDE_SHEET_POSITIONS.END,
  /** The width the Android implementation uses for a standard sheet */
  WIDTH: 256,
  /** m3.material.io side sheet specs, container maximum width */
  MAX_WIDTH: 400,
  /** A modal sheet offers a way out of itself */
  CLOSE_BUTTON: true,
  CLOSE_ON_SCRIM_CLICK: true,
  CLOSE_ON_ESCAPE: true,
} as const;

/**
 * Class names, without the prefix. `getClass` adds it.
 */
export const SIDE_SHEET_CLASSES = {
  ROOT: "side-sheet",
  SCRIM: "side-sheet-scrim",
  CONTAINER: "side-sheet-container",
  HEADER: "side-sheet-header",
  TITLE: "side-sheet-title",
  CLOSE: "side-sheet-close",
  DIVIDER: "side-sheet-divider",
  CONTENT: "side-sheet-content",
  ACTIONS: "side-sheet-actions",
} as const;

/**
 * Events the sheet emits.
 */
export const SIDE_SHEET_EVENTS = {
  OPEN: "open",
  CLOSE: "close",
} as const;
