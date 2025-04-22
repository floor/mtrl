// test/core/gestures/longpress.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { detectLongPress, shouldCancelLongPress } from '../../../src/core/gestures/longpress';

// Setup jsdom environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;
let originalGlobalSetTimeout: any;
let originalGlobalClearTimeout: any;

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
  originalGlobalSetTimeout = global.setTimeout;
  originalGlobalClearTimeout = global.clearTimeout;
  
  // Set globals to use jsdom
  global.document = document;
  global.window = window;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.Event = window.Event;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  global.setTimeout = originalGlobalSetTimeout;
  global.clearTimeout = originalGlobalClearTimeout;
  
  // Clean up jsdom
  window.close();
});

describe('Long Press Gesture Detection', () => {
  describe('detectLongPress', () => {
    test('should create a timer that calls the callback', () => {
      // Mock setTimeout
      const mockTimerId = 123;
      const mockSetTimeout = mock(
        (callback: Function, timeout: number) => mockTimerId
      );
      global.setTimeout = mockSetTimeout as any;
      
      // Create a mock callback
      const callback = mock(() => {});
      
      // Mock event
      const mockEvent = new Event('mousedown');
      
      // Create mock gesture state
      const state = {
        active: true,
        startX: 100,
        startY: 100,
        currentX: 103, // Small movement within threshold
        currentY: 102,
        startTime: Date.now() - 50, // 50ms ago
        target: document.body,
        longPressTimer: null
      };
      
      // Create mock options
      const options = {
        longPressTime: 500,
        tapDistanceThreshold: 10
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: mockEvent
      };
      
      try {
        // Call detectLongPress
        const cleanup = detectLongPress(context, callback);
        
        // Verify setTimeout was called with the right parameters
        expect(mockSetTimeout).toHaveBeenCalledTimes(1);
        
        // First parameter is the callback function
        expect(typeof mockSetTimeout.mock.calls[0][0]).toBe('function');
        
        // Second parameter is the timeout
        expect(mockSetTimeout.mock.calls[0][1]).toBe(options.longPressTime);
        
        // Verify cleanup function is returned
        expect(typeof cleanup).toBe('function');
      } finally {
        // Restore original setTimeout
        global.setTimeout = originalGlobalSetTimeout;
      }
    });
    
    test('should cleanup timeouts when cleanup function is called', () => {
      // Mock clearTimeout
      const mockClearTimeout = mock(() => {});
      global.clearTimeout = mockClearTimeout as any;
      
      // Set a fake timer ID that will be used by setTimeout
      const mockTimerId = 456;
      global.setTimeout = (() => mockTimerId) as any;
      
      // Create a mock callback
      const callback = mock(() => {});
      
      // Mock event
      const mockEvent = new Event('mousedown');
      
      // Create mock gesture state
      const state = {
        active: true,
        startX: 100,
        startY: 100,
        currentX: 103,
        currentY: 102,
        startTime: Date.now() - 50,
        target: document.body,
        longPressTimer: null
      };
      
      // Create mock options
      const options = {
        longPressTime: 500,
        tapDistanceThreshold: 10
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: mockEvent
      };
      
      try {
        // Call detectLongPress and get cleanup function
        const cleanup = detectLongPress(context, callback);
        
        // Call cleanup function
        cleanup();
        
        // Verify clearTimeout was called
        expect(mockClearTimeout).toHaveBeenCalledTimes(1);
      } finally {
        // Restore original functions
        global.setTimeout = originalGlobalSetTimeout;
        global.clearTimeout = originalGlobalClearTimeout;
      }
    });
    
    test('should trigger callback when timer fires and conditions are met', async () => {
      // Create a mock callback
      const callback = mock(() => {});
      
      // Manually trigger the timeout function
      const executeTimeoutCallback = (fn: Function) => {
        // Store the callback for later execution
        (global as any).__timeoutCallback = fn;
        return 123;
      };
      
      global.setTimeout = executeTimeoutCallback as any;
      
      // Mock event
      const mockEvent = new Event('mousedown');
      
      // Create mock gesture state with valid conditions
      const state = {
        active: true, // Gesture is still active
        startX: 100,
        startY: 100,
        currentX: 103, // Small movement within threshold
        currentY: 102,
        startTime: Date.now() - 500, // Long enough
        target: document.body,
        longPressTimer: null
      };
      
      // Create mock options
      const options = {
        longPressTime: 500,
        tapDistanceThreshold: 10
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: mockEvent
      };
      
      try {
        // Call detectLongPress - this will store the callback but not execute it yet
        detectLongPress(context, callback);
        
        // Now execute the stored callback manually
        if ((global as any).__timeoutCallback) {
          (global as any).__timeoutCallback();
        }
        
        // Verify callback was called
        expect(callback).toHaveBeenCalledTimes(1);
        
        // Verify the structure of the event passed to callback
        const callEvent = callback.mock.calls[0][0];
        expect(callEvent.type).toBe('longpress');
      } finally {
        // Clean up
        delete (global as any).__timeoutCallback;
        global.setTimeout = originalGlobalSetTimeout;
      }
    });
    
    test('should not trigger callback if gesture is no longer active', () => {
      // Manual execution approach
      const executeTimeoutCallback = (fn: Function) => {
        // Store the callback for later execution
        (global as any).__timeoutCallback = fn;
        return 123;
      };
      
      global.setTimeout = executeTimeoutCallback as any;
      
      // Create a mock callback
      const callback = mock(() => {});
      
      // Mock event
      const mockEvent = new Event('mousedown');
      
      // Create mock gesture state
      const state = {
        active: false, // Gesture is no longer active
        startX: 100,
        startY: 100,
        currentX: 103,
        currentY: 102,
        startTime: Date.now() - 500,
        target: document.body,
        longPressTimer: null
      };
      
      // Create mock options
      const options = {
        longPressTime: 500,
        tapDistanceThreshold: 10
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: mockEvent
      };
      
      try {
        // Call detectLongPress - this will store the callback but not execute it yet
        detectLongPress(context, callback);
        
        // Now execute the stored callback manually
        if ((global as any).__timeoutCallback) {
          (global as any).__timeoutCallback();
        }
        
        // Verify callback was not called
        expect(callback).not.toHaveBeenCalled();
      } finally {
        // Clean up
        delete (global as any).__timeoutCallback;
        global.setTimeout = originalGlobalSetTimeout;
      }
    });
    
    test('should not trigger callback if movement exceeds threshold', () => {
      // Manual execution approach
      const executeTimeoutCallback = (fn: Function) => {
        // Store the callback for later execution
        (global as any).__timeoutCallback = fn;
        return 123;
      };
      
      global.setTimeout = executeTimeoutCallback as any;
      
      // Create a mock callback
      const callback = mock(() => {});
      
      // Mock event
      const mockEvent = new Event('mousedown');
      
      // Create mock gesture state with too much movement
      const state = {
        active: true,
        startX: 100,
        startY: 100,
        currentX: 120, // 20px movement - exceeds the 10px threshold
        currentY: 100,
        startTime: Date.now() - 500,
        target: document.body,
        longPressTimer: null
      };
      
      // Create mock options
      const options = {
        longPressTime: 500,
        tapDistanceThreshold: 10
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: mockEvent
      };
      
      try {
        // Call detectLongPress - this will store the callback but not execute it yet
        detectLongPress(context, callback);
        
        // Now execute the stored callback manually
        if ((global as any).__timeoutCallback) {
          (global as any).__timeoutCallback();
        }
        
        // Verify callback was not called
        expect(callback).not.toHaveBeenCalled();
      } finally {
        // Clean up
        delete (global as any).__timeoutCallback;
        global.setTimeout = originalGlobalSetTimeout;
      }
    });
  });
  
  describe('shouldCancelLongPress', () => {
    test('should return true if movement exceeds threshold', () => {
      // Create mock gesture state with movement exceeding threshold
      const state = {
        startX: 100,
        startY: 100,
        currentX: 120, // 20px movement - exceeds the 10px threshold
        currentY: 100
      };
      
      // Create mock options
      const options = {
        tapDistanceThreshold: 10
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: new Event('mousemove')
      };
      
      // Check if long press should be canceled
      const shouldCancel = shouldCancelLongPress(context);
      
      // Verify result
      expect(shouldCancel).toBe(true);
    });
    
    test('should return false if movement is within threshold', () => {
      // Create mock gesture state with movement within threshold
      const state = {
        startX: 100,
        startY: 100,
        currentX: 105, // 5px movement - within the 10px threshold
        currentY: 105
      };
      
      // Create mock options
      const options = {
        tapDistanceThreshold: 10
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: new Event('mousemove')
      };
      
      // Check if long press should be canceled
      const shouldCancel = shouldCancelLongPress(context);
      
      // Verify result
      expect(shouldCancel).toBe(false);
    });
    
    test('should handle movement in both axes', () => {
      // Test cases
      const testCases = [
        // X exceeds threshold
        {
          state: { startX: 100, startY: 100, currentX: 115, currentY: 105 },
          expected: true
        },
        // Y exceeds threshold
        {
          state: { startX: 100, startY: 100, currentX: 105, currentY: 115 },
          expected: true
        },
        // Both X and Y within threshold
        {
          state: { startX: 100, startY: 100, currentX: 105, currentY: 105 },
          expected: false
        },
        // Both X and Y exceed threshold
        {
          state: { startX: 100, startY: 100, currentX: 115, currentY: 115 },
          expected: true
        }
      ];
      
      for (const testCase of testCases) {
        // Create mock options
        const options = {
          tapDistanceThreshold: 10
        };
        
        // Create context
        const context = {
          state: testCase.state,
          options,
          originalEvent: new Event('mousemove')
        };
        
        // Check if long press should be canceled
        const shouldCancel = shouldCancelLongPress(context);
        
        // Verify result
        expect(shouldCancel).toBe(testCase.expected);
      }
    });
  });
});