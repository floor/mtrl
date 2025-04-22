// test/core/gestures/swipe.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { detectSwipe, getSwipeDirection } from '../../../src/core/gestures/swipe';
import { SWIPE_DIRECTIONS } from '../../../src/core/gestures/types';

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

describe('Swipe Gesture Detection', () => {
  describe('getSwipeDirection', () => {
    test('should detect horizontal swipe directions correctly', () => {
      // Right swipe
      expect(getSwipeDirection(50, 10)).toBe(SWIPE_DIRECTIONS.RIGHT);
      
      // Left swipe
      expect(getSwipeDirection(-50, 10)).toBe(SWIPE_DIRECTIONS.LEFT);
    });
    
    test('should detect vertical swipe directions correctly', () => {
      // Down swipe
      expect(getSwipeDirection(10, 50)).toBe(SWIPE_DIRECTIONS.DOWN);
      
      // Up swipe
      expect(getSwipeDirection(10, -50)).toBe(SWIPE_DIRECTIONS.UP);
    });
    
    test('should prioritize the direction with greater magnitude when equal', () => {
      // Based on the implementation, when both directions have equal magnitude,
      // the comparison won't be strictly greater, so vertical direction is chosen
      expect(getSwipeDirection(50, 50)).toBe(SWIPE_DIRECTIONS.DOWN);
      expect(getSwipeDirection(-50, -50)).toBe(SWIPE_DIRECTIONS.UP);
      
      // With very slightly greater horizontal movement, horizontal direction is chosen
      expect(getSwipeDirection(50.1, 50)).toBe(SWIPE_DIRECTIONS.RIGHT);
      expect(getSwipeDirection(-50.1, -50)).toBe(SWIPE_DIRECTIONS.LEFT);
    });
    
    test('should detect the primary direction when movement is in both axes', () => {
      // Diagonal movement with greater horizontal component
      expect(getSwipeDirection(100, 50)).toBe(SWIPE_DIRECTIONS.RIGHT);
      expect(getSwipeDirection(-100, 50)).toBe(SWIPE_DIRECTIONS.LEFT);
      
      // Diagonal movement with greater vertical component
      expect(getSwipeDirection(50, 100)).toBe(SWIPE_DIRECTIONS.DOWN);
      expect(getSwipeDirection(50, -100)).toBe(SWIPE_DIRECTIONS.UP);
    });
  });
  
  describe('detectSwipe', () => {
    test('should detect a swipe gesture when criteria are met', () => {
      // Mock event
      const mockEvent = new Event('touchend');
      
      // Create mock gesture state with sufficient movement and time
      const state = {
        startX: 100,
        startY: 100,
        currentX: 200, // 100px movement on X axis
        currentY: 120, // 20px movement on Y axis
        startTime: Date.now() - 200, // 200ms ago
        target: document.body
      };
      
      // Create mock options with appropriate thresholds
      const options = {
        swipeThreshold: 50, // 50px minimum distance
        swipeTimeThreshold: 300 // 300ms maximum duration
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: mockEvent
      };
      
      // Detect swipe
      const swipeEvent = detectSwipe(context);
      
      // Verify results
      expect(swipeEvent).not.toBeNull();
      if (swipeEvent) {
        expect(swipeEvent.type).toBe('swipe');
        expect(swipeEvent.direction).toBe(SWIPE_DIRECTIONS.RIGHT);
        expect(swipeEvent.deltaX).toBe(100);
        expect(swipeEvent.deltaY).toBe(20);
        expect(swipeEvent.distance).toBeCloseTo(Math.sqrt(100*100 + 20*20), 1);
        expect(swipeEvent.velocity).toBeGreaterThan(0);
        expect(swipeEvent.startX).toBe(state.startX);
        expect(swipeEvent.startY).toBe(state.startY);
        expect(swipeEvent.endX).toBe(state.currentX);
        expect(swipeEvent.endY).toBe(state.currentY);
      }
    });
    
    test('should not detect a swipe if distance is below threshold', () => {
      // Mock event
      const mockEvent = new Event('touchend');
      
      // Create mock gesture state with insufficient movement
      const state = {
        startX: 100,
        startY: 100,
        currentX: 120, // Only 20px movement
        currentY: 105, // Only 5px movement
        startTime: Date.now() - 200, // 200ms ago
        target: document.body
      };
      
      // Create mock options with higher threshold than movement
      const options = {
        swipeThreshold: 50, // 50px minimum distance
        swipeTimeThreshold: 300 // 300ms maximum duration
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: mockEvent
      };
      
      // Detect swipe
      const swipeEvent = detectSwipe(context);
      
      // Verify no swipe was detected
      expect(swipeEvent).toBeNull();
    });
    
    test('should not detect a swipe if time exceeds threshold', () => {
      // Mock event
      const mockEvent = new Event('touchend');
      
      // Create mock gesture state with sufficient movement but too much time
      const state = {
        startX: 100,
        startY: 100,
        currentX: 200, // 100px movement on X axis
        currentY: 120, // 20px movement on Y axis
        startTime: Date.now() - 500, // 500ms ago (too slow)
        target: document.body
      };
      
      // Create mock options
      const options = {
        swipeThreshold: 50, // 50px minimum distance
        swipeTimeThreshold: 300 // 300ms maximum duration
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: mockEvent
      };
      
      // Detect swipe
      const swipeEvent = detectSwipe(context);
      
      // Verify no swipe was detected
      expect(swipeEvent).toBeNull();
    });
    
    test('should detect different swipe directions', () => {
      // Mock event
      const mockEvent = new Event('touchend');
      
      // Base timing and thresholds 
      const startTime = Date.now() - 200; // 200ms ago
      const options = {
        swipeThreshold: 50, // 50px minimum distance
        swipeTimeThreshold: 300 // 300ms maximum duration
      };
      
      // Test cases for different directions
      const testCases = [
        {
          state: {
            startX: 100,
            startY: 100,
            currentX: 200, // Right swipe
            currentY: 100,
            startTime,
            target: document.body
          },
          expectedDirection: SWIPE_DIRECTIONS.RIGHT
        },
        {
          state: {
            startX: 100,
            startY: 100,
            currentX: 0, // Left swipe
            currentY: 100,
            startTime,
            target: document.body
          },
          expectedDirection: SWIPE_DIRECTIONS.LEFT
        },
        {
          state: {
            startX: 100,
            startY: 100,
            currentX: 100,
            currentY: 200, // Down swipe
            startTime,
            target: document.body
          },
          expectedDirection: SWIPE_DIRECTIONS.DOWN
        },
        {
          state: {
            startX: 100,
            startY: 100,
            currentX: 100,
            currentY: 0, // Up swipe
            startTime,
            target: document.body
          },
          expectedDirection: SWIPE_DIRECTIONS.UP
        }
      ];
      
      for (const testCase of testCases) {
        // Create context
        const context = {
          state: testCase.state,
          options,
          originalEvent: mockEvent
        };
        
        // Detect swipe
        const swipeEvent = detectSwipe(context);
        
        // Verify results
        expect(swipeEvent).not.toBeNull();
        if (swipeEvent) {
          expect(swipeEvent.direction).toBe(testCase.expectedDirection);
        }
      }
    });
    
    test('should calculate velocity correctly', () => {
      // Mock event
      const mockEvent = new Event('touchend');
      
      // Create mock gesture state with known distance and time
      const distance = 100; // 100px movement
      const elapsedTime = 200; // 200ms
      const startTime = Date.now() - elapsedTime;
      
      const state = {
        startX: 100,
        startY: 100,
        currentX: 200, // 100px movement on X axis
        currentY: 100, // No movement on Y axis
        startTime,
        target: document.body
      };
      
      // Create mock options
      const options = {
        swipeThreshold: 50,
        swipeTimeThreshold: 300
      };
      
      // Create context
      const context = {
        state,
        options,
        originalEvent: mockEvent
      };
      
      // Detect swipe
      const swipeEvent = detectSwipe(context);
      
      // Verify velocity calculation
      expect(swipeEvent).not.toBeNull();
      if (swipeEvent) {
        // Expected velocity is distance/time in px/ms
        // With some tolerance for timing variations
        const expectedVelocity = distance / elapsedTime;
        expect(swipeEvent.velocity).toBeCloseTo(expectedVelocity, 1);
      }
    });
  });
});