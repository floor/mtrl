// src/components/dialog/types.ts

/**
 * Dialog size types - determines the width and height of the dialog
 * 
 * @category Components
 * @remarks
 * - small: 320px width, for simple messages or choices
 * - medium: 560px width, for standard forms or content (default)
 * - large: 800px width, for complex forms or rich content
 * - fullwidth: Spans the full width of the viewport with margins
 * - fullscreen: Takes up the entire viewport (similar to a new page)
 */
export type DialogSize = 'small' | 'medium' | 'large' | 'fullwidth' | 'fullscreen';

/**
 * Dialog animation types - controls how the dialog appears and disappears
 * 
 * @category Components
 * @remarks
 * - scale: Scale up/down animation from center (default)
 * - slide-up: Slide in from bottom, slide out to bottom
 * - slide-down: Slide in from top, slide out to top
 * - fade: Simple fade in/out animation
 */
export type DialogAnimation = 'scale' | 'slide-up' | 'slide-down' | 'fade';

/**
 * Dialog footer alignment types - controls how buttons in the footer are aligned
 * 
 * @category Components
 * @remarks
 * - right: Align buttons to the right (default, follows Material Design guidelines)
 * - left: Align buttons to the left
 * - center: Center buttons in footer
 * - space-between: Space buttons evenly, with first button at left, last at right
 */
export type DialogFooterAlignment = 'right' | 'left' | 'center' | 'space-between';

/**
 * Dialog event types - events that can be listened to with the on() method
 * 
 * @category Components
 * @remarks
 * - open: Fired when the dialog begins opening
 * - close: Fired when the dialog begins closing
 * - beforeopen: Fired before the dialog starts opening (can be prevented)
 * - beforeclose: Fired before the dialog starts closing (can be prevented)
 * - afteropen: Fired after the dialog has fully opened (animation complete)
 * - afterclose: Fired after the dialog has fully closed (animation complete)
 */
export type DialogEventType = 'open' | 'close' | 'beforeopen' | 'beforeclose' | 'afteropen' | 'afterclose';

/**
 * Configuration interface for the Dialog component
 * 
 * @category Components
 * @description
 * Defines the appearance and behavior of a dialog component.
 * All properties are optional with sensible defaults.
 */
export interface DialogConfig {
  /** 
   * Dialog title text - appears in the header
   * @example "Settings"
   */
  title?: string;
  
  /** 
   * Dialog subtitle text - appears below title in smaller text
   * @example "Configure your preferences"
   */
  subtitle?: string;
  
  /** 
   * Dialog content (text or HTML)
   * Can include rich content like forms, images, etc.
   * @example "This action cannot be undone."
   */
  content?: string;
  
  /** 
   * Whether to show close button (X) in the header
   * @default true
   */
  closeButton?: boolean;
  
  /** 
   * Additional CSS classes to apply to the dialog
   * @example "settings-dialog important-dialog"
   */
  class?: string;
  
  /** 
   * Dialog size variant
   * Controls the width and height of the dialog
   * @default "medium"
   */
  size?: DialogSize | string;
  
  /** 
   * Dialog animation variant
   * Controls how the dialog appears and disappears
   * @default "scale"
   */
  animation?: DialogAnimation | string;
  
  /** 
   * Footer buttons alignment
   * Controls how buttons in the footer are positioned
   * @default "right"
   */
  footerAlignment?: DialogFooterAlignment | string;
  
  /** 
   * Whether dialog is initially open
   * @default false
   */
  open?: boolean;
  
  /** 
   * Whether to close when clicking overlay background
   * When true, allows users to dismiss by clicking outside
   * @default true
   */
  closeOnOverlayClick?: boolean;
  
  /** 
   * Whether to close when Escape key is pressed
   * @default true
   */
  closeOnEscape?: boolean;
  
  /** 
   * Whether dialog should be modal
   * When true, prevents interaction with background content
   * @default true 
   */
  modal?: boolean;
  
  /** 
   * Whether to focus the first focusable element when opened
   * Important for accessibility and keyboard navigation
   * @default true
   */
  autofocus?: boolean;
  
  /** 
   * Whether to trap focus within dialog when opened
   * Prevents tabbing outside the dialog, improving accessibility
   * @default true
   */
  trapFocus?: boolean;
  
  /** 
   * Parent element to append dialog to
   * @default document.body
   */
  container?: HTMLElement;
  
  /** 
   * Footer buttons configuration
   * Array of button objects to display in the footer
   */
  buttons?: DialogButton[];
  
  /** 
   * Whether to show a divider between header and content
   * @default false
   */
  divider?: boolean;
  
  /** 
   * Dialog z-index - controls stacking order
   * @default 1000
   */
  zIndex?: number;
  
  /** 
   * Duration of open/close animations in milliseconds
   * @default 300
   */
  animationDuration?: number;
  
  /** 
   * Event handlers for dialog events
   * Register event handlers during initialization
   * @example
   * {
   *   afteropen: (event) => { console.log('Dialog opened'); }
   * }
   */
  on?: {
    [key in DialogEventType]?: (event: DialogEvent) => void;
  };
}

/**
 * Dialog button configuration
 * 
 * Defines the appearance and behavior of buttons in the dialog footer.
 * 
 * @category Components
 */
export interface DialogButton {
  /** 
   * Button text label 
   * @example "Save" | "Cancel" | "Delete"
   */
  text: string;
  
  /** 
   * Button variant (uses button component variants)
   * @default "text"
   * @example "filled" | "text" | "outlined" | "tonal"
   */
  variant?: string;
  
  /** 
   * Button color
   * @example "primary" | "error"
   */
  color?: string;
  
  /** 
   * Button size
   * @default "medium"
   * @example "small" | "medium" | "large"
   */
  size?: string;
  
  /** 
   * Button click handler
   * Return false to prevent dialog closing
   * @param event - The click event
   * @param dialog - The dialog component instance
   * @returns Optional boolean, false prevents dialog from closing
   */
  onClick?: (event: MouseEvent, dialog: DialogComponent) => void | boolean;
  
  /** 
   * Whether to close the dialog when this button is clicked
   * Set to false for validation or multi-step flows
   * @default true
   */
  closeDialog?: boolean;
  
  /** 
   * Whether to autofocus this button when the dialog opens
   * Typically used for primary action buttons
   * @default false 
   */
  autofocus?: boolean;
  
  /** 
   * Additional button attributes to pass to the button element
   * @example { 'data-id': 'save-button', 'form': 'profile-form' }
   */
  attrs?: Record<string, any>;
}

/**
 * Dialog event object
 * 
 * Passed to event handlers registered with the on() method.
 * 
 * @category Components
 */
export interface DialogEvent {
  /** 
   * Dialog component instance that triggered the event
   */
  dialog: DialogComponent;
  
  /** 
   * Original browser event if applicable
   * May be undefined for programmatic events
   */
  originalEvent?: Event;
  
  /** 
   * Call this method to prevent the default action
   * For example, to prevent a dialog from closing
   */
  preventDefault: () => void;
  
  /** 
   * Whether the default action was prevented
   * Will be true if preventDefault() was called
   */
  defaultPrevented: boolean;
}

/**
 * Dialog component interface
 * 
 * Provides methods for controlling a Material Design 3 dialog
 * 
 * @category Components
 */
export interface DialogComponent {
  /** 
   * The dialog's root DOM element 
   */
  element: HTMLElement;
  
  /** 
   * The dialog's overlay/backdrop element 
   */
  overlay: HTMLElement;
  
  /**
   * Opens the dialog
   * Displays the dialog with animation
   * @returns Dialog component for method chaining
   */
  open: () => DialogComponent;
  
  /**
   * Closes the dialog
   * Hides the dialog with animation
   * @returns Dialog component for method chaining
   */
  close: () => DialogComponent;
  
  /**
   * Toggles dialog open/closed state
   * @param open - Optional boolean to force specific state
   * @returns Dialog component for method chaining
   * @example
   * dialog.toggle(); // Toggle current state
   * dialog.toggle(true); // Force open
   */
  toggle: (open?: boolean) => DialogComponent;
  
  /**
   * Checks if dialog is currently open
   * @returns True if dialog is open, false otherwise
   */
  isOpen: () => boolean;
  
  /**
   * Sets dialog title text
   * @param title - New title to display in header
   * @returns Dialog component for method chaining
   */
  setTitle: (title: string) => DialogComponent;
  
  /**
   * Gets dialog current title text
   * @returns Current title text
   */
  getTitle: () => string;
  
  /**
   * Sets dialog subtitle text
   * @param subtitle - New subtitle to display below title
   * @returns Dialog component for method chaining
   */
  setSubtitle: (subtitle: string) => DialogComponent;
  
  /**
   * Gets dialog current subtitle text
   * @returns Current subtitle text
   */
  getSubtitle: () => string;
  
  /**
   * Sets dialog content
   * @param content - New content (text or HTML)
   * @returns Dialog component for method chaining
   */
  setContent: (content: string) => DialogComponent;
  
  /**
   * Gets dialog content
   * @returns Current content text/HTML
   */
  getContent: () => string;
  
  /**
   * Adds a button to the dialog footer
   * @param button - Button configuration object
   * @returns Dialog component for method chaining
   */
  addButton: (button: DialogButton) => DialogComponent;
  
  /**
   * Removes a button by index or text
   * @param indexOrText - Button index or text content
   * @returns Dialog component for method chaining
   * @example
   * dialog.removeButton(0); // Remove first button
   * dialog.removeButton('Cancel'); // Remove button with text 'Cancel'
   */
  removeButton: (indexOrText: number | string) => DialogComponent;
  
  /**
   * Gets all footer buttons
   * @returns Array of button configuration objects
   */
  getButtons: () => DialogButton[];
  
  /**
   * Sets footer button alignment
   * @param alignment - Alignment value
   * @returns Dialog component for method chaining
   */
  setFooterAlignment: (alignment: DialogFooterAlignment | string) => DialogComponent;
  
  /**
   * Sets dialog size
   * @param size - Size variant
   * @returns Dialog component for method chaining
   */
  setSize: (size: DialogSize | string) => DialogComponent;
  
  /**
   * Adds an event listener to the dialog
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Dialog component for method chaining
   * @example
   * dialog.on('beforeclose', (event) => {
   *   // Prevent dialog from closing if form is invalid
   *   if (!isFormValid()) {
   *     event.preventDefault();
   *   }
   * });
   */
  on: (event: DialogEventType | string, handler: (event: DialogEvent) => void) => DialogComponent;
  
  /**
   * Removes an event listener from the dialog
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Dialog component for method chaining
   */
  off: (event: DialogEventType | string, handler: (event: DialogEvent) => void) => DialogComponent;
  
  /**
   * Gets dialog header element
   * @returns Header element or null if not present
   */
  getHeaderElement: () => HTMLElement | null;
  
  /**
   * Gets dialog content element
   * @returns Content element or null if not present
   */
  getContentElement: () => HTMLElement | null;
  
  /**
   * Gets dialog footer element
   * @returns Footer element or null if not present
   */
  getFooterElement: () => HTMLElement | null;
  
  /**
   * Shows or hides the divider between header and content
   * @param show - Whether to show or hide divider
   * @returns Dialog component for method chaining
   */
  toggleDivider: (show: boolean) => DialogComponent;
  
  /**
   * Checks if the dialog has a divider visible
   * @returns True if divider is visible, false otherwise
   */
  hasDivider: () => boolean;
  
  /**
   * Creates a confirmation dialog with Yes/No buttons
   * Returns a promise that resolves to true if confirmed, false otherwise
   * 
   * @param options - Confirmation dialog options
   * @returns Promise resolving to boolean result
   * @example
   * const result = await dialog.confirm({
   *   title: 'Delete Item',
   *   message: 'Are you sure you want to delete this item?'
   * });
   * 
   * if (result) {
   *   deleteItem();
   * }
   */
  confirm: (options?: DialogConfirmOptions) => Promise<boolean>;
  
  /**
   * Destroys the dialog and removes it from DOM
   * Cleans up all event listeners and references
   */
  destroy: () => void;
}

/**
 * Options for confirmation dialog
 * 
 * Used with the dialog.confirm() method to create a simple
 * confirmation dialog with customizable options.
 * 
 * @category Components
 */
export interface DialogConfirmOptions {
  /** 
   * Confirmation dialog title 
   * @default "Confirm"
   * @example "Delete Item"
   */
  title?: string;
  
  /** 
   * Confirmation message/question to display
   * Required field for the confirmation dialog
   * @example "Are you sure you want to delete this item?"
   */
  message: string;
  
  /** 
   * Confirm button text
   * @default "Yes"
   * @example "Delete" | "Confirm" | "Yes, I'm sure"
   */
  confirmText?: string;
  
  /** 
   * Cancel button text
   * @default "No"
   * @example "Cancel" | "No, go back"
   */
  cancelText?: string;
  
  /** 
   * Confirm button variant
   * @default "filled"
   * @example "filled" | "tonal"
   */
  confirmVariant?: string;
  
  /** 
   * Cancel button variant
   * @default "text"
   * @example "text" | "outlined"
   */
  cancelVariant?: string;
  
  /** 
   * Dialog size for the confirmation dialog
   * @default "small"
   */
  size?: DialogSize | string;
}