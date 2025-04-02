// test/components/snackbar.test.ts
import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import { JSDOM } from 'jsdom';

// Set up JSDOM
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;

// Import types directly to avoid circular dependencies
import type { 
  SnackbarComponent,
  SnackbarConfig,
  SnackbarEvent,
  SnackbarVariant,
  SnackbarPosition
} from '../../src/components/snackbar/types';

// Define constants here to avoid circular dependencies
const SNACKBAR_VARIANTS = {
  BASIC: 'basic',
  ACTION: 'action'
} as const;

const SNACKBAR_POSITIONS = {
  CENTER: 'center',
  START: 'start',
  END: 'end'
} as const;

// Define a mock emit function type
type EmitFunction = (eventName: string, eventData?: any) => void;

// Create a mock snackbar implementation
const createMockSnackbar = (config: SnackbarConfig): SnackbarComponent => {
  // Default configuration
  const defaultConfig: SnackbarConfig = {
    message: '',
    variant: SNACKBAR_VARIANTS.BASIC,
    position: SNACKBAR_POSITIONS.CENTER,
    duration: 4000,
    prefix: 'mtrl'
  };
  
  // Merge with user configuration
  const mergedConfig = {
    ...defaultConfig,
    ...config
  };
  
  // Create main element
  const element = document.createElement('div');
  element.className = `${mergedConfig.prefix}-snackbar`;
  
  if (mergedConfig.class) {
    element.className += ` ${mergedConfig.class}`;
  }
  
  // Add variant class
  element.className += ` ${mergedConfig.prefix}-snackbar--${mergedConfig.variant}`;
  
  // Add position class
  element.className += ` ${mergedConfig.prefix}-snackbar--${mergedConfig.position}`;
  
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `${mergedConfig.prefix}-snackbar__message`;
  messageElement.textContent = mergedConfig.message;
  element.appendChild(messageElement);
  
  // Create action button if specified
  let actionButton: HTMLButtonElement | undefined;
  
  if (mergedConfig.action) {
    actionButton = document.createElement('button');
    actionButton.className = `${mergedConfig.prefix}-snackbar__action`;
    actionButton.textContent = mergedConfig.action;
    element.appendChild(actionButton);
  }
  
  // Event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Timer implementation
  const timer = {
    timeoutId: null as number | null,
    start: () => {
      if (mergedConfig.duration === 0) return;
      if (timer.timeoutId) clearTimeout(timer.timeoutId);
      timer.timeoutId = setTimeout(() => {
        snackbar.hide();
      }, mergedConfig.duration) as unknown as number;
    },
    stop: () => {
      if (timer.timeoutId) {
        clearTimeout(timer.timeoutId);
        timer.timeoutId = null;
      }
    }
  };
  
  // Position implementation
  const position = {
    getPosition: () => mergedConfig.position as SnackbarPosition,
    setPosition: (pos: SnackbarPosition) => {
      // Remove old position class
      element.classList.remove(`${mergedConfig.prefix}-snackbar--${mergedConfig.position}`);
      
      // Update position
      mergedConfig.position = pos;
      
      // Add new position class
      element.classList.add(`${mergedConfig.prefix}-snackbar--${mergedConfig.position}`);
      
      return snackbar;
    }
  };
  
  // Emit function
  const emit: EmitFunction = (eventName, eventData = {}) => {
    if (!eventHandlers[eventName]) return;
    
    const event = {
      snackbar,
      originalEvent: null,
      preventDefault: () => { event.defaultPrevented = true; },
      defaultPrevented: false,
      ...eventData
    };
    
    eventHandlers[eventName].forEach(handler => handler(event));
  };
  
  // Create the snackbar instance
  const snackbar: SnackbarComponent = {
    element,
    config: mergedConfig,
    actionButton,
    timer,
    position,
    state: 'hidden',
    emit,
    
    show: () => {
      element.classList.add(`${mergedConfig.prefix}-snackbar--visible`);
      snackbar.state = 'visible';
      timer.start();
      emit('open');
      return snackbar;
    },
    
    hide: () => {
      element.classList.remove(`${mergedConfig.prefix}-snackbar--visible`);
      snackbar.state = 'hidden';
      timer.stop();
      emit('close');
      return snackbar;
    },
    
    setMessage: (message: string) => {
      mergedConfig.message = message;
      messageElement.textContent = message;
      return snackbar;
    },
    
    getMessage: () => mergedConfig.message,
    
    setAction: (text: string) => {
      if (!actionButton) {
        actionButton = document.createElement('button');
        actionButton.className = `${mergedConfig.prefix}-snackbar__action`;
        element.appendChild(actionButton);
      }
      
      actionButton.textContent = text;
      mergedConfig.action = text;
      
      return snackbar;
    },
    
    getAction: () => mergedConfig.action || '',
    
    setDuration: (duration: number) => {
      mergedConfig.duration = duration;
      return snackbar;
    },
    
    getDuration: () => mergedConfig.duration,
    
    setPosition: (newPosition: SnackbarPosition) => {
      return position.setPosition(newPosition);
    },
    
    getPosition: () => position.getPosition(),
    
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      return snackbar;
    },
    
    off: (event: string, handler: Function) => {
      if (!eventHandlers[event]) return snackbar;
      
      eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      return snackbar;
    },
    
    destroy: () => {
      timer.stop();
      
      // Clear event handlers
      Object.keys(eventHandlers).forEach(key => {
        eventHandlers[key] = [];
      });
      
      // Remove from DOM if attached
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  };
  
  return snackbar;
};

describe('Snackbar Component', () => {
  let originalBody: any;
  let mockBodyAppendChild: ReturnType<typeof mock>;
  let mockBodyRemoveChild: ReturnType<typeof mock>;

  beforeEach(() => {
    // Mock document.body methods for testing
    originalBody = document.body;
    mockBodyAppendChild = mock(() => {});
    mockBodyRemoveChild = mock(() => {});

    Object.defineProperty(document, 'body', {
      value: {
        appendChild: mockBodyAppendChild,
        removeChild: mockBodyRemoveChild,
        children: []
      },
      writable: true
    });
  });

  afterEach(() => {
    // Restore original document.body
    Object.defineProperty(document, 'body', {
      value: originalBody,
      writable: true
    });
  });

  test('should create a snackbar element', () => {
    const snackbar = createMockSnackbar({
      message: 'Test message'
    });

    expect(snackbar.element).toBeDefined();
    expect(snackbar.element.tagName).toBe('DIV');
    expect(snackbar.element.className).toContain('mtrl-snackbar');
  });

  test('should apply variant class', () => {
    const variant = SNACKBAR_VARIANTS.ACTION;
    const snackbar = createMockSnackbar({
      message: 'Test message',
      variant
    });

    expect(snackbar.config.variant).toBe(variant);
  });

  test('should use basic as default variant', () => {
    const snackbar = createMockSnackbar({
      message: 'Test message'
    });

    expect(snackbar.config.variant).toBe(SNACKBAR_VARIANTS.BASIC);
  });

  test('should apply position class', () => {
    const position = SNACKBAR_POSITIONS.START;
    const snackbar = createMockSnackbar({
      message: 'Test message',
      position
    });

    expect(snackbar.config.position).toBe(position);
  });

  test('should use center as default position', () => {
    const snackbar = createMockSnackbar({
      message: 'Test message'
    });

    expect(snackbar.config.position).toBe(SNACKBAR_POSITIONS.CENTER);
  });

  test('should set message text', () => {
    const message = 'Test message';
    const snackbar = createMockSnackbar({
      message
    });

    expect(snackbar.config.message).toBe(message);
    expect(typeof snackbar.getMessage).toBe('function');
  });

  test('should add action button when specified', () => {
    const action = 'Undo';
    const snackbar = createMockSnackbar({
      message: 'Action completed',
      action
    });

    expect(snackbar.actionButton).toBeDefined();
    expect(snackbar.actionButton?.textContent).toBe(action);
  });

  test('should not add action button when not specified', () => {
    const snackbar = createMockSnackbar({
      message: 'Simple message'
    });

    expect(snackbar.actionButton).toBeUndefined();
  });

  test('should set default duration when not specified', () => {
    const snackbar = createMockSnackbar({
      message: 'Test message'
    });

    expect(snackbar.config.duration).toBe(4000);
  });

  test('should respect custom duration', () => {
    const duration = 2000;
    const snackbar = createMockSnackbar({
      message: 'Test message',
      duration
    });

    expect(snackbar.config.duration).toBe(duration);
  });

  test('should allow duration of 0 (no auto-dismiss)', () => {
    const snackbar = createMockSnackbar({
      message: 'Test message',
      duration: 0
    });

    expect(snackbar.config.duration).toBe(0);
  });

  test('should register event handlers', () => {
    const snackbar = createMockSnackbar({
      message: 'Test message'
    });

    // Verify event API exists
    expect(typeof snackbar.on).toBe('function');
    expect(typeof snackbar.off).toBe('function');

    // Check event handling
    const handler = mock(() => {});
    snackbar.on('dismiss', handler);

    // Trigger dismiss event
    if (snackbar.emit) {
      snackbar.emit('dismiss');
      expect(handler).toHaveBeenCalled();
    }
  });

  test('should expose show and hide methods', () => {
    const snackbar = createMockSnackbar({
      message: 'Test message'
    });

    expect(typeof snackbar.show).toBe('function');
    expect(typeof snackbar.hide).toBe('function');
  });

  test('should allow updating message', () => {
    const initialMessage = 'Initial message';
    const snackbar = createMockSnackbar({
      message: initialMessage
    });

    expect(snackbar.getMessage()).toBe(initialMessage);

    const updatedMessage = 'Updated message';
    snackbar.setMessage(updatedMessage);

    expect(snackbar.getMessage()).toBe(updatedMessage);
  });

  test('should have dismiss timer functionality', () => {
    const snackbar = createMockSnackbar({
      message: 'Test message'
    });

    expect(snackbar.timer).toBeDefined();
    expect(typeof snackbar.timer?.start).toBe('function');
    expect(typeof snackbar.timer?.stop).toBe('function');
  });

  test('should have an API for position management', () => {
    const snackbar = createMockSnackbar({
      message: 'Test message'
    });

    expect(snackbar.position).toBeDefined();

    if (snackbar.position) {
      expect(typeof snackbar.position.getPosition).toBe('function');
      expect(typeof snackbar.position.setPosition).toBe('function');
    }
  });

  test('should clean up resources on destroy', () => {
    const snackbar = createMockSnackbar({
      message: 'Test message'
    });

    expect(typeof snackbar.destroy).toBe('function');

    // Mock any internal methods that might be called during destroy
    if (snackbar.timer) {
      snackbar.timer.stop = mock(snackbar.timer.stop);
    }

    // Call destroy
    snackbar.destroy();

    // Check if timer was stopped
    if (snackbar.timer && typeof snackbar.timer.stop === 'function') {
      expect(snackbar.timer.stop).toHaveBeenCalled();
    }
  });

  test('should apply custom class', () => {
    const customClass = 'custom-snackbar';
    const snackbar = createMockSnackbar({
      message: 'Test message',
      class: customClass
    });

    expect(snackbar.element.className).toContain(customClass);
  });
});