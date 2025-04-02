// test/components/sheet.test.ts
import { describe, test, expect } from 'bun:test';
import { 
  type SheetComponent,
  type SheetConfig
} from '../../src/components/sheet/types';

// Constants for sheet variants
const SHEET_VARIANTS = {
  STANDARD: 'standard',
  MODAL: 'modal',
  EXPANDED: 'expanded'
};

// Constants for sheet positions
const SHEET_POSITIONS = {
  BOTTOM: 'bottom',
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right'
};

// Constants for sheet events
const SHEET_EVENTS = {
  OPEN: 'open',
  CLOSE: 'close',
  DRAG_START: 'dragstart',
  DRAG_END: 'dragend'
};

// Mock sheet implementation
const createMockSheet = (config: SheetConfig = {}): SheetComponent => {
  // Create main elements
  const element = document.createElement('div');
  element.className = 'mtrl-sheet';
  
  const scrim = document.createElement('div');
  scrim.className = 'mtrl-sheet__scrim';
  
  const container = document.createElement('div');
  container.className = 'mtrl-sheet__container';
  
  // Default settings
  const settings = {
    variant: config.variant || SHEET_VARIANTS.STANDARD,
    position: config.position || SHEET_POSITIONS.BOTTOM,
    open: config.open || false,
    dismissible: config.dismissible !== undefined ? config.dismissible : true,
    dragHandle: config.dragHandle !== undefined ? config.dragHandle : true,
    content: config.content || '',
    title: config.title || '',
    prefix: config.prefix || 'mtrl',
    componentName: config.componentName || 'sheet',
    elevation: config.elevation || 3,
    maxHeight: config.maxHeight || '80%',
    enableGestures: config.enableGestures !== undefined ? config.enableGestures : true
  };
  
  // Apply variant class
  element.classList.add(`mtrl-sheet--${settings.variant}`);
  
  // Apply position class
  element.classList.add(`mtrl-sheet--${settings.position}`);
  
  // Apply elevation class
  element.classList.add(`mtrl-sheet--elevation-${settings.elevation}`);
  
  // Apply open state
  if (settings.open) {
    element.classList.add('mtrl-sheet--open');
  }
  
  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  // Create drag handle if enabled
  let dragHandleElement: HTMLElement | null = null;
  if (settings.dragHandle) {
    dragHandleElement = document.createElement('div');
    dragHandleElement.className = 'mtrl-sheet__handle';
    container.appendChild(dragHandleElement);
  }
  
  // Create title if provided
  let titleElement: HTMLElement | null = null;
  if (settings.title) {
    titleElement = document.createElement('div');
    titleElement.className = 'mtrl-sheet__title';
    titleElement.textContent = settings.title;
    container.appendChild(titleElement);
  }
  
  // Create content element
  const contentElement = document.createElement('div');
  contentElement.className = 'mtrl-sheet__content';
  
  if (settings.content) {
    contentElement.innerHTML = settings.content;
  }
  
  container.appendChild(contentElement);
  
  // Add max height to container
  if (settings.maxHeight) {
    container.style.maxHeight = settings.maxHeight;
  }
  
  // Assemble the sheet
  element.appendChild(scrim);
  element.appendChild(container);
  
  // Track event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Emit an event
  const emit = (event: string) => {
    const handlers = eventHandlers[event];
    if (handlers) {
      handlers.forEach(handler => handler());
    }
    
    // Direct callbacks
    if (event === SHEET_EVENTS.OPEN && config.onOpen) {
      config.onOpen();
    } else if (event === SHEET_EVENTS.CLOSE && config.onClose) {
      config.onClose();
    }
  };
  
  // Set up event handlers
  scrim.addEventListener('click', () => {
    if (settings.dismissible) {
      sheet.close();
    }
  });
  
  // Content API
  const contentAPI = {
    setContent: (html: string) => {
      contentElement.innerHTML = html;
      settings.content = html;
      return contentAPI;
    },
    
    getContent: () => settings.content,
    
    getElement: () => contentElement
  };
  
  // Title API
  const titleAPI = {
    setTitle: (text: string) => {
      settings.title = text;
      
      if (text) {
        if (!titleElement) {
          titleElement = document.createElement('div');
          titleElement.className = 'mtrl-sheet__title';
          if (dragHandleElement) {
            container.insertBefore(titleElement, dragHandleElement.nextSibling);
          } else {
            container.insertBefore(titleElement, container.firstChild);
          }
        }
        
        titleElement.textContent = text;
      } else if (titleElement) {
        titleElement.remove();
        titleElement = null;
      }
      
      return titleAPI;
    },
    
    getTitle: () => settings.title,
    
    getElement: () => titleElement
  };
  
  // Create the sheet component
  const sheet: SheetComponent = {
    element,
    container,
    content: contentAPI,
    title: titleAPI,
    
    state: {
      open: () => {
        if (!settings.open) {
          element.classList.add('mtrl-sheet--open');
          settings.open = true;
          emit(SHEET_EVENTS.OPEN);
        }
      },
      
      close: () => {
        if (settings.open) {
          element.classList.remove('mtrl-sheet--open');
          settings.open = false;
          emit(SHEET_EVENTS.CLOSE);
        }
      },
      
      isOpen: () => settings.open
    },
    
    lifecycle: {
      destroy: () => {
        sheet.destroy();
      }
    },
    
    getClass: (name: string) => {
      const prefix = settings.prefix;
      return name ? `${prefix}-${name}` : `${prefix}-sheet`;
    },
    
    open: () => {
      sheet.state.open();
      return sheet;
    },
    
    close: () => {
      sheet.state.close();
      return sheet;
    },
    
    setContent: (html: string) => {
      contentAPI.setContent(html);
      return sheet;
    },
    
    getContent: () => contentAPI.getContent(),
    
    setTitle: (text: string) => {
      titleAPI.setTitle(text);
      return sheet;
    },
    
    getTitle: () => titleAPI.getTitle(),
    
    setDragHandle: (enabled: boolean) => {
      if (enabled && !dragHandleElement) {
        // Create drag handle
        dragHandleElement = document.createElement('div');
        dragHandleElement.className = 'mtrl-sheet__handle';
        container.insertBefore(dragHandleElement, container.firstChild);
      } else if (!enabled && dragHandleElement) {
        // Remove drag handle
        dragHandleElement.remove();
        dragHandleElement = null;
      }
      
      settings.dragHandle = enabled;
      return sheet;
    },
    
    setMaxHeight: (height: string) => {
      settings.maxHeight = height;
      container.style.maxHeight = height;
      return sheet;
    },
    
    destroy: () => {
      // Remove element from DOM if it has a parent
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Clear event handlers
      for (const event in eventHandlers) {
        eventHandlers[event] = [];
      }
    },
    
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      return sheet;
    },
    
    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      
      return sheet;
    },
    
    addClass: (...classes: string[]) => {
      classes.forEach(className => element.classList.add(className));
      return sheet;
    }
  };
  
  return sheet;
};

describe('Sheet Component', () => {
  test('should create a sheet element', () => {
    const sheet = createMockSheet();
    
    expect(sheet.element).toBeDefined();
    expect(sheet.element.tagName).toBe('DIV');
    expect(sheet.element.className).toContain('mtrl-sheet');
    
    expect(sheet.container).toBeDefined();
    expect(sheet.container.className).toContain('mtrl-sheet__container');
    
    const scrim = sheet.element.querySelector('.mtrl-sheet__scrim');
    expect(scrim).toBeDefined();
  });
  
  test('should apply standard variant by default', () => {
    const sheet = createMockSheet();
    expect(sheet.element.className).toContain('mtrl-sheet--standard');
  });
  
  test('should apply different variants', () => {
    const variants = Object.values(SHEET_VARIANTS);
    
    variants.forEach(variant => {
      const sheet = createMockSheet({ variant });
      expect(sheet.element.className).toContain(`mtrl-sheet--${variant}`);
    });
  });
  
  test('should apply bottom position by default', () => {
    const sheet = createMockSheet();
    expect(sheet.element.className).toContain('mtrl-sheet--bottom');
  });
  
  test('should apply different positions', () => {
    const positions = Object.values(SHEET_POSITIONS);
    
    positions.forEach(position => {
      const sheet = createMockSheet({ position });
      expect(sheet.element.className).toContain(`mtrl-sheet--${position}`);
    });
  });
  
  test('should apply elevation level', () => {
    const sheet = createMockSheet({ elevation: 4 });
    expect(sheet.element.className).toContain('mtrl-sheet--elevation-4');
  });
  
  test('should be closed by default', () => {
    const sheet = createMockSheet();
    expect(sheet.element.className).not.toContain('mtrl-sheet--open');
    expect(sheet.state.isOpen()).toBe(false);
  });
  
  test('should be initially open when configured', () => {
    const sheet = createMockSheet({ open: true });
    expect(sheet.element.className).toContain('mtrl-sheet--open');
    expect(sheet.state.isOpen()).toBe(true);
  });
  
  test('should create drag handle by default', () => {
    const sheet = createMockSheet();
    
    const handle = sheet.element.querySelector('.mtrl-sheet__handle');
    expect(handle).toBeDefined();
  });
  
  test('should not create drag handle when disabled', () => {
    const sheet = createMockSheet({ dragHandle: false });
    
    const handle = sheet.element.querySelector('.mtrl-sheet__handle');
    expect(handle).toBeNull();
  });
  
  test('should set initial content', () => {
    const content = '<p>Sheet content</p>';
    const sheet = createMockSheet({ content });
    
    const contentElement = sheet.element.querySelector('.mtrl-sheet__content');
    expect(contentElement).toBeDefined();
    expect(contentElement?.innerHTML).toBe(content);
    
    expect(sheet.getContent()).toBe(content);
  });
  
  test('should set initial title', () => {
    const title = 'Sheet Title';
    const sheet = createMockSheet({ title });
    
    const titleElement = sheet.element.querySelector('.mtrl-sheet__title');
    expect(titleElement).toBeDefined();
    expect(titleElement?.textContent).toBe(title);
    
    expect(sheet.getTitle()).toBe(title);
  });
  
  test('should apply max height', () => {
    const maxHeight = '50%';
    const sheet = createMockSheet({ maxHeight });
    
    expect(sheet.container.style.maxHeight).toBe(maxHeight);
  });
  
  test('should open and close', () => {
    const sheet = createMockSheet();
    
    expect(sheet.state.isOpen()).toBe(false);
    
    sheet.open();
    
    expect(sheet.state.isOpen()).toBe(true);
    expect(sheet.element.className).toContain('mtrl-sheet--open');
    
    sheet.close();
    
    expect(sheet.state.isOpen()).toBe(false);
    expect(sheet.element.className).not.toContain('mtrl-sheet--open');
  });
  
  test('should update content', () => {
    const sheet = createMockSheet();
    
    const initialContent = sheet.element.querySelector('.mtrl-sheet__content');
    expect(initialContent?.innerHTML).toBe('');
    
    const newContent = '<div>New content</div>';
    sheet.setContent(newContent);
    
    expect(sheet.getContent()).toBe(newContent);
    expect(initialContent?.innerHTML).toBe(newContent);
  });
  
  test('should add title dynamically', () => {
    const sheet = createMockSheet();
    
    let titleElement = sheet.element.querySelector('.mtrl-sheet__title');
    expect(titleElement).toBeNull();
    
    sheet.setTitle('New Title');
    
    titleElement = sheet.element.querySelector('.mtrl-sheet__title');
    expect(titleElement).toBeDefined();
    expect(titleElement?.textContent).toBe('New Title');
    expect(sheet.getTitle()).toBe('New Title');
  });
  
  test('should remove title when setting empty string', () => {
    const sheet = createMockSheet({ title: 'Initial Title' });
    
    let titleElement = sheet.element.querySelector('.mtrl-sheet__title');
    expect(titleElement).toBeDefined();
    
    sheet.setTitle('');
    
    titleElement = sheet.element.querySelector('.mtrl-sheet__title');
    expect(titleElement).toBeNull();
    expect(sheet.getTitle()).toBe('');
  });
  
  test('should add and remove drag handle', () => {
    const sheet = createMockSheet({ dragHandle: false });
    
    let handleElement = sheet.element.querySelector('.mtrl-sheet__handle');
    expect(handleElement).toBeNull();
    
    sheet.setDragHandle(true);
    
    handleElement = sheet.element.querySelector('.mtrl-sheet__handle');
    expect(handleElement).toBeDefined();
    
    sheet.setDragHandle(false);
    
    handleElement = sheet.element.querySelector('.mtrl-sheet__handle');
    expect(handleElement).toBeNull();
  });
  
  test('should update max height', () => {
    const sheet = createMockSheet({ maxHeight: '80%' });
    
    expect(sheet.container.style.maxHeight).toBe('80%');
    
    sheet.setMaxHeight('40%');
    
    expect(sheet.container.style.maxHeight).toBe('40%');
  });
  
  test('should close when clicking scrim if dismissible', () => {
    const sheet = createMockSheet({ 
      open: true,
      dismissible: true 
    });
    
    expect(sheet.state.isOpen()).toBe(true);
    
    const scrim = sheet.element.querySelector('.mtrl-sheet__scrim');
    scrim?.dispatchEvent(new Event('click'));
    
    expect(sheet.state.isOpen()).toBe(false);
  });
  
  test('should not close when clicking scrim if not dismissible', () => {
    const sheet = createMockSheet({ 
      open: true,
      dismissible: false 
    });
    
    expect(sheet.state.isOpen()).toBe(true);
    
    const scrim = sheet.element.querySelector('.mtrl-sheet__scrim');
    scrim?.dispatchEvent(new Event('click'));
    
    expect(sheet.state.isOpen()).toBe(true);
  });
  
  test('should emit open events', () => {
    const sheet = createMockSheet();
    
    let eventFired = false;
    sheet.on(SHEET_EVENTS.OPEN, () => {
      eventFired = true;
    });
    
    sheet.open();
    
    expect(eventFired).toBe(true);
  });
  
  test('should emit close events', () => {
    const sheet = createMockSheet({ open: true });
    
    let eventFired = false;
    sheet.on(SHEET_EVENTS.CLOSE, () => {
      eventFired = true;
    });
    
    sheet.close();
    
    expect(eventFired).toBe(true);
  });
  
  test('should call onOpen callback', () => {
    let callbackFired = false;
    
    const sheet = createMockSheet({
      onOpen: () => {
        callbackFired = true;
      }
    });
    
    sheet.open();
    
    expect(callbackFired).toBe(true);
  });
  
  test('should call onClose callback', () => {
    let callbackFired = false;
    
    const sheet = createMockSheet({
      open: true,
      onClose: () => {
        callbackFired = true;
      }
    });
    
    sheet.close();
    
    expect(callbackFired).toBe(true);
  });
  
  test('should not emit events when state does not change', () => {
    const sheet = createMockSheet({ open: true });
    
    let eventCount = 0;
    sheet.on(SHEET_EVENTS.OPEN, () => {
      eventCount++;
    });
    
    // Open when already open
    sheet.open();
    
    expect(eventCount).toBe(0);
    
    // Similarly for close
    const closedSheet = createMockSheet({ open: false });
    
    let closeEventCount = 0;
    closedSheet.on(SHEET_EVENTS.CLOSE, () => {
      closeEventCount++;
    });
    
    // Close when already closed
    closedSheet.close();
    
    expect(closeEventCount).toBe(0);
  });
  
  test('should add CSS classes', () => {
    const sheet = createMockSheet();
    
    sheet.addClass('custom-class', 'special-sheet');
    
    expect(sheet.element.className).toContain('custom-class');
    expect(sheet.element.className).toContain('special-sheet');
  });
  
  test('should remove event listeners', () => {
    const sheet = createMockSheet();
    
    let eventCount = 0;
    
    const handler = () => {
      eventCount++;
    };
    
    sheet.on(SHEET_EVENTS.OPEN, handler);
    
    sheet.open();
    expect(eventCount).toBe(1);
    
    sheet.off(SHEET_EVENTS.OPEN, handler);
    
    sheet.close();
    sheet.open();
    expect(eventCount).toBe(1); // Count should not increase
  });
  
  test('should be properly destroyed', () => {
    const sheet = createMockSheet();
    document.body.appendChild(sheet.element);
    
    expect(document.body.contains(sheet.element)).toBe(true);
    
    sheet.destroy();
    
    expect(document.body.contains(sheet.element)).toBe(false);
  });
});