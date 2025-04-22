// test/core/gestures/tap.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { detectTap } from '../../../src/core/gestures/tap';

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

describe('Tap Gesture Detection', () => {
  test('should detect a simple tap', () => {
    // Mock event
    const mockEvent = new Event('touchend');
    
    // Create mock gesture state with minimal movement
    const state = {
      startX: 100,
      startY: 100,
      currentX: 102, // Just 2px movement
      currentY: 101, // Just 1px movement
      startTime: Date.now() - 50, // 50ms ago
      target: document.body,
      lastTapTime: 0, // No previous tap
      tapCount: 0
    };
    
    // Create mock options
    const options = {
      tapDistanceThreshold: 10 // 10px threshold
    };
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect tap
    const tapEvent = detectTap(context);
    
    // Verify results
    expect(tapEvent).not.toBeNull();
    if (tapEvent) {
      expect(tapEvent.type).toBe('tap');
      expect(tapEvent.count).toBe(1); // First tap
      expect(tapEvent.x).toBe(state.currentX);
      expect(tapEvent.y).toBe(state.currentY);
    }
  });
  
  test('should detect a double tap', () => {
    // Mock event
    const mockEvent = new Event('touchend');
    
    // Create mock gesture state for a second tap
    const state = {
      startX: 100,
      startY: 100,
      currentX: 102, // Just 2px movement
      currentY: 101, // Just 1px movement
      startTime: Date.now() - 50, // 50ms ago
      target: document.body,
      lastTapTime: Date.now() - 250, // 250ms ago (within double tap threshold)
      tapCount: 1 // Already had one tap
    };
    
    // Create mock options
    const options = {
      tapDistanceThreshold: 10 // 10px threshold
    };
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect tap
    const tapEvent = detectTap(context);
    
    // Verify results
    expect(tapEvent).not.toBeNull();
    if (tapEvent) {
      expect(tapEvent.type).toBe('tap');
      expect(tapEvent.count).toBe(2); // Double tap
      expect(tapEvent.x).toBe(state.currentX);
      expect(tapEvent.y).toBe(state.currentY);
    }
  });
  
  test('should not detect a tap if movement exceeds threshold', () => {
    // Mock event
    const mockEvent = new Event('touchend');
    
    // Create mock gesture state with too much movement
    const state = {
      startX: 100,
      startY: 100,
      currentX: 120, // 20px movement
      currentY: 110, // 10px movement
      startTime: Date.now() - 50,
      target: document.body,
      lastTapTime: 0,
      tapCount: 0
    };
    
    // Create mock options
    const options = {
      tapDistanceThreshold: 10 // 10px threshold
    };
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect tap
    const tapEvent = detectTap(context);
    
    // Verify no tap was detected
    expect(tapEvent).toBeNull();
  });
  
  test('should not consider it a double tap if too much time has passed', () => {
    // Mock event
    const mockEvent = new Event('touchend');
    
    // Create mock gesture state with previous tap too long ago
    const state = {
      startX: 100,
      startY: 100,
      currentX: 102,
      currentY: 101,
      startTime: Date.now() - 50,
      target: document.body,
      lastTapTime: Date.now() - 500, // 500ms ago (exceeds double tap threshold)
      tapCount: 1
    };
    
    // Create mock options
    const options = {
      tapDistanceThreshold: 10
    };
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect tap
    const tapEvent = detectTap(context);
    
    // Verify it's considered a new single tap, not a double tap
    expect(tapEvent).not.toBeNull();
    if (tapEvent) {
      expect(tapEvent.count).toBe(1); // Reset to 1, not 2
    }
  });
  
  test('should handle edge case of perfect tap with no movement', () => {
    // Mock event
    const mockEvent = new Event('touchend');
    
    // Create mock gesture state with zero movement (perfect tap)
    const state = {
      startX: 100,
      startY: 100,
      currentX: 100, // No movement
      currentY: 100, // No movement
      startTime: Date.now() - 50,
      target: document.body,
      lastTapTime: 0,
      tapCount: 0
    };
    
    // Create mock options
    const options = {
      tapDistanceThreshold: 10
    };
    
    // Create context
    const context = {
      state,
      options,
      originalEvent: mockEvent
    };
    
    // Detect tap
    const tapEvent = detectTap(context);
    
    // Verify tap was detected
    expect(tapEvent).not.toBeNull();
    if (tapEvent) {
      expect(tapEvent.type).toBe('tap');
      
      // Distance should be 0
      const deltaX = state.currentX - state.startX;
      const deltaY = state.currentY - state.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      expect(distance).toBe(0);
    }
  });
});