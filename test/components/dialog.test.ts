// test/components/dialog.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { 
  type DialogComponent,
  type DialogConfig,
  type DialogButton,
  type DialogSize,
  type DialogAnimation,
  type DialogFooterAlignment,
  type DialogEventType
} from '../../src/components/dialog/types';

// Setup jsdom environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;

beforeAll(() => {
  // Create a new JSDOM instance
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true
  });
  
  // Get window and document from jsdom
  window = dom.window;
  document = window.document;
  
  // Store original globals
  originalGlobalDocument = global.document;
  originalGlobalWindow = global.window;
  
  // Set globals to use jsdom
  global.document = document;
  global.window = window;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.HTMLButtonElement = window.HTMLButtonElement;
  global.Event = window.Event;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  
  // Clean up jsdom
  window.close();
});

// Mock dialog implementation
const createMockDialog = (config: DialogConfig = {}): DialogComponent => {
  // Create main elements
  const element = document.createElement('div');
  element.className = 'mtrl-dialog';
  
  const overlay = document.createElement('div');
  overlay.className = 'mtrl-dialog-overlay';
  
  // Default settings
  const settings = {
    title: config.title || '',
    subtitle: config.subtitle || '',
    content: config.content || '',
    closeButton: config.closeButton !== undefined ? config.closeButton : true,
    size: config.size || 'medium',
    animation: config.animation || 'scale',
    footerAlignment: config.footerAlignment || 'right',
    closeOnOverlayClick: config.closeOnOverlayClick !== undefined ? config.closeOnOverlayClick : true,
    closeOnEscape: config.closeOnEscape !== undefined ? config.closeOnEscape : true,
    modal: config.modal !== undefined ? config.modal : true,
    autofocus: config.autofocus !== undefined ? config.autofocus : true,
    trapFocus: config.trapFocus !== undefined ? config.trapFocus : true,
    divider: config.divider !== undefined ? config.divider : false,
    zIndex: config.zIndex || 1000,
    animationDuration: config.animationDuration || 300,
    buttons: [...(config.buttons || [])]
  };
  
  // Set size class
  if (settings.size) {
    element.classList.add(`mtrl-dialog--${settings.size}`);
  }
  
  // Set animation class
  if (settings.animation) {
    element.classList.add(`mtrl-dialog--animation-${settings.animation}`);
  }
  
  // Create dialog structure
  const container = document.createElement('div');
  container.className = 'mtrl-dialog-container';
  
  // Create dialog header
  const header = document.createElement('div');
  header.className = 'mtrl-dialog-header';
  
  const titleElement = document.createElement('h2');
  titleElement.className = 'mtrl-dialog-title';
  titleElement.textContent = settings.title;
  header.appendChild(titleElement);
  
  if (settings.subtitle) {
    const subtitleElement = document.createElement('h3');
    subtitleElement.className = 'mtrl-dialog-subtitle';
    subtitleElement.textContent = settings.subtitle;
    header.appendChild(subtitleElement);
  }
  
  if (settings.closeButton) {
    const closeButton = document.createElement('button');
    closeButton.className = 'mtrl-dialog-close';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      dialog.close();
    });
    header.appendChild(closeButton);
  }
  
  container.appendChild(header);
  
  // Add divider if configured
  if (settings.divider) {
    const divider = document.createElement('hr');
    divider.className = 'mtrl-dialog-divider';
    container.appendChild(divider);
  }
  
  // Create dialog content
  const content = document.createElement('div');
  content.className = 'mtrl-dialog-content';
  
  if (settings.content) {
    if (settings.content.includes('<')) {
      content.innerHTML = settings.content;
    } else {
      content.textContent = settings.content;
    }
  }
  
  container.appendChild(content);
  
  // Create dialog footer with buttons
  const footer = document.createElement('div');
  footer.className = 'mtrl-dialog-footer';
  footer.classList.add(`mtrl-dialog-footer--${settings.footerAlignment}`);
  
  const buttons: DialogButton[] = [...settings.buttons];
  
  buttons.forEach(button => {
    const buttonElement = document.createElement('button');
    buttonElement.className = 'mtrl-button';
    
    if (button.variant) {
      buttonElement.classList.add(`mtrl-button--${button.variant}`);
    }
    
    if (button.color) {
      buttonElement.classList.add(`mtrl-button--${button.color}`);
    }
    
    if (button.size) {
      buttonElement.classList.add(`mtrl-button--${button.size}`);
    }
    
    buttonElement.textContent = button.text;
    
    if (button.attrs) {
      for (const [key, value] of Object.entries(button.attrs)) {
        buttonElement.setAttribute(key, value);
      }
    }
    
    if (button.autofocus) {
      buttonElement.setAttribute('autofocus', 'true');
    }
    
    buttonElement.addEventListener('click', (event) => {
      let shouldClose = button.closeDialog !== false;
      
      if (button.onClick) {
        const result = button.onClick(event, dialog);
        if (result === false) {
          shouldClose = false;
        }
      }
      
      if (shouldClose) {
        dialog.close();
      }
    });
    
    footer.appendChild(buttonElement);
  });
  
  container.appendChild(footer);
  element.appendChild(container);
  
  // Track open state
  let isDialogOpen = config.open || false;
  
  // Track event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Initialize event handlers from config
  if (config.on) {
    for (const [event, handler] of Object.entries(config.on)) {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
    }
  }
  
  // Create dialog event
  const createDialogEvent = (type: string, originalEvent?: Event): any => {
    let defaultPrevented = false;
    
    return {
      dialog,
      originalEvent,
      preventDefault: () => {
        defaultPrevented = true;
      },
      defaultPrevented
    };
  };
  
  // Emit event
  const emit = (eventType: string, originalEvent?: Event) => {
    if (eventHandlers[eventType]) {
      const event = createDialogEvent(eventType, originalEvent);
      for (const handler of eventHandlers[eventType]) {
        handler(event);
      }
      return event.defaultPrevented;
    }
    return false;
  };
  
  // Set Z-index
  overlay.style.zIndex = String(settings.zIndex);
  element.style.zIndex = String(settings.zIndex + 1);
  
  // Add class
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(cls => element.classList.add(cls));
  }
  
  // Initial setup
  if (isDialogOpen) {
    overlay.classList.add('mtrl-dialog-overlay--open');
    element.classList.add('mtrl-dialog--open');
  } else {
    overlay.style.display = 'none';
    element.style.display = 'none';
  }
  
  // Handle overlay click
  overlay.addEventListener('click', (event) => {
    if (settings.closeOnOverlayClick && event.target === overlay) {
      dialog.close();
    }
  });
  
  // Handle escape key
  const handleEscapeKey = (event: any) => {
    if (settings.closeOnEscape && isDialogOpen && event.key === 'Escape') {
      dialog.close();
    }
  };
  
  document.addEventListener('keydown', handleEscapeKey);
  
  // Create dialog component
  const dialog: DialogComponent = {
    element,
    overlay,
    
    open: () => {
      if (!isDialogOpen) {
        // Emit beforeopen event
        if (emit('beforeopen')) {
          return dialog; // Event was prevented
        }
        
        overlay.style.display = 'block';
        element.style.display = 'block';
        
        // For tests, we run immediately instead of setTimeout
        overlay.classList.add('mtrl-dialog-overlay--open');
        element.classList.add('mtrl-dialog--open');
        
        isDialogOpen = true;
        
        // Auto focus the first button or focusable element
        if (settings.autofocus) {
          const autofocusButton = element.querySelector('[autofocus]');
          if (autofocusButton) {
            (autofocusButton as HTMLElement).focus();
          } else {
            const firstFocusable = element.querySelector('button, [tabindex], a, input, select, textarea');
            if (firstFocusable) {
              (firstFocusable as HTMLElement).focus();
            }
          }
        }
        
        // Emit afteropen event
        emit('afteropen');
        
        // Emit open event
        emit('open');
      }
      
      return dialog;
    },
    
    close: () => {
      if (isDialogOpen) {
        // Emit beforeclose event
        if (emit('beforeclose')) {
          return dialog; // Event was prevented
        }
        
        overlay.classList.remove('mtrl-dialog-overlay--open');
        element.classList.remove('mtrl-dialog--open');
        
        // For tests, we run immediately instead of setTimeout
        if (!isDialogOpen) {
          overlay.style.display = 'none';
          element.style.display = 'none';
        }
        
        // Emit afterclose event
        emit('afterclose');
        
        isDialogOpen = false;
        
        // Emit close event
        emit('close');
      }
      
      return dialog;
    },
    
    toggle: (open?: boolean) => {
      if (open === undefined) {
        return isDialogOpen ? dialog.close() : dialog.open();
      } else {
        return open ? dialog.open() : dialog.close();
      }
    },
    
    isOpen: () => isDialogOpen,
    
    setTitle: (title: string) => {
      settings.title = title;
      const titleEl = element.querySelector('.mtrl-dialog-title');
      if (titleEl) {
        titleEl.textContent = title;
      }
      return dialog;
    },
    
    getTitle: () => settings.title,
    
    setSubtitle: (subtitle: string) => {
      settings.subtitle = subtitle;
      
      let subtitleEl = element.querySelector('.mtrl-dialog-subtitle');
      if (!subtitleEl && subtitle) {
        // Create subtitle element if it doesn't exist
        subtitleEl = document.createElement('h3');
        subtitleEl.className = 'mtrl-dialog-subtitle';
        const titleEl = element.querySelector('.mtrl-dialog-title');
        if (titleEl?.parentNode) {
          titleEl.parentNode.insertBefore(subtitleEl, titleEl.nextSibling);
        }
      }
      
      if (subtitleEl) {
        if (subtitle) {
          subtitleEl.textContent = subtitle;
        } else {
          subtitleEl.parentNode?.removeChild(subtitleEl);
        }
      }
      
      return dialog;
    },
    
    getSubtitle: () => settings.subtitle,
    
    setContent: (content: string) => {
      settings.content = content;
      
      const contentEl = element.querySelector('.mtrl-dialog-content');
      if (contentEl) {
        if (content.includes('<')) {
          contentEl.innerHTML = content;
        } else {
          contentEl.textContent = content;
        }
      }
      
      return dialog;
    },
    
    getContent: () => settings.content,
    
    addButton: (button: DialogButton) => {
      settings.buttons.push(button);
      
      const footerEl = element.querySelector('.mtrl-dialog-footer');
      if (footerEl) {
        const buttonElement = document.createElement('button');
        buttonElement.className = 'mtrl-button';
        
        if (button.variant) {
          buttonElement.classList.add(`mtrl-button--${button.variant}`);
        }
        
        if (button.color) {
          buttonElement.classList.add(`mtrl-button--${button.color}`);
        }
        
        if (button.size) {
          buttonElement.classList.add(`mtrl-button--${button.size}`);
        }
        
        buttonElement.textContent = button.text;
        
        if (button.attrs) {
          for (const [key, value] of Object.entries(button.attrs)) {
            buttonElement.setAttribute(key, value);
          }
        }
        
        if (button.autofocus) {
          buttonElement.setAttribute('autofocus', 'true');
        }
        
        buttonElement.addEventListener('click', (event) => {
          let shouldClose = button.closeDialog !== false;
          
          if (button.onClick) {
            const result = button.onClick(event, dialog);
            if (result === false) {
              shouldClose = false;
            }
          }
          
          if (shouldClose) {
            dialog.close();
          }
        });
        
        footerEl.appendChild(buttonElement);
      }
      
      return dialog;
    },
    
    removeButton: (indexOrText: number | string) => {
      const footerEl = element.querySelector('.mtrl-dialog-footer');
      if (footerEl) {
        if (typeof indexOrText === 'number') {
          if (indexOrText >= 0 && indexOrText < settings.buttons.length) {
            settings.buttons.splice(indexOrText, 1);
            const buttons = footerEl.querySelectorAll('.mtrl-button');
            if (indexOrText < buttons.length) {
              footerEl.removeChild(buttons[indexOrText]);
            }
          }
        } else {
          const buttonIndex = settings.buttons.findIndex(b => b.text === indexOrText);
          if (buttonIndex !== -1) {
            settings.buttons.splice(buttonIndex, 1);
            const buttons = footerEl.querySelectorAll('.mtrl-button');
            if (buttonIndex < buttons.length) {
              footerEl.removeChild(buttons[buttonIndex]);
            }
          }
        }
      }
      
      return dialog;
    },
    
    getButtons: () => [...settings.buttons],
    
    setFooterAlignment: (alignment: DialogFooterAlignment | string) => {
      settings.footerAlignment = alignment;
      
      const footerEl = element.querySelector('.mtrl-dialog-footer');
      if (footerEl) {
        footerEl.className = 'mtrl-dialog-footer';
        footerEl.classList.add(`mtrl-dialog-footer--${alignment}`);
      }
      
      return dialog;
    },
    
    setSize: (size: DialogSize | string) => {
      const prevSize = settings.size;
      settings.size = size;
      
      if (prevSize) {
        element.classList.remove(`mtrl-dialog--${prevSize}`);
      }
      
      element.classList.add(`mtrl-dialog--${size}`);
      
      return dialog;
    },
    
    on: (event: DialogEventType | string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      return dialog;
    },
    
    off: (event: DialogEventType | string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      
      return dialog;
    },
    
    getHeaderElement: () => element.querySelector('.mtrl-dialog-header'),
    
    getContentElement: () => element.querySelector('.mtrl-dialog-content'),
    
    getFooterElement: () => element.querySelector('.mtrl-dialog-footer'),
    
    toggleDivider: (show: boolean) => {
      settings.divider = show;
      
      let dividerEl = element.querySelector('.mtrl-dialog-divider');
      if (show && !dividerEl) {
        dividerEl = document.createElement('hr');
        dividerEl.className = 'mtrl-dialog-divider';
        
        const headerEl = element.querySelector('.mtrl-dialog-header');
        const contentEl = element.querySelector('.mtrl-dialog-content');
        
        if (headerEl && contentEl && headerEl.parentNode) {
          headerEl.parentNode.insertBefore(dividerEl, contentEl);
        }
      } else if (!show && dividerEl) {
        dividerEl.parentNode?.removeChild(dividerEl);
      }
      
      return dialog;
    },
    
    hasDivider: () => settings.divider,
    
    confirm: (options?: any) => {
      // Simple mock implementation of confirm
      return new Promise<boolean>(resolve => {
        const confirmTitle = options?.title || 'Confirm';
        const confirmMessage = options?.message || 'Are you sure?';
        const confirmText = options?.confirmText || 'Yes';
        const cancelText = options?.cancelText || 'No';
        
        // In real implementation this would create a new dialog
        // For testing purposes we just resolve immediately
        const willConfirm = true; // simulate confirmation
        resolve(willConfirm);
      });
    },
    
    destroy: () => {
      // Clean up event listeners
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Remove from the DOM
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Clear event handlers
      for (const event in eventHandlers) {
        eventHandlers[event] = [];
      }
    }
  };
  
  return dialog;
};

describe('Dialog Component', () => {
  test('should create a dialog element', () => {
    const dialog = createMockDialog();
    
    expect(dialog.element).toBeDefined();
    expect(dialog.element.tagName).toBe('DIV');
    expect(dialog.element.className).toContain('mtrl-dialog');
    
    expect(dialog.overlay).toBeDefined();
    expect(dialog.overlay.tagName).toBe('DIV');
    expect(dialog.overlay.className).toContain('mtrl-dialog-overlay');
  });
  
  test('should set title and subtitle', () => {
    const dialog = createMockDialog({
      title: 'Dialog Title',
      subtitle: 'Dialog Subtitle'
    });
    
    const titleElement = dialog.element.querySelector('.mtrl-dialog-title');
    expect(titleElement).toBeDefined();
    expect(titleElement?.textContent).toBe('Dialog Title');
    
    const subtitleElement = dialog.element.querySelector('.mtrl-dialog-subtitle');
    expect(subtitleElement).toBeDefined();
    expect(subtitleElement?.textContent).toBe('Dialog Subtitle');
    
    expect(dialog.getTitle()).toBe('Dialog Title');
    expect(dialog.getSubtitle()).toBe('Dialog Subtitle');
  });
  
  test('should set content', () => {
    const dialog = createMockDialog({
      content: 'Dialog content text'
    });
    
    const contentElement = dialog.element.querySelector('.mtrl-dialog-content');
    expect(contentElement).toBeDefined();
    expect(contentElement?.textContent).toBe('Dialog content text');
    
    expect(dialog.getContent()).toBe('Dialog content text');
  });
  
  test('should support HTML content', () => {
    const dialog = createMockDialog({
      content: '<p>Dialog <strong>HTML</strong> content</p>'
    });
    
    const contentElement = dialog.element.querySelector('.mtrl-dialog-content');
    expect(contentElement).toBeDefined();
    expect(contentElement?.innerHTML).toBe('<p>Dialog <strong>HTML</strong> content</p>');
    
    const strongElement = contentElement?.querySelector('strong');
    expect(strongElement).toBeDefined();
    expect(strongElement?.textContent).toBe('HTML');
  });
  
  test('should apply size variants', () => {
    const sizes: DialogSize[] = ['small', 'medium', 'large', 'fullwidth', 'fullscreen'];
    
    sizes.forEach(size => {
      const dialog = createMockDialog({ size });
      expect(dialog.element.className).toContain(`mtrl-dialog--${size}`);
    });
  });
  
  test('should apply animation variants', () => {
    const animations: DialogAnimation[] = ['scale', 'slide-up', 'slide-down', 'fade'];
    
    animations.forEach(animation => {
      const dialog = createMockDialog({ animation });
      expect(dialog.element.className).toContain(`mtrl-dialog--animation-${animation}`);
    });
  });
  
  test('should create close button by default', () => {
    const dialog = createMockDialog();
    
    const closeButton = dialog.element.querySelector('.mtrl-dialog-close');
    expect(closeButton).toBeDefined();
  });
  
  test('should hide close button when configured', () => {
    const dialog = createMockDialog({
      closeButton: false
    });
    
    const closeButton = dialog.element.querySelector('.mtrl-dialog-close');
    expect(closeButton).toBeNull();
  });
  
  test('should create buttons in footer', () => {
    const buttons: DialogButton[] = [
      { text: 'Cancel', variant: 'text' },
      { text: 'OK', variant: 'filled' }
    ];
    
    const dialog = createMockDialog({ buttons });
    
    const footerElement = dialog.element.querySelector('.mtrl-dialog-footer');
    expect(footerElement).toBeDefined();
    
    const buttonElements = dialog.element.querySelectorAll('.mtrl-button');
    expect(buttonElements.length).toBe(2);
    
    expect(buttonElements[0].textContent).toBe('Cancel');
    expect(buttonElements[0].className).toContain('mtrl-button--text');
    
    expect(buttonElements[1].textContent).toBe('OK');
    expect(buttonElements[1].className).toContain('mtrl-button--filled');
  });
  
  test('should initially be closed by default', () => {
    const dialog = createMockDialog();
    
    expect(dialog.isOpen()).toBe(false);
    expect(dialog.element.style.display).toBe('none');
    expect(dialog.overlay.style.display).toBe('none');
  });
  
  test('should initially be open when configured', () => {
    const dialog = createMockDialog({
      open: true
    });
    
    expect(dialog.isOpen()).toBe(true);
    expect(dialog.element.className).toContain('mtrl-dialog--open');
    expect(dialog.overlay.className).toContain('mtrl-dialog-overlay--open');
  });
  
  test('should open and close the dialog', () => {
    const dialog = createMockDialog();
    
    expect(dialog.isOpen()).toBe(false);
    
    dialog.open();
    
    expect(dialog.isOpen()).toBe(true);
    expect(dialog.element.style.display).toBe('block');
    expect(dialog.overlay.style.display).toBe('block');
    expect(dialog.element.className).toContain('mtrl-dialog--open');
    
    dialog.close();
    
    expect(dialog.isOpen()).toBe(false);
    expect(dialog.element.className).not.toContain('mtrl-dialog--open');
  });
  
  test('should toggle the dialog', () => {
    const dialog = createMockDialog();
    
    expect(dialog.isOpen()).toBe(false);
    
    dialog.toggle();
    expect(dialog.isOpen()).toBe(true);
    
    dialog.toggle();
    expect(dialog.isOpen()).toBe(false);
    
    dialog.toggle(true);
    expect(dialog.isOpen()).toBe(true);
    
    dialog.toggle(true); // Should remain open
    expect(dialog.isOpen()).toBe(true);
    
    dialog.toggle(false);
    expect(dialog.isOpen()).toBe(false);
  });
  
  test('should update title dynamically', () => {
    const dialog = createMockDialog({
      title: 'Initial Title'
    });
    
    const titleElement = dialog.element.querySelector('.mtrl-dialog-title');
    expect(titleElement?.textContent).toBe('Initial Title');
    
    dialog.setTitle('Updated Title');
    
    expect(titleElement?.textContent).toBe('Updated Title');
    expect(dialog.getTitle()).toBe('Updated Title');
  });
  
  test('should update subtitle dynamically', () => {
    const dialog = createMockDialog({
      subtitle: 'Initial Subtitle'
    });
    
    const subtitleElement = dialog.element.querySelector('.mtrl-dialog-subtitle');
    expect(subtitleElement?.textContent).toBe('Initial Subtitle');
    
    dialog.setSubtitle('Updated Subtitle');
    
    expect(subtitleElement?.textContent).toBe('Updated Subtitle');
    expect(dialog.getSubtitle()).toBe('Updated Subtitle');
  });
  
  test('should update content dynamically', () => {
    const dialog = createMockDialog({
      content: 'Initial content'
    });
    
    const contentElement = dialog.element.querySelector('.mtrl-dialog-content');
    expect(contentElement?.textContent).toBe('Initial content');
    
    dialog.setContent('Updated content');
    
    expect(contentElement?.textContent).toBe('Updated content');
    expect(dialog.getContent()).toBe('Updated content');
  });
  
  test('should add buttons dynamically', () => {
    const dialog = createMockDialog();
    
    const footerElement = dialog.element.querySelector('.mtrl-dialog-footer');
    expect(footerElement?.children.length).toBe(0);
    
    dialog.addButton({ text: 'New Button', variant: 'text' });
    
    expect(footerElement?.children.length).toBe(1);
    expect(footerElement?.children[0].textContent).toBe('New Button');
    expect(dialog.getButtons().length).toBe(1);
  });
  
  test('should remove buttons by index', () => {
    const dialog = createMockDialog({
      buttons: [
        { text: 'Button 1' },
        { text: 'Button 2' },
        { text: 'Button 3' }
      ]
    });
    
    const footerElement = dialog.element.querySelector('.mtrl-dialog-footer');
    expect(footerElement?.children.length).toBe(3);
    
    dialog.removeButton(1);
    
    expect(footerElement?.children.length).toBe(2);
    expect(footerElement?.children[0].textContent).toBe('Button 1');
    expect(footerElement?.children[1].textContent).toBe('Button 3');
    expect(dialog.getButtons().length).toBe(2);
  });
  
  test('should remove buttons by text', () => {
    const dialog = createMockDialog({
      buttons: [
        { text: 'Button 1' },
        { text: 'Button 2' },
        { text: 'Button 3' }
      ]
    });
    
    const footerElement = dialog.element.querySelector('.mtrl-dialog-footer');
    expect(footerElement?.children.length).toBe(3);
    
    dialog.removeButton('Button 2');
    
    expect(footerElement?.children.length).toBe(2);
    expect(footerElement?.children[0].textContent).toBe('Button 1');
    expect(footerElement?.children[1].textContent).toBe('Button 3');
    expect(dialog.getButtons().length).toBe(2);
  });
  
  test('should change footer alignment', () => {
    const dialog = createMockDialog({
      footerAlignment: 'right'
    });
    
    const footerElement = dialog.element.querySelector('.mtrl-dialog-footer');
    expect(footerElement?.className).toContain('mtrl-dialog-footer--right');
    
    dialog.setFooterAlignment('center');
    
    expect(footerElement?.className).toContain('mtrl-dialog-footer--center');
    expect(footerElement?.className).not.toContain('mtrl-dialog-footer--right');
  });
  
  test('should change dialog size', () => {
    const dialog = createMockDialog({
      size: 'medium'
    });
    
    expect(dialog.element.className).toContain('mtrl-dialog--medium');
    
    dialog.setSize('large');
    
    expect(dialog.element.className).toContain('mtrl-dialog--large');
    expect(dialog.element.className).not.toContain('mtrl-dialog--medium');
  });
  
  test('should add and remove event listeners', () => {
    const dialog = createMockDialog();
    let eventCount = 0;
    
    const handler = () => {
      eventCount++;
    };
    
    dialog.on('open', handler);
    
    dialog.open();
    expect(eventCount).toBe(1);
    
    dialog.close();
    dialog.open();
    expect(eventCount).toBe(2);
    
    dialog.off('open', handler);
    
    dialog.close();
    dialog.open();
    expect(eventCount).toBe(2); // Should not increment
  });
  
  test('should get dialog elements', () => {
    const dialog = createMockDialog();
    
    const headerElement = dialog.getHeaderElement();
    expect(headerElement).toBeDefined();
    expect(headerElement?.className).toBe('mtrl-dialog-header');
    
    const contentElement = dialog.getContentElement();
    expect(contentElement).toBeDefined();
    expect(contentElement?.className).toBe('mtrl-dialog-content');
    
    const footerElement = dialog.getFooterElement();
    expect(footerElement).toBeDefined();
    expect(footerElement?.className).toContain('mtrl-dialog-footer');
  });
  
  test('should toggle divider', () => {
    const dialog = createMockDialog();
    
    expect(dialog.hasDivider()).toBe(false);
    expect(dialog.element.querySelector('.mtrl-dialog-divider')).toBeNull();
    
    dialog.toggleDivider(true);
    
    expect(dialog.hasDivider()).toBe(true);
    expect(dialog.element.querySelector('.mtrl-dialog-divider')).toBeDefined();
    
    dialog.toggleDivider(false);
    
    expect(dialog.hasDivider()).toBe(false);
    expect(dialog.element.querySelector('.mtrl-dialog-divider')).toBeNull();
  });
  
  test('should create with divider when configured', () => {
    const dialog = createMockDialog({
      divider: true
    });
    
    expect(dialog.hasDivider()).toBe(true);
    expect(dialog.element.querySelector('.mtrl-dialog-divider')).toBeDefined();
  });
  
  test('should handle confirm method', async () => {
    const dialog = createMockDialog();
    
    const result = await dialog.confirm({
      title: 'Confirm Title',
      message: 'Confirm Message',
      confirmText: 'Yes',
      cancelText: 'No'
    });
    
    expect(result).toBe(true);
  });
  
  test('should be properly destroyed', () => {
    const dialog = createMockDialog();
    document.body.appendChild(dialog.element);
    document.body.appendChild(dialog.overlay);
    
    expect(document.body.contains(dialog.element)).toBe(true);
    expect(document.body.contains(dialog.overlay)).toBe(true);
    
    dialog.destroy();
    
    expect(document.body.contains(dialog.element)).toBe(false);
    expect(document.body.contains(dialog.overlay)).toBe(false);
  });
});