// src/components/dialog/constants.ts

/**
 * Dialog sizes
 */
export const DIALOG_SIZES = {
  /** 320px width, for simple messages or choices */
  SMALL: 'small',
  /** 560px width, for standard forms or content (default) */
  MEDIUM: 'medium',
  /** 800px width, for complex forms or rich content */
  LARGE: 'large',
  /** Spans the full width of the viewport with margins */
  FULLWIDTH: 'fullwidth',
  /** Takes up the entire viewport (similar to a new page) */
  FULLSCREEN: 'fullscreen'
} as const;

/**
 * Dialog animation types
 */
export const DIALOG_ANIMATIONS = {
  /** Scale up/down animation from center (default) */
  SCALE: 'scale',
  /** Slide in from bottom, slide out to bottom */
  SLIDE_UP: 'slide-up',
  /** Slide in from top, slide out to top */
  SLIDE_DOWN: 'slide-down',
  /** Simple fade in/out animation */
  FADE: 'fade'
} as const;

/**
 * Footer alignment options
 */
export const DIALOG_FOOTER_ALIGNMENTS = {
  /** Align buttons to the right (default, follows Material Design guidelines) */
  RIGHT: 'right',
  /** Align buttons to the left */
  LEFT: 'left',
  /** Center buttons in footer */
  CENTER: 'center',
  /** Space buttons evenly, with first button at left, last at right */
  SPACE_BETWEEN: 'space-between'
} as const;

/**
 * Dialog events
 */
export const DIALOG_EVENTS = {
  /** Fired when the dialog begins opening */
  OPEN: 'open',
  /** Fired when the dialog begins closing */
  CLOSE: 'close',
  /** Fired before the dialog starts opening (can be prevented) */
  BEFORE_OPEN: 'beforeopen',
  /** Fired before the dialog starts closing (can be prevented) */
  BEFORE_CLOSE: 'beforeclose',
  /** Fired after the dialog has fully opened (animation complete) */
  AFTER_OPEN: 'afteropen',
  /** Fired after the dialog has fully closed (animation complete) */
  AFTER_CLOSE: 'afterclose'
} as const;

/**
 * Dialog CSS classes
 */
export const DIALOG_CLASSES = {
  /** Root dialog element */
  ROOT: 'dialog',
  /** Overlay background */
  OVERLAY: 'dialog-overlay',
  /** Dialog container */
  CONTAINER: 'dialog-container',
  /** Dialog header */
  HEADER: 'dialog-header',
  /** Dialog title */
  TITLE: 'dialog-title',
  /** Dialog subtitle */
  SUBTITLE: 'dialog-subtitle',
  /** Close button */
  CLOSE_BUTTON: 'dialog-close-button',
  /** Dialog content */
  CONTENT: 'dialog-content',
  /** Dialog footer */
  FOOTER: 'dialog-footer',
  /** Dialog divider */
  DIVIDER: 'dialog-divider',
  /** Added when dialog is open */
  OPEN: 'dialog--open',
  /** Added when dialog is animating */
  ANIMATING: 'dialog--animating'
} as const;

/**
 * Default animation duration in milliseconds
 */
export const DEFAULT_ANIMATION_DURATION = 300;

/**
 * Default z-index for dialogs
 */
export const DEFAULT_Z_INDEX = 1000;

/**
 * Button variants for dialog buttons following Material Design 3
 */
export const DIALOG_BUTTON_VARIANTS = {
  /** Text button (low emphasis) */
  TEXT: 'text',
  /** Filled button (high emphasis) */
  FILLED: 'filled',
  /** Outlined button (medium emphasis) */
  OUTLINED: 'outlined',
  /** Tonal button (medium emphasis) */
  TONAL: 'tonal'
} as const;

/**
 * Default button text for confirmation dialogs
 */
export const DEFAULT_CONFIRM_BUTTON_TEXT = 'Yes';

/**
 * Default button text for cancellation in dialogs
 */
export const DEFAULT_CANCEL_BUTTON_TEXT = 'No';