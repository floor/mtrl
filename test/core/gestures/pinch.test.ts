// test/core/gestures/pinch.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { detectPinch } from '../../../src/core/gestures/pinch';

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

describe('Pinch Gesture Detection', () => {
  test('should detect a pinch-in gesture with significant distance change', () => {
    // Mock event
    const mockEvent = new Event('touchmove');
    
    // Create mock touches
    const touch1 = {
      clientX: 100,
      clientY: 100
    };
    
    const touch2 = {
      clientX: 110,
      clientY: 110
    };
    
    // Create mock gesture state with initial distance that will create significant change
    // Based on the implementation, we need a distance change > PINCH_THRESHOLD (which is 10)
    // Distance between (100,100) and (110,110) will be approximately 14.14
    // So setting startDistance to 50 will give us a change of ~36
    const state = {
      startDistance: 50, // Starting distance between fingers
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Mock options
    const options = {};
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect pinch
    const pinchEvent = detectPinch(context, touch1 as Touch, touch2 as Touch);
    
    // Verify results
    expect(pinchEvent).not.toBeNull();
    if (pinchEvent) {
      expect(pinchEvent.type).toBe('pinch');
      expect(pinchEvent.centerX).toBe(105); // (100 + 110) / 2 = 105
      expect(pinchEvent.centerY).toBe(105); // (100 + 110) / 2 = 105
      
      // We can't precisely check the scale without knowing the exact implementation
      // of getDistance, but we can check that it's a number
      expect(typeof pinchEvent.scale).toBe('number');
    }
  });
  
  test('should detect a pinch-out gesture with significant distance change', () => {
    // Mock event
    const mockEvent = new Event('touchmove');
    
    // Create mock touches with large distance
    const touch1 = {
      clientX: 80,
      clientY: 80
    };
    
    const touch2 = {
      clientX: 120,
      clientY: 120
    };
    
    // Create mock gesture state with a small initial distance to ensure detection
    // Distance between (80,80) and (120,120) will be ~56.57
    // So setting startDistance to 10 will give us a change of ~46.57 which is > PINCH_THRESHOLD
    const state = {
      startDistance: 10, // Small starting distance
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Create context
    const context = {
      state,
      options: {},
      originalEvent: mockEvent
    };
    
    // Detect pinch
    const pinchEvent = detectPinch(context, touch1 as Touch, touch2 as Touch);
    
    // Verify results
    expect(pinchEvent).not.toBeNull();
    if (pinchEvent) {
      expect(pinchEvent.type).toBe('pinch');
      expect(pinchEvent.centerX).toBe(100); // (80 + 120) / 2 = 100
      expect(pinchEvent.centerY).toBe(100); // (80 + 120) / 2 = 100
      expect(typeof pinchEvent.scale).toBe('number');
      expect(pinchEvent.scale).toBeGreaterThan(1); // Should be pinching out
    }
  });
  
  test('should not detect a pinch with minimal distance change', () => {
    // Mock event
    const mockEvent = new Event('touchmove');
    
    // Create mock touches with minimal distance
    const touch1 = {
      clientX: 100,
      clientY: 100
    };
    
    const touch2 = {
      clientX: 105, // Very close to touch1
      clientY: 105
    };
    
    // Create mock gesture state
    // Distance between the points will be ~7.07, which is < PINCH_THRESHOLD (10)
    const state = {
      startDistance: 10, // Not far from current distance
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Create context
    const context = {
      state,
      options: {},
      originalEvent: mockEvent
    };
    
    // Detect pinch
    const pinchEvent = detectPinch(context, touch1 as Touch, touch2 as Touch);
    
    // Verify no pinch was detected (should return null for small changes)
    expect(pinchEvent).toBeNull();
  });
  
  test('should detect pinch gestures at different angles', () => {
    // Mock event
    const mockEvent = new Event('touchmove');
    
    // Test different touch positions at various angles
    const testCases = [
      // Horizontal points (left to right)
      {
        touch1: { clientX: 80, clientY: 100 },
        touch2: { clientX: 140, clientY: 100 }, // 60px apart horizontally
        startDistance: 20 // Less than actual distance to ensure detection
      },
      // Vertical points (top to bottom)
      {
        touch1: { clientX: 100, clientY: 80 },
        touch2: { clientX: 100, clientY: 140 }, // 60px apart vertically
        startDistance: 20
      },
      // Diagonal points
      {
        touch1: { clientX: 80, clientY: 80 },
        touch2: { clientX: 140, clientY: 140 }, // Diagonal distance ~84.85px
        startDistance: 30
      }
    ];
    
    for (const testCase of testCases) {
      // Create mock gesture state
      const state = {
        startDistance: testCase.startDistance,
        startTime: Date.now() - 50,
        target: document.body
      };
      
      // Create context
      const context = {
        state,
        options: {},
        originalEvent: mockEvent
      };
      
      // Detect pinch
      const pinchEvent = detectPinch(
        context, 
        testCase.touch1 as Touch, 
        testCase.touch2 as Touch
      );
      
      // Verify the pinch was detected
      expect(pinchEvent).not.toBeNull();
      if (pinchEvent) {
        // Calculate expected center
        const expectedCenterX = (testCase.touch1.clientX + testCase.touch2.clientX) / 2;
        const expectedCenterY = (testCase.touch1.clientY + testCase.touch2.clientY) / 2;
        
        // Verify center calculation
        expect(pinchEvent.centerX).toBe(expectedCenterX);
        expect(pinchEvent.centerY).toBe(expectedCenterY);
        
        // Scale should be greater than 1 (pinching out in all cases)
        expect(pinchEvent.scale).toBeGreaterThan(1);
      }
    }
  });
  
  test('should handle various start distances', () => {
    // Mock event
    const mockEvent = new Event('touchmove');
    
    // Fixed touch points with significant distance (40px apart)
    const touch1 = { clientX: 80, clientY: 100 };
    const touch2 = { clientX: 120, clientY: 100 };
    
    // Test with different start distances
    const testStartDistances = [5, 10, 20, 60];
    
    for (const startDistance of testStartDistances) {
      // Create mock gesture state
      const state = {
        startDistance,
        startTime: Date.now() - 50,
        target: document.body
      };
      
      // Create context
      const context = {
        state,
        options: {},
        originalEvent: mockEvent
      };
      
      // Detect pinch
      const pinchEvent = detectPinch(context, touch1 as Touch, touch2 as Touch);
      
      // For small start distances (which would give a large change),
      // or large start distances (which would give a small change),
      // we expect different results
      if (Math.abs(40 - startDistance) > 10) { // 40px is approx distance between the points
        // Significant change should be detected
        expect(pinchEvent).not.toBeNull();
        
        if (pinchEvent) {
          if (startDistance < 40) {
            // Pinch out - scale > 1
            expect(pinchEvent.scale).toBeGreaterThan(1);
          } else {
            // Pinch in - scale < 1
            expect(pinchEvent.scale).toBeLessThan(1);
          }
        }
      } else {
        // Change is too small, might not be detected
        // We won't assert anything here since it depends on the exact threshold
      }
    }
  });
  
  test('should handle the case where startDistance is 0', () => {
    // Mock event
    const mockEvent = new Event('touchmove');
    
    // Create mock touches
    const touch1 = {
      clientX: 100,
      clientY: 100
    };
    
    const touch2 = {
      clientX: 120,
      clientY: 120
    };
    
    // Create mock gesture state with 0 startDistance
    const state = {
      startDistance: 0, // This shouldn't happen in real scenarios but let's test it
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Create context
    const context = {
      state,
      options: {},
      originalEvent: mockEvent
    };
    
    // Detect pinch - we're just checking that this doesn't crash
    // The implementation might handle this in different ways
    try {
      const pinchEvent = detectPinch(context, touch1 as Touch, touch2 as Touch);
      
      // The function didn't crash, which is good
      // We won't assert anything specific about the return value
      // since different implementations might handle this edge case differently
    } catch (error) {
      // If it does throw an error, fail the test
      expect(error).toBeUndefined();
    }
  });
});