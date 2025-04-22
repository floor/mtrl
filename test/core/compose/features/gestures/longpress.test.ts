// test/core/compose/features/gestures/longpress.test.ts
import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { withLongPressGesture } from '../../../../../src/core/compose/features/gestures/longpress';
import { PREFIX } from '../../../../../src/core/config';
import '../../../../setup'; // Import the jsdom setup

// Create mocks for setTimeout/clearTimeout
const mockSetTimeout = mock((callback, ms) => {
  return 123; // Return a timer ID
});

const mockClearTimeout = mock((id) => {});

// Store original functions
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

describe('withLongPressGesture', () => {
  let component;
  let emitCalls;
  let handlerCalls;
  let addEventListenerSpy;
  let removeEventListenerSpy;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    emitCalls = [];
    handlerCalls = [];
    
    // Reset mocks
    mockSetTimeout.mockClear();
    mockClearTimeout.mockClear();
    
    // Override global functions
    global.setTimeout = mockSetTimeout;
    global.clearTimeout = mockClearTimeout;
    
    // Create a component
    const element = document.createElement('div');
    
    // Create spies for event listeners
    const originalAddEventListener = element.addEventListener;
    const originalRemoveEventListener = element.removeEventListener;
    
    addEventListenerSpy = mock(function(event, handler, options) {
      return originalAddEventListener.call(this, event, handler, options);
    });
    
    removeEventListenerSpy = mock(function(event, handler) {
      return originalRemoveEventListener.call(this, event, handler);
    });
    
    // Replace methods with spies
    element.addEventListener = addEventListenerSpy;
    element.removeEventListener = removeEventListenerSpy;
    
    component = {
      element,
      emit: function() { emitCalls.push(Array.from(arguments)); },
      getClass: (name) => `${PREFIX}-${name}`,
      lifecycle: {
        destroy: mock(() => {})
      }
    };
    
    // Add to document
    document.body.appendChild(component.element);
  });
  
  afterEach(() => {
    // Restore original functions
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });
  
  test('should add long press methods to component', () => {
    const enhanced = withLongPressGesture()(component);
    
    expect(enhanced.onLongPress).toBeDefined();
    expect(enhanced.offLongPress).toBeDefined();
    expect(enhanced.enableLongPress).toBeDefined();
    expect(enhanced.disableLongPress).toBeDefined();
    expect(typeof enhanced.onLongPress).toBe('function');
    expect(typeof enhanced.offLongPress).toBe('function');
    expect(typeof enhanced.enableLongPress).toBe('function');
    expect(typeof enhanced.disableLongPress).toBe('function');
  });
  
  test('should set up event listeners by default', () => {
    withLongPressGesture()(component);
    
    // Should add mouse and touch event listeners
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), expect.any(Object));
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), expect.any(Object));
    expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function), expect.any(Object));
    expect(addEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function), expect.any(Object));
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object));
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), expect.any(Object));
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), expect.any(Object));
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function), expect.any(Object));
  });
  
  test('should not set up listeners if enabled is false', () => {
    // Reset the spy counter
    addEventListenerSpy.mockClear();
    
    withLongPressGesture({ enabled: false })(component);
    
    // Should not have added any event listeners
    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });
  
  test('should register and call long press handlers', () => {
    const enhanced = withLongPressGesture()(component);
    const handler = mock((event) => { handlerCalls.push(event); });
    
    enhanced.onLongPress(handler);
    
    // Simulate the long press sequence
    // 1. Start touch
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }] as any
    });
    component.element.dispatchEvent(touchStartEvent);
    
    // 2. Trigger the timeout callback (simulating the timer completion)
    const timeoutCallback = mockSetTimeout.mock.calls[0][0];
    timeoutCallback();
    
    // Handler should have been called
    expect(handler).toHaveBeenCalled();
    expect(handlerCalls.length).toBe(1);
    expect(handlerCalls[0].type).toBe('longpress');
    expect(emitCalls.length).toBe(1);
    expect(emitCalls[0][0]).toBe('longpress');
  });
  
  test('should allow removing long press handlers', () => {
    const enhanced = withLongPressGesture()(component);
    const handler = mock(() => {});
    
    // Add then remove the handler
    enhanced.onLongPress(handler);
    enhanced.offLongPress(handler);
    
    // Simulate the long press sequence
    // 1. Start touch
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }] as any
    });
    component.element.dispatchEvent(touchStartEvent);
    
    // 2. Trigger the timeout callback (simulating the timer completion)
    const timeoutCallback = mockSetTimeout.mock.calls[0][0];
    timeoutCallback();
    
    // Handler should not have been called
    expect(handler).not.toHaveBeenCalled();
  });
  
  test('should cancel long press if movement exceeds threshold', () => {
    const enhanced = withLongPressGesture({ moveThreshold: 5 })(component);
    const handler = mock(() => {});
    
    enhanced.onLongPress(handler);
    
    // Simulate touchstart
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }] as any
    });
    component.element.dispatchEvent(touchStartEvent);
    
    // Simulate movement beyond threshold
    const touchMoveEvent = new TouchEvent('touchmove', {
      touches: [{ clientX: 110, clientY: 110 }] as any // Move 10px in each direction
    });
    component.element.dispatchEvent(touchMoveEvent);
    
    // Trigger the timeout callback
    const timeoutCallback = mockSetTimeout.mock.calls[0][0];
    timeoutCallback();
    
    // Handler should not have been called due to movement
    expect(handler).not.toHaveBeenCalled();
  });
  
  test('should cancel long press on touchend/touchcancel', () => {
    const enhanced = withLongPressGesture()(component);
    const handler = mock(() => {});
    
    enhanced.onLongPress(handler);
    
    // Simulate touchstart
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }] as any
    });
    component.element.dispatchEvent(touchStartEvent);
    
    // Simulate touchend before timer fires
    const touchEndEvent = new TouchEvent('touchend');
    component.element.dispatchEvent(touchEndEvent);
    
    // Trigger the timeout callback
    const timeoutCallback = mockSetTimeout.mock.calls[0][0];
    timeoutCallback();
    
    // Handler should not have been called due to touchend
    expect(handler).not.toHaveBeenCalled();
    expect(mockClearTimeout).toHaveBeenCalled();
  });
  
  test('should be able to disable/enable long press recognition', () => {
    const enhanced = withLongPressGesture()(component);
    const handler = mock(() => {});
    
    enhanced.onLongPress(handler);
    
    // Disable long press
    enhanced.disableLongPress();
    
    // Simulate touchstart (should be ignored)
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }] as any
    });
    component.element.dispatchEvent(touchStartEvent);
    
    // Handler should not have been called
    expect(handler).not.toHaveBeenCalled();
    
    // Enable long press again
    enhanced.enableLongPress();
    
    // Clear mock calls
    mockSetTimeout.mockClear();
    
    // Simulate touchstart again
    component.element.dispatchEvent(touchStartEvent);
    
    // Now the timer should be set
    expect(mockSetTimeout).toHaveBeenCalledTimes(1);
  });
  
  test('should clean up on destroy', () => {
    const enhanced = withLongPressGesture()(component);
    
    // Clear the spy to make sure we're only tracking the destroy calls
    removeEventListenerSpy.mockClear();
    mockClearTimeout.mockClear();
    
    // We need to simulate a touch start to create a timer that needs clearing
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }] as any
    });
    component.element.dispatchEvent(touchStartEvent);
    
    // Verify timer was created
    expect(mockSetTimeout).toHaveBeenCalled();
    
    // Call the lifecycle destroy method
    component.lifecycle.destroy();
    
    // Should remove all event listeners
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function));
    
    // Should clear any timers
    expect(mockClearTimeout).toHaveBeenCalled();
  });
  
  test('should support method chaining', () => {
    const enhanced = withLongPressGesture()(component);
    const handler = () => {};
    
    // Add handler with chaining
    const result1 = enhanced.onLongPress(handler);
    expect(result1).toBe(enhanced);
    
    // Remove handler with chaining
    const result2 = enhanced.offLongPress(handler);
    expect(result2).toBe(enhanced);
    
    // Enable with chaining
    const result3 = enhanced.enableLongPress();
    expect(result3).toBe(enhanced);
    
    // Disable with chaining
    const result4 = enhanced.disableLongPress();
    expect(result4).toBe(enhanced);
  });
});