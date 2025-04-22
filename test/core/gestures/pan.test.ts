// test/core/gestures/pan.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { detectPan } from '../../../src/core/gestures/pan';

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
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  
  // Clean up jsdom
  window.close();
});

// We'll test the functionality without mocking the createGestureEvent
// Instead, we'll just check the structure of the returned event

describe('Pan Gesture Detection', () => {
  test('should detect pan with significant movement', () => {
    // Mock event
    const mockEvent = new Event('mousemove');
    
    // Create mock gesture state with movement
    const state = {
      startX: 100,
      startY: 100,
      lastX: 120, // Previous position
      lastY: 110,
      currentX: 130, // Current position shows 10px additional movement
      currentY: 115,
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Create mock options
    const options = {};
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect pan
    const panEvent = detectPan(context);
    
    // Verify results
    expect(panEvent).not.toBeNull();
    if (panEvent) {
      expect(panEvent.type).toBe('pan');
      
      // Check that the deltas are calculated correctly
      // Using toBe with calculated values to avoid hardcoding expected values
      expect(panEvent.deltaX).toBe(state.currentX - state.startX);
      expect(panEvent.deltaY).toBe(state.currentY - state.startY);
      
      // Check start and current positions
      expect(panEvent.startX).toBe(state.startX);
      expect(panEvent.startY).toBe(state.startY);
      expect(panEvent.currentX).toBe(state.currentX);
      expect(panEvent.currentY).toBe(state.currentY);
      
      // Check that the original event is passed through
      expect(panEvent.originalEvent).toBe(mockEvent);
    }
  });
  
  test('should not detect pan with no movement', () => {
    // Mock event
    const mockEvent = new Event('mousemove');
    
    // Create mock gesture state with no movement since last position
    const state = {
      startX: 100,
      startY: 100,
      lastX: 130, // Same as current position
      lastY: 115,
      currentX: 130,
      currentY: 115,
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Create mock options
    const options = {};
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect pan
    const panEvent = detectPan(context);
    
    // Verify no pan was detected
    expect(panEvent).toBeNull();
  });
  
  test('should detect minimal movement', () => {
    // Mock event
    const mockEvent = new Event('mousemove');
    
    // Create mock gesture state with minimal movement
    const state = {
      startX: 100,
      startY: 100,
      lastX: 100,
      lastY: 100,
      currentX: 101, // Just 1px movement
      currentY: 100,
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Create mock options
    const options = {};
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect pan
    const panEvent = detectPan(context);
    
    // Verify pan was detected even with minimal movement
    expect(panEvent).not.toBeNull();
    if (panEvent) {
      expect(panEvent.deltaX).toBe(1);
      expect(panEvent.deltaY).toBe(0);
    }
  });
  
  test('should handle movement in negative direction', () => {
    // Mock event
    const mockEvent = new Event('mousemove');
    
    // Create mock gesture state with movement in negative direction
    const state = {
      startX: 100,
      startY: 100,
      lastX: 90,
      lastY: 90,
      currentX: 80, // Moving left
      currentY: 80, // Moving up
      startTime: Date.now() - 50,
      target: document.body
    };
    
    // Create mock options
    const options = {};
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect pan
    const panEvent = detectPan(context);
    
    // Verify results
    expect(panEvent).not.toBeNull();
    if (panEvent) {
      expect(panEvent.deltaX).toBe(-20); // Negative indicates leftward movement
      expect(panEvent.deltaY).toBe(-20); // Negative indicates upward movement
    }
  });
  
  test('should calculate movement delta accurately', () => {
    // Test cases with different movement patterns
    const testCases = [
      // Right and down movement
      {
        state: {
          startX: 100,
          startY: 100,
          lastX: 120,
          lastY: 110,
          currentX: 130,
          currentY: 120,
          startTime: Date.now() - 50,
          target: document.body
        },
        expectedDeltaX: 30,
        expectedDeltaY: 20
      },
      // Left and up movement
      {
        state: {
          startX: 100,
          startY: 100,
          lastX: 80,
          lastY: 90,
          currentX: 70,
          currentY: 80,
          startTime: Date.now() - 50,
          target: document.body
        },
        expectedDeltaX: -30,
        expectedDeltaY: -20
      },
      // Mixed direction movement
      {
        state: {
          startX: 100,
          startY: 100,
          lastX: 90,
          lastY: 110,
          currentX: 80,
          currentY: 120,
          startTime: Date.now() - 50,
          target: document.body
        },
        expectedDeltaX: -20,
        expectedDeltaY: 20
      }
    ];
    
    for (const testCase of testCases) {
      // Mock event
      const mockEvent = new Event('mousemove');
      
      // Create context
      const context = {
        state: testCase.state,
        options: {},
        originalEvent: mockEvent
      };
      
      // Detect pan
      const panEvent = detectPan(context);
      
      // Verify results
      expect(panEvent).not.toBeNull();
      if (panEvent) {
        expect(panEvent.deltaX).toBe(testCase.expectedDeltaX);
        expect(panEvent.deltaY).toBe(testCase.expectedDeltaY);
      }
    }
  });
});