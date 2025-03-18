// src/components/dialog/index.ts
export { default } from './dialog';
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

// Export common dialog constants for convenience and backward compatibility
export const DIALOG_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  FULLWIDTH: 'fullwidth',
  FULLSCREEN: 'fullscreen'
} as const;

export const DIALOG_ANIMATIONS = {
  SCALE: 'scale',
  SLIDE_UP: 'slide-up',
  SLIDE_DOWN: 'slide-down',
  FADE: 'fade'
} as const;

export const DIALOG_FOOTER_ALIGNMENTS = {
  RIGHT: 'right',
  LEFT: 'left',
  CENTER: 'center',
  SPACE_BETWEEN: 'space-between'
} as const;

export const DIALOG_EVENTS = {
  OPEN: 'open',
  CLOSE: 'close',
  BEFORE_OPEN: 'beforeopen',
  BEFORE_CLOSE: 'beforeclose',
  AFTER_OPEN: 'afteropen',
  AFTER_CLOSE: 'afterclose'
} as const;