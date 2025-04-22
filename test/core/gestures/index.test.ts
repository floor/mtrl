// test/core/gestures/index.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';

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

// Mock functions for gesture detectors
// Instead of overriding imported modules, let's use mock implementations
const mockCreateGestureManager = mock(() => ({
  on: () => ({}),
  off: () => ({}),
  isSupported: () => true,
  enable: () => ({}),
  disable: () => ({}),
  destroy: () => {}
}));

const mockDetectTap = mock(() => ({ type: 'tap' }));
const mockDetectSwipe = mock(() => ({ type: 'swipe' }));
const mockGetSwipeDirection = mock(() => 'left');
const mockDetectLongPress = mock(() => () => {});
const mockShouldCancelLongPress = mock(() => false);
const mockDetectPan = mock(() => ({ type: 'pan' }));
const mockDetectPinch = mock(() => ({ type: 'pinch' }));
const mockDetectRotate = mock(() => ({ type: 'rotate' }));

// Mock the modules (using a different approach from jest.mock)
import * as GestureModule from '../../../src/core/gestures/index';

// Test the exports of the module without trying to override its functions
describe('Gestures Module', () => {
  test('should export the createGestureManager function', () => {
    expect(GestureModule.createGestureManager).toBeDefined();
    expect(typeof GestureModule.createGestureManager).toBe('function');
  });
  
  test('should export gesture type constants', () => {
    expect(GestureModule.GESTURE_TYPES).toBeDefined();
    expect(GestureModule.GESTURE_TYPES.TAP).toBe('tap');
    expect(GestureModule.GESTURE_TYPES.SWIPE).toBe('swipe');
    expect(GestureModule.GESTURE_TYPES.LONG_PRESS).toBe('longpress');
    expect(GestureModule.GESTURE_TYPES.PAN).toBe('pan');
    expect(GestureModule.GESTURE_TYPES.PINCH).toBe('pinch');
    expect(GestureModule.GESTURE_TYPES.ROTATE).toBe('rotate');
  });
  
  test('should export swipe direction constants', () => {
    expect(GestureModule.SWIPE_DIRECTIONS).toBeDefined();
    expect(GestureModule.SWIPE_DIRECTIONS.UP).toBe('up');
    expect(GestureModule.SWIPE_DIRECTIONS.DOWN).toBe('down');
    expect(GestureModule.SWIPE_DIRECTIONS.LEFT).toBe('left');
    expect(GestureModule.SWIPE_DIRECTIONS.RIGHT).toBe('right');
  });
  
  test('should export gesture detector functions', () => {
    expect(GestureModule.detectTap).toBeDefined();
    expect(typeof GestureModule.detectTap).toBe('function');
    
    expect(GestureModule.detectSwipe).toBeDefined();
    expect(typeof GestureModule.detectSwipe).toBe('function');
    
    expect(GestureModule.detectLongPress).toBeDefined();
    expect(typeof GestureModule.detectLongPress).toBe('function');
    
    expect(GestureModule.detectPan).toBeDefined();
    expect(typeof GestureModule.detectPan).toBe('function');
    
    expect(GestureModule.detectPinch).toBeDefined();
    expect(typeof GestureModule.detectPinch).toBe('function');
    
    expect(GestureModule.detectRotate).toBeDefined();
    expect(typeof GestureModule.detectRotate).toBe('function');
  });
  
  test('should create a gesture manager', () => {
    const element = document.createElement('div');
    // Instead of using our mock implementation, test the real one
    const manager = GestureModule.createGestureManager(element);
    
    expect(manager).toBeDefined();
    expect(typeof manager.on).toBe('function');
    expect(typeof manager.off).toBe('function');
    expect(typeof manager.isSupported).toBe('function');
    expect(typeof manager.enable).toBe('function');
    expect(typeof manager.disable).toBe('function');
    expect(typeof manager.destroy).toBe('function');
  });
  
  test('should correctly re-export all types from types.ts', () => {
    // We can't directly test TypeScript types at runtime,
    // but we can test that the module shape is as expected
    
    // Check that the module has type exports (structural test)
    const moduleKeys = Object.keys(GestureModule);
    
    // Verify key gesture-related exports are included
    expect(moduleKeys).toContain('createGestureManager');
    expect(moduleKeys).toContain('GESTURE_TYPES');
    expect(moduleKeys).toContain('SWIPE_DIRECTIONS');
    expect(moduleKeys).toContain('detectTap');
    expect(moduleKeys).toContain('detectSwipe');
    expect(moduleKeys).toContain('detectLongPress');
    expect(moduleKeys).toContain('detectPan');
    expect(moduleKeys).toContain('detectPinch');
    expect(moduleKeys).toContain('detectRotate');
  });
});