// test/core/compose/component.test.ts
import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { JSDOM } from 'jsdom';

// Setup JSDOM environment
let dom: JSDOM;
let window: Window;
let document: Document;

// Mock mobile utilities
jest.mock('../../src/core/utils/mobile', () => ({
  normalizeEvent: jest.fn((event) => ({
    clientX: event.clientX || 0,
    clientY: event.clientY || 0,
    target: event.target || null,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    type: event.type || 'unknown'
  })),
  hasTouchSupport: jest.fn().mockReturnValue(true),
  TOUCH_CONFIG: {
    TARGET_SIZE: 44,
    FEEDBACK_DURATION: 200,
    TAP_THRESHOLD: 250,
    SWIPE_THRESHOLD: 50
  },
  PASSIVE_EVENTS: { passive: true }
}));

// Mock DOM creation utilities
jest.mock('../../src/core/dom/create', () => {
  // Store the original module to selectively mock only some functions
  const originalModule = jest.requireActual('../../src/core/dom/create');
  
  return {
    ...originalModule,
    createElement: jest.fn((options) => {
      const element = document.createElement(options.tag || 'div');
      
      // Apply classes
      if (options.className) {
        const classNames = Array.isArray(options.className) 
          ? options.className 
          : [options.className];
          
        classNames.filter(Boolean).forEach(cls => {
          element.classList.add(cls);
        });
      }
      
      // Apply attributes
      if (options.attrs) {
        Object.entries(options.attrs).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            element.setAttribute(key, String(value));
          }
        });
      }
      
      // Store context for testing
      if (options.context) {
        element.__testContext = options.context;
      }
      
      return element;
    }),
    removeEventHandlers: jest.fn()
  };
});

// Import the module under test
import {
  createBase,
  withElement,
  type BaseComponent,
  type ElementComponent,
  type WithElementOptions
} from '../../src/core/compose/component';

// Import dependencies for spy verification
import * as createModule from '../../src/core/dom/create';
import * as mobileModule from '../../src/core/utils/mobile';

describe('Component Module', () => {
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
    global.Touch = dom.window.Touch;
    global.TouchEvent = dom.window.TouchEvent;
  });

  afterEach(() => {
    // Clean up
    jest.clearAllMocks();
    delete global.window;
    delete global.document;
    delete global.HTMLElement;
    delete global.Event;
    delete global.Touch;
    delete global.TouchEvent;
  });

  describe('createBase', () => {
    test('should create a base component with default prefix', () => {
      const component = createBase({ componentName: 'button' });
      
      expect(component.config).toEqual({ componentName: 'button' });
      expect(component.componentName).toBe('button');
      expect(component.getClass('button')).toBe('mtrl-button');
      expect(component.getModifierClass('button', 'primary')).toBe('button--primary');
      expect(component.getElementClass('button', 'icon')).toBe('button-icon');
    });
    
    test('should use custom prefix when provided', () => {
      const component = createBase({ componentName: 'button', prefix: 'custom' });
      
      expect(component.getClass('button')).toBe('custom-button');
      expect(component.getModifierClass('button', 'primary')).toBe('button--primary');
      expect(component.getElementClass('button', 'icon')).toBe('button-icon');
    });
    
    test('should initialize touchState', () => {
      const component = createBase({});
      
      expect(component.touchState).toBeDefined();
      expect(component.touchState.startTime).toBe(0);
      expect(component.touchState.startPosition).toEqual({ x: 0, y: 0 });
      expect(component.touchState.isTouching).toBe(false);
      expect(component.touchState.activeTarget).toBeNull();
    });
    
    test('should provide updateTouchState method', () => {
      const component = createBase({});
      
      // Mock normalized event
      const mockEvent = new Event('touchstart');
      const normalizeEventSpy = spyOn(mobileModule, 'normalizeEvent').mockReturnValue({
        clientX: 100,
        clientY: 200,
        target: document.body,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        type: 'touchstart'
      });
      
      // Test start state
      component.updateTouchState(mockEvent, 'start');
      
      expect(normalizeEventSpy).toHaveBeenCalledWith(mockEvent);
      expect(component.touchState.isTouching).toBe(true);
      expect(component.touchState.startPosition).toEqual({ x: 100, y: 200 });
      expect(component.touchState.activeTarget).toBe(document.body);
      expect(component.touchState.startTime).toBeGreaterThan(0);
      
      // Test end state
      component.updateTouchState(mockEvent, 'end');
      
      expect(component.touchState.isTouching).toBe(false);
      expect(component.touchState.activeTarget).toBeNull();
    });
  });

  describe('withElement', () => {
    test('should add an element to a component', () => {
      const baseComponent = createBase({ componentName: 'button' });
      const createElementSpy = spyOn(createModule, 'createElement');
      
      const component = withElement({
        tag: 'button',
        className: ['primary'],
        attrs: { 'data-test': 'test' }
      })(baseComponent);
      
      expect(createElementSpy).toHaveBeenCalled();
      expect(createElementSpy.mock.calls[0][0]).toMatchObject({
        tag: 'button',
        className: expect.arrayContaining(['mtrl-button', 'mtrl-primary']),
        attrs: { 'data-test': 'test' }
      });
      
      expect(component.element).toBeDefined();
      expect(component.element instanceof HTMLElement).toBe(true);
      expect(component.element.tagName).toBe('BUTTON');
    });
    
    test('should use componentName from options if provided', () => {
      const baseComponent = createBase({ componentName: 'base' });
      const createElementSpy = spyOn(createModule, 'createElement');
      
      withElement({
        tag: 'div',
        componentName: 'custom'
      })(baseComponent);
      
      expect(createElementSpy).toHaveBeenCalled();
      expect(createElementSpy.mock.calls[0][0].className).toContain('mtrl-custom');
    });
    
    test('should add interactive class if touch is supported', () => {
      const baseComponent = createBase({});
      const hasTouchSpy = spyOn(mobileModule, 'hasTouchSupport').mockReturnValue(true);
      const createElementSpy = spyOn(createModule, 'createElement');
      
      withElement({
        interactive: true
      })(baseComponent);
      
      expect(hasTouchSpy).toHaveBeenCalled();
      expect(createElementSpy).toHaveBeenCalled();
      expect(createElementSpy.mock.calls[0][0].className).toContain('mtrl-interactive');
    });
    
    test('should not add interactive class if touch is not supported', () => {
      const baseComponent = createBase({});
      const hasTouchSpy = spyOn(mobileModule, 'hasTouchSupport').mockReturnValue(false);
      const createElementSpy = spyOn(createModule, 'createElement');
      
      withElement({
        interactive: true
      })(baseComponent);
      
      expect(hasTouchSpy).toHaveBeenCalled();
      expect(createElementSpy).toHaveBeenCalled();
      expect(createElementSpy.mock.calls[0][0].className).not.toContain('mtrl-interactive');
    });
    
    test('should pass component as context to createElement', () => {
      const baseComponent = createBase({});
      const createElementSpy = spyOn(createModule, 'createElement');
      
      withElement()(baseComponent);
      
      expect(createElementSpy).toHaveBeenCalled();
      expect(createElementSpy.mock.calls[0][0].context).toBe(baseComponent);
    });
    
    test('should add touch event listeners if interactive', () => {
      const baseComponent = createBase({});
      spyOn(mobileModule, 'hasTouchSupport').mockReturnValue(true);
      
      // Create a real element to test event listeners
      const element = document.createElement('div');
      const addEventListenerSpy = spyOn(element, 'addEventListener');
      
      spyOn(createModule, 'createElement').mockReturnValue(element);
      
      withElement({ interactive: true })(baseComponent);
      
      expect(addEventListenerSpy).toHaveBeenCalledTimes(3);
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), mobileModule.PASSIVE_EVENTS);
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), mobileModule.PASSIVE_EVENTS);
    });
    
    test('should not add touch event listeners if not interactive', () => {
      const baseComponent = createBase({});
      spyOn(mobileModule, 'hasTouchSupport').mockReturnValue(true);
      
      // Create a real element to test event listeners
      const element = document.createElement('div');
      const addEventListenerSpy = spyOn(element, 'addEventListener');
      
      spyOn(createModule, 'createElement').mockReturnValue(element);
      
      withElement({ interactive: false })(baseComponent);
      
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
    
    test('should provide addClass method', () => {
      const baseComponent = createBase({});
      const element = document.createElement('div');
      spyOn(createModule, 'createElement').mockReturnValue(element);
      
      const component = withElement()(baseComponent);
      
      component.addClass('test-class', 'another-class');
      
      expect(element.classList.contains('test-class')).toBe(true);
      expect(element.classList.contains('another-class')).toBe(true);
    });
    
    test('should provide destroy method that cleans up properly', () => {
      const baseComponent = createBase({});
      spyOn(mobileModule, 'hasTouchSupport').mockReturnValue(true);
      
      // Create a real element to test event listeners
      const element = document.createElement('div');
      const parentElement = document.createElement('div');
      parentElement.appendChild(element);
      
      const removeEventListenerSpy = spyOn(element, 'removeEventListener');
      const removeEventHandlersSpy = spyOn(createModule, 'removeEventHandlers');
      const removeSpy = spyOn(element, 'remove');
      
      spyOn(createModule, 'createElement').mockReturnValue(element);
      
      const component = withElement({ interactive: true })(baseComponent);
      
      component.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(3);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      
      expect(removeEventHandlersSpy).toHaveBeenCalledWith(element);
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('Touch Event Handling', () => {
    // Helper function to create a component with touch event handlers
    const createTouchComponent = () => {
      const baseComponent = createBase({});
      baseComponent['emit'] = mock();
      
      // Create a real element to test event handlers
      const element = document.createElement('div');
      spyOn(createModule, 'createElement').mockReturnValue(element);
      spyOn(mobileModule, 'hasTouchSupport').mockReturnValue(true);
      
      // Get actual event handlers by capturing them during addEventListener
      const eventHandlers: Record<string, Function> = {};
      const addEventListenerSpy = spyOn(element, 'addEventListener').mockImplementation(
        (event: string, handler: any) => {
          eventHandlers[event] = handler;
        }
      );
      
      const component = withElement({ interactive: true })(baseComponent);
      
      return { component, element, eventHandlers, addEventListenerSpy };
    };
    
    test('handleTouchStart should update touch state and add active class', () => {
      const { component, element, eventHandlers } = createTouchComponent();
      
      const touchEvent = new Event('touchstart');
      spyOn(component, 'updateTouchState');
      
      // Call the touchstart handler directly
      eventHandlers['touchstart'](touchEvent);
      
      expect(component.updateTouchState).toHaveBeenCalledWith(touchEvent, 'start');
      expect(element.classList.contains('mtrl-touch-active')).toBe(true);
    });
    
    test('handleTouchStart should emit touchstart event when forwardEvents includes it', () => {
      const baseComponent = createBase({});
      baseComponent['emit'] = mock();
      
      const normalizeEventSpy = spyOn(mobileModule, 'normalizeEvent').mockReturnValue({
        clientX: 100,
        clientY: 200,
        target: null,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        type: 'touchstart'
      });
      
      // Create a real element to test event handlers
      const element = document.createElement('div');
      spyOn(createModule, 'createElement').mockReturnValue(element);
      
      // Get actual event handlers by capturing them during addEventListener
      const eventHandlers: Record<string, Function> = {};
      spyOn(element, 'addEventListener').mockImplementation(
        (event: string, handler: any) => {
          eventHandlers[event] = handler;
        }
      );
      
      const component = withElement({ 
        interactive: true,
        forwardEvents: { touchstart: true }
      })(baseComponent);
      
      // Call the touchstart handler directly
      const touchEvent = new Event('touchstart');
      eventHandlers['touchstart'](touchEvent);
      
      expect(normalizeEventSpy).toHaveBeenCalledWith(touchEvent);
      expect(baseComponent['emit']).toHaveBeenCalledWith('touchstart', expect.anything());
    });
    
    test('handleTouchEnd should remove active class and update touch state', () => {
      const { component, element, eventHandlers } = createTouchComponent();
      
      // First set up the touch state
      component.touchState.isTouching = true;
      component.touchState.startTime = Date.now() - 100; // 100ms ago
      element.classList.add('mtrl-touch-active');
      
      spyOn(component, 'updateTouchState');
      
      // Call the touchend handler directly
      const touchEvent = new Event('touchend');
      eventHandlers['touchend'](touchEvent);
      
      expect(component.updateTouchState).toHaveBeenCalledWith(touchEvent, 'end');
      expect(element.classList.contains('mtrl-touch-active')).toBe(false);
    });
    
    test('handleTouchEnd should emit tap event for short touches', () => {
      const baseComponent = createBase({});
      baseComponent['emit'] = mock();
      
      // Create a real element to test event handlers
      const element = document.createElement('div');
      spyOn(createModule, 'createElement').mockReturnValue(element);
      
      // Get actual event handlers by capturing them during addEventListener
      const eventHandlers: Record<string, Function> = {};
      spyOn(element, 'addEventListener').mockImplementation(
        (event: string, handler: any) => {
          eventHandlers[event] = handler;
        }
      );
      
      const component = withElement({ interactive: true })(baseComponent);
      
      // Set up touch state for a short touch
      component.touchState.isTouching = true;
      component.touchState.startTime = Date.now() - 100; // 100ms ago
      
      // Call the touchend handler directly
      const touchEvent = new Event('touchend');
      eventHandlers['touchend'](touchEvent);
      
      expect(baseComponent['emit']).toHaveBeenCalledWith('tap', expect.anything());
    });
    
    test('handleTouchEnd should not emit tap event for long touches', () => {
      const baseComponent = createBase({});
      baseComponent['emit'] = mock();
      
      // Create a real element to test event handlers
      const element = document.createElement('div');
      spyOn(createModule, 'createElement').mockReturnValue(element);
      
      // Get actual event handlers by capturing them during addEventListener
      const eventHandlers: Record<string, Function> = {};
      spyOn(element, 'addEventListener').mockImplementation(
        (event: string, handler: any) => {
          eventHandlers[event] = handler;
        }
      );
      
      const component = withElement({ interactive: true })(baseComponent);
      
      // Set up touch state for a long touch (longer than TAP_THRESHOLD)
      component.touchState.isTouching = true;
      component.touchState.startTime = Date.now() - 500; // 500ms ago (beyond TAP_THRESHOLD of 250ms)
      
      // Call the touchend handler directly
      const touchEvent = new Event('touchend');
      eventHandlers['touchend'](touchEvent);
      
      expect(baseComponent['emit']).not.toHaveBeenCalledWith('tap', expect.anything());
    });
    
    test('handleTouchMove should emit swipe event when threshold exceeded', () => {
      const baseComponent = createBase({});
      baseComponent['emit'] = mock();
      
      spyOn(mobileModule, 'normalizeEvent').mockReturnValue({
        clientX: 160, // Start position + 60px (beyond SWIPE_THRESHOLD of 50px)
        clientY: 110, // Start position + 10px
        target: null,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        type: 'touchmove'
      });
      
      // Create a real element to test event handlers
      const element = document.createElement('div');
      spyOn(createModule, 'createElement').mockReturnValue(element);
      
      // Get actual event handlers by capturing them during addEventListener
      const eventHandlers: Record<string, Function> = {};
      spyOn(element, 'addEventListener').mockImplementation(
        (event: string, handler: any) => {
          eventHandlers[event] = handler;
        }
      );
      
      const component = withElement({ interactive: true })(baseComponent);
      
      // Set up touch state
      component.touchState.isTouching = true;
      component.touchState.startPosition = { x: 100, y: 100 };
      
      // Call the touchmove handler directly
      const touchEvent = new Event('touchmove');
      eventHandlers['touchmove'](touchEvent);
      
      // Should emit swipe with direction right (deltaX > 0)
      expect(baseComponent['emit']).toHaveBeenCalledWith('swipe', {
        direction: 'right',
        deltaX: 60,
        deltaY: 10
      });
    });
    
    test('handleTouchMove should emit left swipe when deltaX is negative', () => {
      const baseComponent = createBase({});
      baseComponent['emit'] = mock();
      
      spyOn(mobileModule, 'normalizeEvent').mockReturnValue({
        clientX: 40, // Start position - 60px (beyond SWIPE_THRESHOLD of 50px)
        clientY: 90, // Start position - 10px
        target: null,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        type: 'touchmove'
      });
      
      // Create a real element to test event handlers
      const element = document.createElement('div');
      spyOn(createModule, 'createElement').mockReturnValue(element);
      
      // Get actual event handlers by capturing them during addEventListener
      const eventHandlers: Record<string, Function> = {};
      spyOn(element, 'addEventListener').mockImplementation(
        (event: string, handler: any) => {
          eventHandlers[event] = handler;
        }
      );
      
      const component = withElement({ interactive: true })(baseComponent);
      
      // Set up touch state
      component.touchState.isTouching = true;
      component.touchState.startPosition = { x: 100, y: 100 };
      
      // Call the touchmove handler directly
      const touchEvent = new Event('touchmove');
      eventHandlers['touchmove'](touchEvent);
      
      // Should emit swipe with direction left (deltaX < 0)
      expect(baseComponent['emit']).toHaveBeenCalledWith('swipe', {
        direction: 'left',
        deltaX: -60,
        deltaY: -10
      });
    });
    
    test('handleTouchMove should not emit swipe when threshold not exceeded', () => {
      const baseComponent = createBase({});
      baseComponent['emit'] = mock();
      
      spyOn(mobileModule, 'normalizeEvent').mockReturnValue({
        clientX: 120, // Start position + 20px (below SWIPE_THRESHOLD of 50px)
        clientY: 100,
        target: null,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        type: 'touchmove'
      });
      
      // Create a real element to test event handlers
      const element = document.createElement('div');
      spyOn(createModule, 'createElement').mockReturnValue(element);
      
      // Get actual event handlers by capturing them during addEventListener
      const eventHandlers: Record<string, Function> = {};
      spyOn(element, 'addEventListener').mockImplementation(
        (event: string, handler: any) => {
          eventHandlers[event] = handler;
        }
      );
      
      const component = withElement({ interactive: true })(baseComponent);
      
      // Set up touch state
      component.touchState.isTouching = true;
      component.touchState.startPosition = { x: 100, y: 100 };
      
      // Call the touchmove handler directly
      const touchEvent = new Event('touchmove');
      eventHandlers['touchmove'](touchEvent);
      
      // Should not emit swipe
      expect(baseComponent['emit']).not.toHaveBeenCalledWith('swipe', expect.anything());
    });
  });

  describe('Integration', () => {
    test('should create a complete interactive component', () => {
      // Actually create DOM element
      spyOn(createModule, 'createElement').mockImplementation((options) => {
        const element = document.createElement(options.tag || 'div');
        
        // Add classes
        if (options.className) {
          const classNames = Array.isArray(options.className) ? options.className : [options.className];
          classNames.filter(Boolean).forEach(cls => element.classList.add(cls));
        }
        
        return element;
      });
      
      // Create component
      const config = {
        componentName: 'button',
        prefix: 'mtrl'
      };
      
      const component = withElement({
        tag: 'button',
        className: ['primary', 'large'],
        attrs: {
          type: 'button',
          'aria-label': 'Close Dialog'
        },
        interactive: true
      })(createBase(config));
      
      // Check component structure
      expect(component.config).toBe(config);
      expect(component.componentName).toBe('button');
      expect(component.getClass('button')).toBe('mtrl-button');
      
      // Check element
      expect(component.element).toBeDefined();
      expect(component.element.tagName).toBe('BUTTON');
      expect(component.element.classList.contains('mtrl-button')).toBe(true);
      expect(component.element.classList.contains('mtrl-primary')).toBe(true);
      expect(component.element.classList.contains('mtrl-large')).toBe(true);
      expect(component.element.classList.contains('mtrl-interactive')).toBe(true);
      expect(component.element.getAttribute('type')).toBe('button');
      expect(component.element.getAttribute('aria-label')).toBe('Close Dialog');
      
      // Check methods
      expect(typeof component.addClass).toBe('function');
      expect(typeof component.destroy).toBe('function');
      expect(typeof component.updateTouchState).toBe('function');
      
      // Add class and check
      component.addClass('custom-class');
      expect(component.element.classList.contains('custom-class')).toBe(true);
    });
  });
});