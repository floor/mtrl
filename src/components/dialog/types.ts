// src/components/dialog/types.ts
import { DIALOG_SIZES, DIALOG_ANIMATIONS, DIALOG_FOOTER_ALIGNMENTS, DIALOG_EVENTS } from './constants';

/**
 * Configuration interface for the Dialog component
 */
export interface DialogConfig {
  /** Dialog title text */
  title?: string;
  
  /** Dialog subtitle text */
  subtitle?: string;
  
  /** Dialog content (text or HTML) */
  content?: string;
  
  /** Whether to show close button in header */
  closeButton?: boolean;
  
  /** CSS class to add to dialog */
  class?: string;
  
  /** Dialog size variant */
  size?: keyof typeof DIALOG_SIZES | DIALOG_SIZES;
  
  /** Dialog animation variant */
  animation?: keyof typeof DIALOG_ANIMATIONS | DIALOG_ANIMATIONS;
  
  /** Footer buttons alignment */
  footerAlignment?: keyof typeof DIALOG_FOOTER_ALIGNMENTS | DIALOG_FOOTER_ALIGNMENTS;
  
  /** Whether dialog is initially open */
  open?: boolean;
  
  /** Whether to close when clicking overlay */
  closeOnOverlayClick?: boolean;
  
  /** Whether to close when Escape key is pressed */
  closeOnEscape?: boolean;
  
  /** Whether dialog should be modal (prevent interaction with background) */
  modal?: boolean;
  
  /** Whether to focus the first focusable element when opened */
  autofocus?: boolean;
  
  /** Whether to trap focus within dialog when opened */
  trapFocus?: boolean;
  
  /** Parent element to append dialog to (defaults to document.body) */
  container?: HTMLElement;
  
  /** Footer buttons configuration */
  buttons?: DialogButton[];
  
  /** Whether to show a divider between header and content */
  headerDivider?: boolean;
  
  /** Whether to show a divider between content and footer */
  footerDivider?: boolean;
  
  /** Dialog z-index (defaults to 1000) */
  zIndex?: number;
  
  /** Duration of open/close animations in ms */
  animationDuration?: number;
  
  /** Event handlers for dialog events */
  on?: {
    [key in keyof typeof DIALOG_EVENTS]?: (event: DialogEvent) => void;
  };
}

/**
 * Dialog button configuration
 */
export interface DialogButton {
  /** Button text */
  text: string;
  
  /** Button variant (uses button component variants) */
  variant?: string;
  
  /** Button color */
  color?: string;
  
  /** Button size */
  size?: string;
  
  /** Button onclick handler */
  onClick?: (event: MouseEvent, dialog: DialogComponent) => void | boolean;
  
  /** Close dialog when button is clicked */
  closeDialog?: boolean;
  
  /** Autofocus this button when dialog opens */
  autofocus?: boolean;
  
  /** Additional button attributes */
  attrs?: Record<string, any>;
}

/**
 * Dialog event object
 */
export interface DialogEvent {
  /** Dialog component instance */
  dialog: DialogComponent;
  
  /** Original event if applicable */
  originalEvent?: Event;
  
  /** Whether to prevent the default action */
  preventDefault: () => void;
  
  /** Whether default action was prevented */
  defaultPrevented: boolean;
}

/**
 * Dialog component interface
 */
export interface DialogComponent {
  /** Dialog element */
  element: HTMLElement;
  
  /** Dialog overlay element */
  overlay: HTMLElement;
  
  /** Opens the dialog */
  open: () => DialogComponent;
  
  /** Closes the dialog */
  close: () => DialogComponent;
  
  /** Toggles dialog open/closed state */
  toggle: (open?: boolean) => DialogComponent;
  
  /** Checks if dialog is open */
  isOpen: () => boolean;
  
  /** Sets dialog title */
  setTitle: (title: string) => DialogComponent;
  
  /** Gets dialog title */
  getTitle: () => string;
  
  /** Sets dialog subtitle */
  setSubtitle: (subtitle: string) => DialogComponent;
  
  /** Gets dialog subtitle */
  getSubtitle: () => string;
  
  /** Sets dialog content */
  setContent: (content: string) => DialogComponent;
  
  /** Gets dialog content */
  getContent: () => string;
  
  /** Adds a button to the dialog footer */
  addButton: (button: DialogButton) => DialogComponent;
  
  /** Removes a button by index or text */
  removeButton: (indexOrText: number | string) => DialogComponent;
  
  /** Gets all footer buttons */
  getButtons: () => DialogButton[];
  
  /** Sets footer alignment */
  setFooterAlignment: (alignment: keyof typeof DIALOG_FOOTER_ALIGNMENTS | DIALOG_FOOTER_ALIGNMENTS) => DialogComponent;
  
  /** Sets dialog size */
  setSize: (size: keyof typeof DIALOG_SIZES | DIALOG_SIZES) => DialogComponent;
  
  /** Adds event listener */
  on: (event: keyof typeof DIALOG_EVENTS | DIALOG_EVENTS, handler: (event: DialogEvent) => void) => DialogComponent;
  
  /** Removes event listener */
  off: (event: keyof typeof DIALOG_EVENTS | DIALOG_EVENTS, handler: (event: DialogEvent) => void) => DialogComponent;
  
  /** Gets dialog header element */
  getHeaderElement: () => HTMLElement | null;
  
  /** Gets dialog content element */
  getContentElement: () => HTMLElement | null;
  
  /** Gets dialog footer element */
  getFooterElement: () => HTMLElement | null;
  
  /** Creates a confirmation dialog with Yes/No buttons */
  confirm: (options?: DialogConfirmOptions) => Promise<boolean>;
  
  /** Destroys the dialog and removes it from DOM */
  destroy: () => void;
}

/**
 * Options for confirmation dialog
 */
export interface DialogConfirmOptions {
  /** Confirmation title */
  title?: string;
  
  /** Confirmation message */
  message: string;
  
  /** Confirm button text */
  confirmText?: string;
  
  /** Cancel button text */
  cancelText?: string;
  
  /** Confirm button variant */
  confirmVariant?: string;
  
  /** Cancel button variant */
  cancelVariant?: string;
  
  /** Dialog size */
  size?: keyof typeof DIALOG_SIZES | DIALOG_SIZES;
}