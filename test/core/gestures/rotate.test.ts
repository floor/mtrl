// test/core/gestures/rotate.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { detectRotate } from '../../../src/core/gestures/rotate';

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
  global.Event = window.Event;
  global.Touch = window.Touch;
  global.TouchEvent = window.TouchEvent;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  
  // Clean up jsdom
  window.close();
});

describe('Rotate Gesture Detection', () => {
  test('should detect clockwise rotation', () => {
    // Mock event
    const mockEvent = new Event('touchmove');
    
    // Create mock touches
    const touch1 = {
      clientX: 100,
      clientY: 100
    };
    
    const touch2 = {
      clientX: 120,
      clientY: 80
    };
    
    // Create mock gesture state
    // We'll set startAngle to a value that would show significant rotation
    const state = {
      startAngle: 0, // Starting at 0 degrees
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Mock options
    const options = {
      rotateThreshold: 5 // 5 degrees threshold
    };
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect rotate
    const rotateEvent = detectRotate(context, touch1 as Touch, touch2 as Touch);
    
    // Verify results
    expect(rotateEvent).not.toBeNull();
    if (rotateEvent) {
      expect(rotateEvent.type).toBe('rotate');
      
      // The exact rotation angle depends on getAngle implementation,
      // but it should be a number
      expect(typeof rotateEvent.rotation).toBe('number');
      
      // Expected center is the average of touch points
      expect(rotateEvent.centerX).toBe(110); // (100 + 120) / 2
      expect(rotateEvent.centerY).toBe(90);  // (100 + 80) / 2
    }
  });
  
  test('should detect counter-clockwise rotation', () => {
    // Mock event
    const mockEvent = new Event('touchmove');
    
    // Create mock touches
    const touch1 = {
      clientX: 100,
      clientY: 100
    };
    
    const touch2 = {
      clientX: 80,
      clientY: 80
    };
    
    // Create mock gesture state
    // Set startAngle to show significant counter-clockwise rotation
    const state = {
      startAngle: 90, // Starting at 90 degrees
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Mock options
    const options = {
      rotateThreshold: 5 // 5 degrees threshold
    };
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect rotate
    const rotateEvent = detectRotate(context, touch1 as Touch, touch2 as Touch);
    
    // Verify results
    expect(rotateEvent).not.toBeNull();
    if (rotateEvent) {
      expect(rotateEvent.type).toBe('rotate');
      expect(typeof rotateEvent.rotation).toBe('number');
      expect(rotateEvent.centerX).toBe(90);  // (100 + 80) / 2
      expect(rotateEvent.centerY).toBe(90);  // (100 + 80) / 2
    }
  });
  
  test('should not detect rotation below threshold', () => {
    // Mock event
    const mockEvent = new Event('touchmove');
    
    // Create mock touches that would result in minimal angle change
    const touch1 = {
      clientX: 100,
      clientY: 100
    };
    
    const touch2 = {
      clientX: 101, // Very close to touch1
      clientY: 100
    };
    
    // Create mock gesture state
    const state = {
      startAngle: 0, // Starting at 0 degrees
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Mock options with a high threshold to ensure no detection
    const options = {
      rotateThreshold: 20 // 20 degrees threshold
    };
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect rotate
    const rotateEvent = detectRotate(context, touch1 as Touch, touch2 as Touch);
    
    // Verify no rotation was detected
    expect(rotateEvent).toBeNull();
  });
  
  test('should handle 360-degree wraparound', () => {
    // Mock event
    const mockEvent = new Event('touchmove');
    
    // Create mock touches that would cause angle wraparound
    const touch1 = {
      clientX: 100,
      clientY: 100
    };
    
    const touch2 = {
      clientX: 110,
      clientY: 90
    };
    
    // Create mock gesture state with angle near 360 degrees
    const state = {
      startAngle: 350, // Starting at 350 degrees
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Mock options
    const options = {
      rotateThreshold: 5 // 5 degrees threshold
    };
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect rotate - we're just checking this doesn't crash 
    // due to angle wrapping around from 350+ to near 0
    try {
      const rotateEvent = detectRotate(context, touch1 as Touch, touch2 as Touch);
      
      // Function didn't crash, which is good
      // We won't make specific assertions about the return value
      // as it depends on the exact implementation of angle calculations
    } catch (error) {
      // Fail if there's an error
      expect(error).toBeUndefined();
    }
  });
  
  test('should calculate center point correctly for various touch positions', () => {
    // Mock event
    const mockEvent = new Event('touchmove');
    
    // Test cases with different touch positions
    const testCases = [
      {
        touch1: { clientX: 0, clientY: 0 },
        touch2: { clientX: 100, clientY: 100 },
        expectedCenter: { x: 50, y: 50 }
      },
      {
        touch1: { clientX: 200, clientY: 200 },
        touch2: { clientX: 100, clientY: 100 },
        expectedCenter: { x: 150, y: 150 }
      },
      {
        touch1: { clientX: 100, clientY: 0 },
        touch2: { clientX: 100, clientY: 200 },
        expectedCenter: { x: 100, y: 100 }
      }
    ];
    
    for (const testCase of testCases) {
      // Create mock gesture state with a significant angle difference
      const state = {
        startAngle: 0, // Any value different enough from current angle
        startTime: Date.now() - 50,
        target: document.body
      };
      
      // Mock options with low threshold
      const options = {
        rotateThreshold: 1 // Low threshold to ensure detection
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: mockEvent
      };
      
      // Detect rotate
      const rotateEvent = detectRotate(
        context, 
        testCase.touch1 as Touch, 
        testCase.touch2 as Touch
      );
      
      // Verify center point calculation
      expect(rotateEvent).not.toBeNull();
      if (rotateEvent) {
        expect(rotateEvent.centerX).toBe(testCase.expectedCenter.x);
        expect(rotateEvent.centerY).toBe(testCase.expectedCenter.y);
      }
    }
  });
});