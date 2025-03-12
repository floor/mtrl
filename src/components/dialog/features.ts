// src/components/dialog/features.ts
import { getOverlayConfig } from './config';
import { DIALOG_SIZES, DIALOG_ANIMATIONS, DIALOG_FOOTER_ALIGNMENTS, DIALOG_EVENTS } from './constants';
import { DialogConfig, DialogButton, DialogEvent } from './types';
import createButton from '../button';
import { BUTTON_VARIANTS } from '../button/constants';
import { addClass, removeClass, hasClass } from '../../core/dom/classes';

/**
 * Creates the dialog DOM structure
 * @param config Dialog configuration
 * @returns Component enhancer with DOM structure
 */
export const withStructure = (config: DialogConfig) => component => {
  // Create the overlay element
  const overlayConfig = getOverlayConfig(config);
  const overlay = document.createElement(overlayConfig.tag || 'div');
  
  // Add overlay classes
  overlay.classList.add(component.getClass('dialog-overlay'));
  
  // Set overlay attributes safely
  if (overlayConfig.attrs && typeof overlayConfig.attrs === 'object') {
    Object.entries(overlayConfig.attrs).forEach(([key, value]) => {
      if (key && typeof key === 'string' && value !== undefined) {
        overlay.setAttribute(key, String(value));
      }
    });
  }
  
  // Set custom z-index if provided
  if (config.zIndex) {
    overlay.style.zIndex = String(config.zIndex);
  }
  
  // Create internal structure
  const createHeader = () => {
    const header = document.createElement('div');
    header.classList.add(component.getClass('dialog-header'));
    
    const headerContent = document.createElement('div');
    headerContent.classList.add(component.getClass('dialog-header-content'));
    header.appendChild(headerContent);
    
    if (config.title) {
      const title = document.createElement('h2');
      title.classList.add(component.getClass('dialog-header-title'));
      title.textContent = config.title;
      headerContent.appendChild(title);
    }
    
    if (config.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.classList.add(component.getClass('dialog-header-subtitle'));
      subtitle.textContent = config.subtitle;
      headerContent.appendChild(subtitle);
    }
    
    if (config.closeButton !== false) {
      const closeButton = document.createElement('button');
      closeButton.classList.add(component.getClass('dialog-header-close'));
      closeButton.setAttribute('aria-label', 'Close dialog');
      closeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      
      // Close button click handler with event-based communication
      closeButton.addEventListener('click', (e) => {
        console.log('closeButton click');
        e.preventDefault();
        e.stopPropagation();
        
        // Use the dialog:close custom event which will be listened for in withVisibility
        if (component && component.emit) {
          component.emit('dialog:close', { source: 'closeButton' });
        }
      });
      
      header.appendChild(closeButton);
    }
    
    return header;
  };
  
  const createContent = () => {
    const content = document.createElement('div');
    content.classList.add(component.getClass('dialog-content'));
    
    if (config.content) {
      content.innerHTML = config.content;
    }
    
    return content;
  };
  
  const createFooter = () => {
    const footer = document.createElement('div');
    footer.classList.add(component.getClass('dialog-footer'));
    
    // Apply footer alignment
    const alignment = config.footerAlignment || DIALOG_FOOTER_ALIGNMENTS.RIGHT;
    if (alignment !== DIALOG_FOOTER_ALIGNMENTS.RIGHT) {
      addClass(footer, `${component.getClass('dialog-footer')}--${alignment}`);
    }
    
    // Add buttons if provided
    if (Array.isArray(config.buttons) && config.buttons.length > 0) {
      config.buttons.forEach(buttonConfig => addButton(footer, buttonConfig, component));
    }
    
    return footer;
  };
  
  // Create the dialog structure
  const header = createHeader();
  const content = createContent();
  const footer = Array.isArray(config.buttons) && config.buttons.length > 0 ? createFooter() : null;
  
  // Add header, content, and footer to dialog
  component.element.appendChild(header);
  component.element.appendChild(content);
  if (footer) {
    component.element.appendChild(footer);
  }
  
  // Add dialog to overlay
  overlay.appendChild(component.element);
  
  // Add dialog classes
  addClass(component.element, component.getClass('dialog'));
  
  // Apply size class
  const size = config.size || DIALOG_SIZES.MEDIUM;
  if (size !== DIALOG_SIZES.MEDIUM) {
    addClass(component.element, `${component.getClass('dialog')}--${size}`);
  }
  
  // Apply animation class
  const animation = config.animation || DIALOG_ANIMATIONS.SCALE;
  if (animation !== DIALOG_ANIMATIONS.SCALE) {
    addClass(component.element, `${component.getClass('dialog')}--${animation}`);
  }
  
  // Add overlay to container or document.body
  const container = config.container || document.body;
  container.appendChild(overlay);
  
  // Store elements in component
  return {
    ...component,
    overlay,
    structure: {
      header,
      content,
      footer,
      container
    }
  };
};

/**
 * Adds button to dialog footer
 * @param footer Footer element
 * @param buttonConfig Button configuration
 * @param component Dialog component
 */
const addButton = (footer: HTMLElement, buttonConfig: DialogButton, component: any) => {
  const {
    text,
    variant = BUTTON_VARIANTS.TEXT,
    onClick,
    closeDialog = true,
    autofocus = false,
    attrs = {}
  } = buttonConfig;
  
  const button = createButton({
    text,
    variant,
    ...attrs
  });
  
  // Button click handler with event-based communication
  button.on('click', event => {
    console.log('button click');
    let shouldClose = closeDialog;
    
    // Call onClick handler if provided
    if (typeof onClick === 'function') {
      try {
        const result = onClick(event, component);
        if (result === false) {
          shouldClose = false;
        }
      } catch (err) {
        console.error('Error in onClick handler:', err);
      }
    }
    
    // Close dialog if needed - using event-based communication
    if (shouldClose) {
      if (component && component.emit) {
        component.emit('dialog:close', { source: 'button', text });
      }
    }
  });
  
  // Set autofocus if needed
  if (autofocus) {
    button.element.setAttribute('autofocus', 'true');
  }
  
  footer.appendChild(button.element);
  
  // Store button instance
  if (!component._buttons) {
    component._buttons = [];
  }
  
  component._buttons.push({
    config: buttonConfig,
    instance: button
  });
};

/**
 * Add visibility control to dialog
 * @returns Component enhancer with visibility features
 */
export const withVisibility = () => component => {
  // Initial state
  const isOpen = component.config.open === true;
  
  // Setup animation duration
  const animationDuration = component.config.animationDuration || 150;
  
  // Helper functions to handle focus trap
  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let previouslyFocusedElement: HTMLElement | null = null;
  
  const trapFocus = () => {
    if (!component.config.trapFocus) return;
    
    const focusableContent = component.element.querySelectorAll(focusableElements);
    if (focusableContent.length === 0) return;
    
    const firstFocusableElement = focusableContent[0] as HTMLElement;
    const lastFocusableElement = focusableContent[focusableContent.length - 1] as HTMLElement;
    
    // Focus the first element if autofocus is enabled
    if (component.config.autofocus) {
      // Check for a button with autofocus attribute
      const autofocusElement = component.element.querySelector('[autofocus]') as HTMLElement;
      if (autofocusElement) {
        autofocusElement.focus();
      } else {
        firstFocusableElement.focus();
      }
    }
    
    // Set up the keyboard trap
    component.element.addEventListener('keydown', handleKeyDown);
    
    function handleKeyDown(e: KeyboardEvent) {
      const isTabPressed = e.key === 'Tab';
      
      if (!isTabPressed) return;
      
      if (e.shiftKey) {
        // If shift + tab pressed and focus is on first element, move to last
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        // If tab pressed and focus is on last element, move to first
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    }
  };
  
  const releaseFocus = () => {
    if (!component.config.trapFocus) return;
    
    component.element.removeEventListener('keydown', handleKeyDown);
    
    // Restore focus to previously focused element
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }
    
    function handleKeyDown() {}
  };
  
  const setupEvents = () => {
    // Handle overlay click
    if (component.config.closeOnOverlayClick !== false) {
      component.overlay.addEventListener('click', handleOverlayClick);
    }
    
    // Handle Escape key
    if (component.config.closeOnEscape !== false) {
      document.addEventListener('keydown', handleEscKey);
    }
  };
  
  const cleanupEvents = () => {
    component.overlay.removeEventListener('click', handleOverlayClick);
    document.removeEventListener('keydown', handleEscKey);
  };
  
  function handleOverlayClick(e: MouseEvent) {
    // Only close if the click was directly on the overlay
    if (e.target === component.overlay) {
      visibility.close();
    }
  }
  
  function handleEscKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && visibility.isOpen()) {
      visibility.close();
    }
  }
  
  // Setup initial state
  if (isOpen) {
    addClass(component.overlay, `${component.getClass('dialog-overlay')}--visible`);
    addClass(component.element, `${component.getClass('dialog')}--visible`);
    
    // Setup focus trap and events
    trapFocus();
    setupEvents();
  }
  
  // Create visibility object with clean methods
  const visibility = {
    open() {
      // Don't do anything if already open
      if (this.isOpen()) return;
      
      // Store the currently focused element
      previouslyFocusedElement = document.activeElement as HTMLElement;
      
      // Trigger before open event
      const beforeOpenEvent = { 
        dialog: component, 
        defaultPrevented: false, 
        preventDefault: () => { beforeOpenEvent.defaultPrevented = true; } 
      };
      
      if (typeof component.emit === 'function') {
        component.emit(DIALOG_EVENTS.BEFORE_OPEN, beforeOpenEvent);
      }
      
      // If event was prevented, don't open
      if (beforeOpenEvent.defaultPrevented) return;
      
      // Add to DOM if needed
      if (component.overlay && !component.overlay.parentNode) {
        const container = component.structure.container || document.body;
        container.appendChild(component.overlay);
      }
      
      // Show the overlay
      addClass(component.overlay, `${component.getClass('dialog-overlay')}--visible`);
      
      // Show the dialog
      setTimeout(() => {
        addClass(component.element, `${component.getClass('dialog')}--visible`);
        
        // Setup focus trap and events
        trapFocus();
        setupEvents();
        
        // Trigger open event
        if (typeof component.emit === 'function') {
          component.emit(DIALOG_EVENTS.OPEN, { dialog: component });
          
          setTimeout(() => {
            component.emit(DIALOG_EVENTS.AFTER_OPEN, { dialog: component });
          }, animationDuration);
        }
      }, 10);
    },
    
    close() {
      console.log('Dialog close method called');
      
      // Trigger before close event
      const beforeCloseEvent = { 
        dialog: component, 
        defaultPrevented: false, 
        preventDefault: () => { beforeCloseEvent.defaultPrevented = true; } 
      };
      
      if (typeof component.emit === 'function') {
        component.emit(DIALOG_EVENTS.BEFORE_CLOSE, beforeCloseEvent);
      }
      
      // If event was prevented, don't close
      if (beforeCloseEvent.defaultPrevented) {
        console.log('Dialog close prevented by event handler');
        return;
      }
      
      // Get class names
      const dialogVisibleClass = `${component.getClass('dialog')}--visible`;
      const overlayVisibleClass = `${component.getClass('dialog-overlay')}--visible`;
      
      // Remove dialog visible class
      removeClass(component.element, dialogVisibleClass);
      
      // Remove overlay visible class
      removeClass(component.overlay, overlayVisibleClass);
      
      // Release focus and cleanup events
      releaseFocus();
      cleanupEvents();
      
      // Trigger close events
      if (typeof component.emit === 'function') {
        component.emit(DIALOG_EVENTS.CLOSE, { dialog: component });
      }
      
      // Remove from DOM after animation completes
      setTimeout(() => {
        if (component.overlay && component.overlay.parentNode) {
          component.overlay.parentNode.removeChild(component.overlay);
        }
        
        if (typeof component.emit === 'function') {
          component.emit(DIALOG_EVENTS.AFTER_CLOSE, { dialog: component });
        }
      }, animationDuration);
    },
    
    toggle(open?: boolean) {
      if (open === undefined) {
        this.isOpen() ? this.close() : this.open();
      } else if (open) {
        this.open();
      } else {
        this.close();
      }
    },
    
    isOpen() {
      return component.element.classList.contains(`${component.getClass('dialog')}--visible`);
    }
  };
  
  // Set up event listener for the dialog:close event
  if (component && component.on) {
    component.on('dialog:close', () => {
      visibility.close();
    });
  }
  
  return {
    ...component,
    visibility
  };
};

/**
 * Adds content management features to dialog
 * @returns Component enhancer with content features
 */
export const withContent = () => component => {
  const headerElement = component.structure.header;
  const contentElement = component.structure.content;
  const footerElement = component.structure.footer;
  
  return {
    ...component,
    content: {
      /**
       * Sets dialog title
       * @param title Title text
       */
      setTitle(title: string) {
        let titleElement = headerElement.querySelector(`.${component.getClass('dialog-header-title')}`);
        
        if (!titleElement && title) {
          // Create title element if it doesn't exist
          titleElement = document.createElement('h2');
          titleElement.classList.add(component.getClass('dialog-header-title'));
          headerElement.querySelector(`.${component.getClass('dialog-header-content')}`).appendChild(titleElement);
        }
        
        if (titleElement) {
          titleElement.textContent = title;
        }
      },
      
      /**
       * Gets dialog title
       * @returns Title text
       */
      getTitle() {
        const titleElement = headerElement.querySelector(`.${component.getClass('dialog-header-title')}`);
        return titleElement ? titleElement.textContent || '' : '';
      },
      
      /**
       * Sets dialog subtitle
       * @param subtitle Subtitle text
       */
      setSubtitle(subtitle: string) {
        let subtitleElement = headerElement.querySelector(`.${component.getClass('dialog-header-subtitle')}`);
        
        if (!subtitleElement && subtitle) {
          // Create subtitle element if it doesn't exist
          subtitleElement = document.createElement('p');
          subtitleElement.classList.add(component.getClass('dialog-header-subtitle'));
          headerElement.querySelector(`.${component.getClass('dialog-header-content')}`).appendChild(subtitleElement);
        }
        
        if (subtitleElement) {
          subtitleElement.textContent = subtitle;
        }
      },
      
      /**
       * Gets dialog subtitle
       * @returns Subtitle text
       */
      getSubtitle() {
        const subtitleElement = headerElement.querySelector(`.${component.getClass('dialog-header-subtitle')}`);
        return subtitleElement ? subtitleElement.textContent || '' : '';
      },
      
      /**
       * Sets dialog content
       * @param content Content HTML
       */
      setContent(content: string) {
        contentElement.innerHTML = content;
      },
      
      /**
       * Gets dialog content
       * @returns Content HTML
       */
      getContent() {
        return contentElement.innerHTML;
      },
      
      /**
       * Gets dialog header element
       * @returns Header element
       */
      getHeaderElement() {
        return headerElement;
      },
      
      /**
       * Gets dialog content element
       * @returns Content element
       */
      getContentElement() {
        return contentElement;
      },
      
      /**
       * Gets dialog footer element
       * @returns Footer element
       */
      getFooterElement() {
        return footerElement;
      }
    }
  };
};

/**
 * Adds button management features to dialog
 * @returns Component enhancer with button features
 */
export const withButtons = () => component => {
  // Initialize buttons array if not already done
  if (!component._buttons) {
    component._buttons = [];
  }
  
  return {
    ...component,
    buttons: {
      /**
       * Adds a button to the dialog footer
       * @param button Button configuration
       */
      addButton(button: DialogButton) {
        // Create footer if it doesn't exist
        let footer = component.structure.footer;
        
        if (!footer) {
          footer = document.createElement('div');
          footer.classList.add(component.getClass('dialog-footer'));
          
          // Apply footer alignment
          const alignment = component.config.footerAlignment || DIALOG_FOOTER_ALIGNMENTS.RIGHT;
          if (alignment !== DIALOG_FOOTER_ALIGNMENTS.RIGHT) {
            addClass(footer, `${component.getClass('dialog-footer')}--${alignment}`);
          }
          
          component.element.appendChild(footer);
          component.structure.footer = footer;
        }
        
        // Add the button
        addButton(footer, button, component);
      },
      
      /**
       * Removes a button by index or text
       * @param indexOrText Button index or text
       */
      removeButton(indexOrText: number | string) {
        if (typeof indexOrText === 'number') {
          // Remove by index
          if (indexOrText >= 0 && indexOrText < component._buttons.length) {
            const button = component._buttons[indexOrText];
            button.instance.destroy();
            component._buttons.splice(indexOrText, 1);
          }
        } else {
          // Remove by text
          const index = component._buttons.findIndex(button => 
            button.config.text === indexOrText);
          
          if (index !== -1) {
            const button = component._buttons[index];
            button.instance.destroy();
            component._buttons.splice(index, 1);
          }
        }
        
        // If no buttons left, remove footer
        if (component._buttons.length === 0 && component.structure.footer) {
          component.element.removeChild(component.structure.footer);
          component.structure.footer = null;
        }
      },
      
      /**
       * Gets all footer buttons
       * @returns Array of button configurations
       */
      getButtons() {
        return component._buttons.map(button => button.config);
      },
      
      /**
       * Sets footer alignment
       * @param alignment Footer alignment
       */
      setFooterAlignment(alignment: keyof typeof DIALOG_FOOTER_ALIGNMENTS | DIALOG_FOOTER_ALIGNMENTS) {
        if (!component.structure.footer) return;
        
        // Remove existing alignment classes
        Object.values(DIALOG_FOOTER_ALIGNMENTS).forEach(align => {
          if (align !== DIALOG_FOOTER_ALIGNMENTS.RIGHT) {
            removeClass(component.structure.footer, `${component.getClass('dialog-footer')}--${align}`);
          }
        });
        
        // Add new alignment class if not right (default)
        if (alignment !== DIALOG_FOOTER_ALIGNMENTS.RIGHT) {
          addClass(component.structure.footer, `${component.getClass('dialog-footer')}--${alignment}`);
        }
      }
    }
  };
};

/**
 * Adds size management features to dialog
 * @returns Component enhancer with size features
 */
export const withSize = () => component => {
  return {
    ...component,
    size: {
      /**
       * Sets dialog size
       * @param size Size variant
       */
      setSize(size: keyof typeof DIALOG_SIZES | DIALOG_SIZES) {
        // Remove existing size classes
        Object.values(DIALOG_SIZES).forEach(sizeValue => {
          removeClass(component.element, `${component.getClass('dialog')}--${sizeValue}`);
        });
        
        // Add new size class if not medium (default)
        if (size !== DIALOG_SIZES.MEDIUM) {
          addClass(component.element, `${component.getClass('dialog')}--${size}`);
        }
      }
    }
  };
};

/**
 * Adds confirmation dialog features
 * @returns Component enhancer with confirm feature
 */
export const withConfirm = () => component => {
  return {
    ...component,
    confirm(options) {
      return new Promise((resolve) => {
        const {
          title = 'Confirm',
          message,
          confirmText = 'Yes',
          cancelText = 'No',
          confirmVariant = BUTTON_VARIANTS.FILLED,
          cancelVariant = BUTTON_VARIANTS.TEXT,
          size = DIALOG_SIZES.SMALL
        } = options;
        
        // Set dialog properties
        component.content.setTitle(title);
        component.content.setContent(`<p>${message}</p>`);
        component.size.setSize(size);
        
        // Clear existing buttons
        component._buttons.forEach(button => button.instance.destroy());
        component._buttons = [];
        
        // Add confirm and cancel buttons
        component.buttons.addButton({
          text: confirmText,
          variant: confirmVariant,
          onClick: () => {
            resolve(true);
          }
        });
        
        component.buttons.addButton({
          text: cancelText,
          variant: cancelVariant,
          onClick: () => {
            resolve(false);
          }
        });
        
        // Open the dialog
        component.visibility.open();
      });
    }
  };
};