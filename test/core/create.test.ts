// test/core/dom/create.test.ts
import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { JSDOM } from 'jsdom';

// Setup JSDOM environment
let dom: JSDOM;
let window: Window;
let document: Document;

// Import DOM creation utilities
import {
  createElement,
  removeEventHandlers,
  withAttributes,
  withClasses,
  withContent,
  type CreateElementOptions,
  type EventHandler
} from '../../../src/core/dom/create';

// Mock dependencies
import * as classesModule from '../../../src/core/dom/classes';
import * as attributesModule from '../../../src/core/dom/attributes';
import * as utilsModule from '../../../src/core/utils';

describe('DOM Creation Module', () => {
  // Setup and teardown for each test
  beforeEach(() => {
    // Setup JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost/',
      contentType: 'text/html'
    });

    global.window = dom.window as any;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.Event = dom.window.Event;
    global.CustomEvent = dom.window.CustomEvent;
    
    // Mock addClass function
    spyOn(classesModule, 'addClass').mockImplementation((element, ...classes) => {
      // Simple addClass implementation for testing
      classes.flat().forEach(className => {
        if (className) element.classList.add(`mtrl-${className}`);
      });
      return element;
    });
    
    // Mock setAttributes function
    spyOn(attributesModule, 'setAttributes').mockImplementation((element, attrs) => {
      Object.entries(attrs).forEach(([key, value]) => {
        if (value != null) element.setAttribute(key, String(value));
      });
      return element;
    });
    
    // Mock normalizeClasses function
    spyOn(utilsModule, 'normalizeClasses').mockImplementation((...classes) => {
      return classes.flat().filter(Boolean);
    });
  });

  afterEach(() => {
    // Clean up
    jest.clearAllMocks();
    delete global.window;
    delete global.document;
    delete global.HTMLElement;
    delete global.Event;
    delete global.CustomEvent;
  });

  describe('createElement', () => {
    test('should create an element with default tag', () => {
      const element = createElement();
      
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.tagName).toBe('DIV');
    });
    
    test('should create an element with custom tag', () => {
      const element = createElement({ tag: 'button' });
      
      expect(element.tagName).toBe('BUTTON');
    });
    
    test('should set HTML content', () => {
      const element = createElement({ html: '<span>Test</span>' });
      
      expect(element.innerHTML).toBe('<span>Test</span>');
    });
    
    test('should set text content', () => {
      const element = createElement({ text: 'Hello World' });
      
      expect(element.textContent).toBe('Hello World');
    });
    
    test('should set id attribute', () => {
      const element = createElement({ id: 'test-id' });
      
      expect(element.id).toBe('test-id');
    });
    
    test('should add prefixed classes', () => {
      const element = createElement({ class: 'button primary' });
      
      // Note: We're checking for the mocked behavior here
      expect(classesModule.addClass).toHaveBeenCalled();
      expect(element.classList.contains('mtrl-button')).toBe(true);
      expect(element.classList.contains('mtrl-primary')).toBe(true);
    });
    
    test('should handle className alias for class', () => {
      const element = createElement({ className: 'button secondary' });
      
      expect(classesModule.addClass).toHaveBeenCalled();
      expect(element.classList.contains('mtrl-button')).toBe(true);
      expect(element.classList.contains('mtrl-secondary')).toBe(true);
    });
    
    test('should add raw classes without prefix', () => {
      const element = createElement({ rawClass: 'no-prefix custom-class' });
      
      expect(element.classList.contains('no-prefix')).toBe(true);
      expect(element.classList.contains('custom-class')).toBe(true);
      // Should not be prefixed
      expect(element.classList.contains('mtrl-no-prefix')).toBe(false);
    });
    
    test('should set data attributes', () => {
      const element = createElement({ 
        data: { 
          test: 'value', 
          count: '42'
        } 
      });
      
      expect(element.dataset.test).toBe('value');
      expect(element.dataset.count).toBe('42');
    });
    
    test('should set regular attributes', () => {
      const element = createElement({ 
        attrs: { 
          role: 'button', 
          'aria-label': 'Test Button',
          'data-testid': 'test-button'
        } 
      });
      
      expect(element.getAttribute('role')).toBe('button');
      expect(element.getAttribute('aria-label')).toBe('Test Button');
      expect(element.getAttribute('data-testid')).toBe('test-button');
    });
    
    test('should append to container when provided', () => {
      const container = document.createElement('div');
      const element = createElement({ container, text: 'Child Element' });
      
      expect(container.childNodes.length).toBe(1);
      expect(container.firstChild).toBe(element);
    });
    
    test('should call onCreate callback with element and context', () => {
      const onCreate = mock((el, ctx) => {
        el.dataset.initialized = 'true';
      });
      
      const context = { foo: 'bar' };
      const element = createElement({ 
        onCreate,
        context
      });
      
      expect(onCreate).toHaveBeenCalledWith(element, context);
      expect(element.dataset.initialized).toBe('true');
    });
    
    test('should handle additional attributes via rest props', () => {
      const element = createElement({ 
        type: 'text',
        disabled: true,
        placeholder: 'Enter text'
      });
      
      expect(element.getAttribute('type')).toBe('text');
      expect(element.getAttribute('disabled')).toBe('true');
      expect(element.getAttribute('placeholder')).toBe('Enter text');
    });
  });
  
  describe('Event forwarding', () => {
    test('should set up event forwarding with emit', () => {
      const emit = mock();
      const context = { emit };
      
      const element = createElement({
        forwardEvents: {
          click: true,
          focus: false,
          input: (ctx, event) => event.target === ctx.element
        },
        context
      });
      
      // Trigger click event (should be forwarded)
      element.click();
      expect(emit).toHaveBeenCalledWith('click', expect.objectContaining({
        element,
        originalEvent: expect.any(Event)
      }));
      
      // Reset mock calls
      emit.mockClear();
      
      // Create and dispatch focus event (should not be forwarded)
      const focusEvent = new Event('focus');
      element.dispatchEvent(focusEvent);
      expect(emit).not.toHaveBeenCalled();
      
      // Create and dispatch input event (should be forwarded based on condition)
      const inputEvent = new Event('input');
      element.dispatchEvent(inputEvent);
      expect(emit).toHaveBeenCalledWith('input', expect.objectContaining({
        element,
        originalEvent: inputEvent
      }));
    });
    
    test('should set up event forwarding with on (CustomEvent)', () => {
      const on = mock();
      const context = { on };
      
      // Mock element.dispatchEvent to spy on CustomEvent creation
      const dispatchSpy = spyOn(HTMLElement.prototype, 'dispatchEvent');
      
      const element = createElement({
        forwardEvents: {
          click: true
        },
        context
      });
      
      // Trigger click event
      element.click();
      
      // Check that dispatchEvent was called with a CustomEvent
      expect(dispatchSpy).toHaveBeenCalled();
      expect(dispatchSpy.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
    });
    
    test('should handle errors in event condition functions', () => {
      // Spy on console.warn
      const consoleSpy = spyOn(console, 'warn');
      
      const emit = mock();
      const context = { emit };
      
      const element = createElement({
        forwardEvents: {
          click: (ctx, event) => {
            throw new Error('Test error');
          }
        },
        context
      });
      
      // Trigger click event (should catch error and not forward)
      element.click();
      expect(consoleSpy).toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
    });
  });
  
  describe('removeEventHandlers', () => {
    test('should remove registered event handlers', () => {
      // Create element with event handlers
      const handler = mock();
      const element = document.createElement('div');
      
      // Manually set up what createElement would do
      element.__eventHandlers = { click: handler };
      element.addEventListener('click', handler);
      
      // Spy on removeEventListener
      const removeSpy = spyOn(element, 'removeEventListener');
      
      // Remove handlers
      removeEventHandlers(element);
      
      // Check that removeEventListener was called
      expect(removeSpy).toHaveBeenCalledWith('click', handler);
      
      // Check that __eventHandlers was removed
      expect(element.__eventHandlers).toBeUndefined();
    });
    
    test('should handle elements with no event handlers', () => {
      const element = document.createElement('div');
      
      // This should not throw
      expect(() => removeEventHandlers(element)).not.toThrow();
    });
  });
  
  describe('Element transformers', () => {
    test('withAttributes should set attributes on element', () => {
      const element = document.createElement('div');
      const attributesSpy = spyOn(attributesModule, 'setAttributes');
      
      const attrs = { role: 'button', 'aria-label': 'Test' };
      const result = withAttributes(attrs)(element);
      
      expect(result).toBe(element); // Should return the same element
      expect(attributesSpy).toHaveBeenCalledWith(element, attrs);
    });
    
    test('withClasses should add classes to element', () => {
      const element = document.createElement('div');
      const addClassSpy = spyOn(classesModule, 'addClass');
      
      const result = withClasses('primary', ['secondary', 'large'])(element);
      
      expect(result).toBe(element); // Should return the same element
      expect(addClassSpy).toHaveBeenCalledWith(element, 'primary', ['secondary', 'large']);
    });
    
    test('withContent should add text content to element', () => {
      const element = document.createElement('div');
      
      const result = withContent('Hello World')(element);
      
      expect(result).toBe(element); // Should return the same element
      expect(element.textContent).toBe('Hello World');
    });
    
    test('withContent should add node content to element', () => {
      const element = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = 'Child Node';
      
      const result = withContent(span)(element);
      
      expect(result).toBe(element); // Should return the same element
      expect(element.firstChild).toBe(span);
    });
  });
  
  describe('Complex usage', () => {
    test('should create a complete UI element with all features', () => {
      // Create a button with icon, text, and event handling
      const emit = mock();
      const context = { 
        emit,
        state: { count: 0 }
      };
      
      const button = createElement({
        tag: 'button',
        id: 'increment-btn',
        class: 'button primary',
        rawClass: 'custom-button',
        attrs: {
          'aria-label': 'Increment counter',
          role: 'button'
        },
        data: {
          testid: 'increment-button',
          action: 'increment'
        },
        html: '<span class="icon">+</span><span class="text">Increment</span>',
        forwardEvents: {
          click: true,
          mouseenter: true,
          mouseleave: (ctx, event) => ctx.state.count < 10 // Only forward mouseleave when count < 10
        },
        container: document.body,
        context
      });
      
      // Check element creation
      expect(button.tagName).toBe('BUTTON');
      expect(button.id).toBe('increment-btn');
      expect(button.classList.contains('mtrl-button')).toBe(true);
      expect(button.classList.contains('mtrl-primary')).toBe(true);
      expect(button.classList.contains('custom-button')).toBe(true);
      expect(button.getAttribute('aria-label')).toBe('Increment counter');
      expect(button.getAttribute('role')).toBe('button');
      expect(button.dataset.testid).toBe('increment-button');
      expect(button.dataset.action).toBe('increment');
      expect(button.innerHTML).toBe('<span class="icon">+</span><span class="text">Increment</span>');
      
      // Check container attachment
      expect(document.body.contains(button)).toBe(true);
      
      // Test event forwarding
      emit.mockClear();
      button.click();
      expect(emit).toHaveBeenCalledWith('click', expect.anything());
      
      emit.mockClear();
      button.dispatchEvent(new Event('mouseenter'));
      expect(emit).toHaveBeenCalledWith('mouseenter', expect.anything());
      
      // Test conditional event forwarding - should forward when count < 10
      emit.mockClear();
      button.dispatchEvent(new Event('mouseleave'));
      expect(emit).toHaveBeenCalledWith('mouseleave', expect.anything());
      
      // Now change state and test condition
      context.state.count = 10;
      emit.mockClear();
      button.dispatchEvent(new Event('mouseleave'));
      expect(emit).not.toHaveBeenCalled();
      
      // Test cleanup
      removeEventHandlers(button);
      
      // After cleanup, events should not be forwarded
      emit.mockClear();
      button.click();
      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    test('should handle null/undefined values in attributes', () => {
      const element = createElement({
        attrs: {
          required: true,
          disabled: false,
          'aria-selected': null,
          title: undefined,
          tabindex: 0
        }
      });
      
      expect(element.getAttribute('required')).toBe('true');
      expect(element.getAttribute('disabled')).toBe('false');
      expect(element.getAttribute('aria-selected')).toBeNull();
      expect(element.getAttribute('title')).toBeNull();
      expect(element.getAttribute('tabindex')).toBe('0');
    });
    
    test('should skip non-existent forwardEvents context', () => {
      // This should not throw
      const element = createElement({
        forwardEvents: {
          click: true
        }
        // No context provided
      });
      
      // Nothing to assert - just checking it doesn't throw
      expect(element).toBeInstanceOf(HTMLElement);
    });
    
    test('should handle empty class arrays', () => {
      const element = createElement({
        class: []
      });
      
      // Nothing to assert - just checking it doesn't throw
      expect(element).toBeInstanceOf(HTMLElement);
    });
  });
});