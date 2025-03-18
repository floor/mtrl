// src/components/dialog/api.ts (partial update)
import { DialogComponent, DialogEvent, DialogButton, DialogConfirmOptions, DialogFooterAlignment, DialogSize, DialogEventType } from './types';
import { removeClass } from '../../core/dom/classes';

interface ApiOptions {
  visibility: {
    open: () => void;
    close: () => void;
    toggle: (open?: boolean) => void;
    isOpen: () => boolean;
  };
  content: {
    setTitle: (title: string) => void;
    getTitle: () => string;
    setSubtitle: (subtitle: string) => void;
    getSubtitle: () => string;
    setContent: (content: string) => void;
    getContent: () => string;
    getHeaderElement: () => HTMLElement | null;
    getContentElement: () => HTMLElement | null;
    getFooterElement: () => HTMLElement | null;
  };
  buttons: {
    addButton: (button: DialogButton) => void;
    removeButton: (indexOrText: number | string) => void;
    getButtons: () => DialogButton[];
    setFooterAlignment: (alignment: DialogFooterAlignment | string) => void;
  };
  focus: {
    trapFocus: () => void;
    releaseFocus: () => void;
  };
  size: {
    setSize: (size: DialogSize | string) => void;
  };
  dividers: {
    toggleHeaderDivider: (show: boolean) => void;
    toggleFooterDivider: (show: boolean) => void;
  };
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
    trigger: (event: string, data: any) => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

interface ComponentWithElements {
  element: HTMLElement;
  overlay: HTMLElement;
  getClass: (name: string) => string;
  confirm?: (options: DialogConfirmOptions) => Promise<boolean>;
}

/**
 * Enhances a dialog component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Dialog component
 */
export const withAPI = (options: ApiOptions) => 
  (component: ComponentWithElements): DialogComponent => ({
    ...component as any,
    
    /**
     * Opens the dialog
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    open() {
      options.visibility.open();
      return this;
    },
    
    /**
     * Closes the dialog
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    close() {
      options.visibility.close();
      return this;
    },
    
    /**
     * Toggles dialog open/closed state
     * @param {boolean} [open] - Optional flag to force open state
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    toggle(open?: boolean) {
      options.visibility.toggle(open);
      return this;
    },
    
    /**
     * Checks if dialog is open
     * @returns {boolean} True if dialog is open
     */
    isOpen() {
      return options.visibility.isOpen();
    },
    
    /**
     * Sets dialog title
     * @param {string} title - Title text
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    setTitle(title: string) {
      options.content.setTitle(title);
      return this;
    },
    
    /**
     * Gets dialog title
     * @returns {string} Title text
     */
    getTitle() {
      return options.content.getTitle();
    },
    
    /**
     * Sets dialog subtitle
     * @param {string} subtitle - Subtitle text
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    setSubtitle(subtitle: string) {
      options.content.setSubtitle(subtitle);
      return this;
    },
    
    /**
     * Gets dialog subtitle
     * @returns {string} Subtitle text
     */
    getSubtitle() {
      return options.content.getSubtitle();
    },

    /**
     * Sets dialog content
     * @param {string} content - Content HTML
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    setContent(content: string) {
      options.content.setContent(content);
      return this;
    },
    
    /**
     * Gets dialog content
     * @returns {string} Content HTML
     */
    getContent() {
      return options.content.getContent();
    },
    
    /**
     * Adds a button to the dialog footer
     * @param {DialogButton} button - Button configuration
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    addButton(button: DialogButton) {
      options.buttons.addButton(button);
      return this;
    },
    
    /**
     * Removes a button by index or text
     * @param {number|string} indexOrText - Button index or text
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    removeButton(indexOrText: number | string) {
      options.buttons.removeButton(indexOrText);
      return this;
    },
    
    /**
     * Gets all footer buttons
     * @returns {DialogButton[]} Array of button configurations
     */
    getButtons() {
      return options.buttons.getButtons();
    },
    
    /**
     * Sets footer alignment
     * @param {string} alignment - Footer alignment
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    setFooterAlignment(alignment: DialogFooterAlignment | string) {
      options.buttons.setFooterAlignment(alignment);
      return this;
    },

    /**
     * Shows or hides the divider
     * @param {boolean} show - Whether to show the divider
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    toggleDivider(show: boolean) {
      options.divider.toggleDivider(show);
      return this;
    },
    
    /**
     * Checks if the dialog has a divider
     * @returns {boolean} True if the dialog has a divider
     */
    hasDivider() {
      return options.divider.hasDivider();
    },

    /**
     * Sets dialog size
     * @param {string} size - Size variant
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    setSize(size: DialogSize | string) {
      options.size.setSize(size);
      return this;
    },
    
    /**
     * Adds event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    on(event: DialogEventType | string, handler: (event: DialogEvent) => void) {
      options.events.on(event, handler);
      return this;
    },
    
    /**
     * Removes event listener
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {DialogComponent} Dialog component instance for chaining
     */
    off(event: DialogEventType | string, handler: (event: DialogEvent) => void) {
      options.events.off(event, handler);
      return this;
    },
    
    /**
     * Gets dialog header element
     * @returns {HTMLElement|null} Header element
     */
    getHeaderElement() {
      return options.content.getHeaderElement();
    },
    
    /**
     * Gets dialog content element
     * @returns {HTMLElement|null} Content element
     */
    getContentElement() {
      return options.content.getContentElement();
    },
    
    /**
     * Gets dialog footer element
     * @returns {HTMLElement|null} Footer element
     */
    getFooterElement() {
      return options.content.getFooterElement();
    },
    
    /**
     * Creates a confirmation dialog with Yes/No buttons
     * @param {DialogConfirmOptions} options - Confirmation dialog options
     * @returns {Promise<boolean>} Promise resolving to user choice (true for confirm, false for cancel)
     */
    confirm(options?: DialogConfirmOptions) {
      if (component.confirm) {
        return component.confirm(options || { message: 'Are you sure?' });
      }
      
      // Fallback if confirm feature is not available
      return Promise.resolve(false);
    },
    
    /**
     * Destroys the dialog and removes it from DOM
     */
    destroy() {
      // Close the dialog first if it's open
      console.log('destroy', this.isOpen());
      if (this.isOpen()) {
        // We'll handle removal directly rather than calling this.close()
        // to avoid animation delay in critical cleanup
        const dialogVisibleClass = `${component.getClass('dialog')}--visible`;
        const overlayVisibleClass = `${component.getClass('dialog-overlay')}--visible`;
        
        // Remove visibility classes using core utilities
        removeClass(component.element, dialogVisibleClass);
        removeClass(component.overlay, overlayVisibleClass);
        
        // Call any cleanup needed
        if (options.focus && options.focus.releaseFocus) {
          options.focus.releaseFocus();
        }
      }
      
      // Call lifecycle destroy
      options.lifecycle.destroy();
      
      // Immediately remove from DOM
      if (component.overlay && component.overlay.parentNode) {
        component.overlay.parentNode.removeChild(component.overlay);
      }
    },
    
    // Pass through element references
    element: component.element,
    overlay: component.overlay
  });