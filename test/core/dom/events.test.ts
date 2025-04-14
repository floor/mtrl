// test/core/dom.events.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { createEventManager } from '../../../src/core/dom/events';

// Setup jsdom environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;
let originalConsoleError: any;
let originalConsoleWarn: any;

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
  originalConsoleError = console.error;
  originalConsoleWarn = console.warn;
  
  // Set globals to use jsdom
  global.document = document;
  global.window = window;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.Event = window.Event;
  
  // Mock console methods
  console.error = mock(() => {});
  console.warn = mock(() => {});
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clean up jsdom
  window.close();
});

describe('DOM Events Manager', () => {
  test('should create an event manager', () => {
    const element = document.createElement('div');
    const manager = createEventManager(element);
    
    expect(manager).toBeDefined();
    expect(typeof manager.on).toBe('function');
    expect(typeof manager.off).toBe('function');
    expect(typeof manager.pause).toBe('function');
    expect(typeof manager.resume).toBe('function');
    expect(typeof manager.destroy).toBe('function');
    expect(typeof manager.getHandlers).toBe('function');
    expect(typeof manager.hasHandler).toBe('function');
  });
  
  test('should add event listener', () => {
    const element = document.createElement('div');
    const manager = createEventManager(element);
    const handler = mock(() => {});
    
    manager.on('click', handler);
    
    // Trigger the event
    element.dispatchEvent(new Event('click'));
    
    expect(handler).toHaveBeenCalledTimes(1);
    expect(manager.hasHandler('click', handler)).toBe(true);
  });
  
  test('should remove event listener', () => {
    const element = document.createElement('div');
    const manager = createEventManager(element);
    const handler = mock(() => {});
    
    manager.on('click', handler);
    manager.off('click', handler);
    
    // Trigger the event
    element.dispatchEvent(new Event('click'));
    
    expect(handler).toHaveBeenCalledTimes(0);
    expect(manager.hasHandler('click', handler)).toBe(false);
  });
  
  test('should handle multiple event listeners', () => {
    const element = document.createElement('div');
    const manager = createEventManager(element);
    const clickHandler = mock(() => {});
    const mouseoverHandler = mock(() => {});
    
    manager.on('click', clickHandler);
    manager.on('mouseover', mouseoverHandler);
    
    // Trigger events
    element.dispatchEvent(new Event('click'));
    element.dispatchEvent(new Event('mouseover'));
    
    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(mouseoverHandler).toHaveBeenCalledTimes(1);
    expect(manager.hasHandler('click', clickHandler)).toBe(true);
    expect(manager.hasHandler('mouseover', mouseoverHandler)).toBe(true);
  });
  
  test('should pause and resume all event listeners', () => {
    const element = document.createElement('div');
    const manager = createEventManager(element);
    const handler = mock(() => {});
    
    manager.on('click', handler);
    
    // Pause events
    manager.pause();
    
    // Trigger event (should not call handler)
    element.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(0);
    
    // Resume events
    manager.resume();
    
    // Trigger event (should call handler)
    element.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
  
  test('should destroy all event listeners', () => {
    const element = document.createElement('div');
    const manager = createEventManager(element);
    const clickHandler = mock(() => {});
    const mouseoverHandler = mock(() => {});
    
    manager.on('click', clickHandler);
    manager.on('mouseover', mouseoverHandler);
    
    // Destroy all handlers
    manager.destroy();
    
    // Trigger events
    element.dispatchEvent(new Event('click'));
    element.dispatchEvent(new Event('mouseover'));
    
    expect(clickHandler).toHaveBeenCalledTimes(0);
    expect(mouseoverHandler).toHaveBeenCalledTimes(0);
    expect(manager.hasHandler('click', clickHandler)).toBe(false);
    expect(manager.hasHandler('mouseover', mouseoverHandler)).toBe(false);
    expect(manager.getHandlers().size).toBe(0);
  });
  
  test('should provide access to all handlers', () => {
    const element = document.createElement('div');
    const manager = createEventManager(element);
    const clickHandler = mock(() => {});
    const mouseoverHandler = mock(() => {});
    
    manager.on('click', clickHandler);
    manager.on('mouseover', mouseoverHandler);
    
    const handlers = manager.getHandlers();
    expect(handlers.size).toBe(2);
    
    // Check first handler keys (can't check exact values since the Map keys are generated)
    const keys = Array.from(handlers.keys());
    expect(keys.length).toBe(2);
    expect(keys[0]).toContain('click_');
    expect(keys[1]).toContain('mouseover_');
    
    // Check entries have expected properties
    const firstEntry = handlers.get(keys[0]);
    expect(firstEntry).toBeDefined();
    if (firstEntry) {
      expect(firstEntry.event).toBe('click');
      expect(firstEntry.original).toBe(clickHandler);
      expect(typeof firstEntry.enhanced).toBe('function');
    }
  });
  
  test('should support event listener options', () => {
    const element = document.createElement('div');
    const manager = createEventManager(element);
    const handler = mock(() => {});
    const options = { once: true };
    
    manager.on('click', handler, options);
    
    // Trigger event twice
    element.dispatchEvent(new Event('click'));
    element.dispatchEvent(new Event('click'));
    
    // Handler should only be called once due to { once: true }
    expect(handler).toHaveBeenCalledTimes(1);
  });
  
  test('should catch errors in event handlers', () => {
    const element = document.createElement('div');
    const manager = createEventManager(element);
    
    const errorHandler = () => {
      throw new Error('Test error');
    };
    
    // Add handler that throws
    manager.on('click', errorHandler);
    
    // Should not throw when dispatching the event
    expect(() => {
      element.dispatchEvent(new Event('click'));
    }).not.toThrow();
    
    // Console.error should have been called
    expect(console.error).toHaveBeenCalledTimes(1);
  });
  
  test('should chain method calls', () => {
    const element = document.createElement('div');
    const manager = createEventManager(element);
    const handler1 = mock(() => {});
    const handler2 = mock(() => {});
    
    // Chain methods
    manager
      .on('click', handler1)
      .on('mouseover', handler2)
      .off('mouseover', handler2);
    
    // Check results
    expect(manager.hasHandler('click', handler1)).toBe(true);
    expect(manager.hasHandler('mouseover', handler2)).toBe(false);
  });
});