// src/components/bottom-sheet/constants.ts

/**
 * Bottom sheet variants.
 *
 * A standard sheet sits alongside the page and leaves it usable. A modal sheet
 * puts a scrim over the page and takes focus, so it is the one to reach for
 * when the sheet's task must finish before anything else continues.
 */
export const BOTTOM_SHEET_VARIANTS = {
  STANDARD: "standard",
  MODAL: "modal",
} as const;

/**
 * How far the sheet is open.
 *
 * `partial` shows the peek height, enough to say what the sheet holds without
 * covering the page. `expanded` shows as much as the content needs.
 */
export const BOTTOM_SHEET_STATES = {
  HIDDEN: "hidden",
  PARTIAL: "partial",
  EXPANDED: "expanded",
} as const;

/**
 * Defaults, from Compose BottomSheetDefaults and SheetBottomTokens.
 */
export const BOTTOM_SHEET_DEFAULTS = {
  VARIANT: BOTTOM_SHEET_VARIANTS.MODAL,
  /** BottomSheetDefaults.SheetPeekHeight */
  PEEK_HEIGHT: 56,
  /** BottomSheetDefaults.SheetMaxWidth; wider viewports centre the sheet */
  MAX_WIDTH: 640,
  /** A drag handle is part of the anatomy, so it is on unless asked otherwise */
  DRAG_HANDLE: true,
  CLOSE_ON_SCRIM_CLICK: true,
  CLOSE_ON_ESCAPE: true,
  /**
   * BottomSheetDefaults.PositionalThreshold: how far the sheet must be dragged
   * before it settles at the next anchor rather than springing back.
   */
  POSITIONAL_THRESHOLD: 56,
  /** BottomSheetDefaults.VelocityThreshold, in dp per second */
  VELOCITY_THRESHOLD: 125,
} as const;

/**
 * Class names, without the prefix. `getClass` adds it.
 */
export const BOTTOM_SHEET_CLASSES = {
  ROOT: "bottom-sheet",
  SCRIM: "bottom-sheet-scrim",
  CONTAINER: "bottom-sheet-container",
  HANDLE: "bottom-sheet-handle",
  HEADER: "bottom-sheet-header",
  TITLE: "bottom-sheet-title",
  CONTENT: "bottom-sheet-content",
} as const;

/**
 * Events the sheet emits.
 */
export const BOTTOM_SHEET_EVENTS = {
  OPEN: "open",
  CLOSE: "close",
  STATE_CHANGE: "stateChange",
  DRAG_START: "dragStart",
  DRAG_END: "dragEnd",
} as const;
