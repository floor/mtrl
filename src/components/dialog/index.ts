// src/components/dialog/index.ts

/**
 * Dialog Component Module
 * 
 * A Material Design 3 dialog implementation with support for multiple sizes,
 * animations, content types, and interactive features like confirmation.
 * 
 * Dialogs inform users about critical information, require decisions,
 * or involve multiple tasks.
 * 
 * @module components/dialog
 * @category Components
 */

// Main factory function
export { default } from './dialog';

// TypeScript types and interfaces
export { 
  DialogConfig, 
  DialogComponent, 
  DialogButton, 
  DialogEvent, 
  DialogConfirmOptions,
  DialogSize,
  DialogAnimation,
  DialogFooterAlignment,
  DialogEventType
} from './types';

/**
 * Dialog size constants
 * 
 * These constants define the available dialog size variants,
 * controlling the width and height of the dialog.
 * 
 * @example
 * import { createDialog, DIALOG_SIZES } from 'mtrl';
 * 
 * const dialog = createDialog({
 *   title: 'Settings',
 *   size: DIALOG_SIZES.MEDIUM
 * });
 * 
 * @category Components
 */
export const DIALOG_SIZES = {
  /** Small dialog (320px) for simple messages or choices */
  SMALL: 'small',
  /** Medium dialog (560px) for standard forms or content (default) */
  MEDIUM: 'medium',
  /** Large dialog (800px) for complex forms or rich content */
  LARGE: 'large',
  /** Dialog that spans the full width of the viewport with margins */
  FULLWIDTH: 'fullwidth',
  /** Dialog that takes up the entire viewport (similar to a new page) */
  FULLSCREEN: 'fullscreen'
} as const;

/**
 * Dialog animation constants
 * 
 * These constants define the available dialog opening and closing animations.
 * 
 * @example
 * import { createDialog, DIALOG_ANIMATIONS } from 'mtrl';
 * 
 * const dialog = createDialog({
 *   animation: DIALOG_ANIMATIONS.SCALE
 * });
 * 
 * @category Components
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
 * Dialog footer alignment constants
 * 
 * These constants control how buttons in the footer are aligned.
 * 
 * @example
 * import { createDialog, DIALOG_FOOTER_ALIGNMENTS } from 'mtrl';
 * 
 * const dialog = createDialog({
 *   footerAlignment: DIALOG_FOOTER_ALIGNMENTS.RIGHT
 * });
 * 
 * @category Components
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
 * Dialog event constants
 * 
 * These events can be used with the dialog's on() method to respond
 * to changes in the dialog's state.
 * 
 * @example
 * import { createDialog, DIALOG_EVENTS } from 'mtrl';
 * 
 * const dialog = createDialog();
 * 
 * dialog.on(DIALOG_EVENTS.AFTER_OPEN, () => {
 *   console.log('Dialog was opened');
 * });
 * 
 * @category Components
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