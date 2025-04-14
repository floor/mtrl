// test/core/compose/features/lifecycle.test.ts
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { withLifecycle } from '../../../../src/core/compose/features/lifecycle';
import '../../../setup'; // Import the jsdom setup

// Create Bun mocks for emitter functions
const mockOn = mock(function(event, handler) {
  // Store the handler in an array for testing
  if (!this.handlers) this.handlers = {};
  if (!this.handlers[event]) this.handlers[event] = [];
  this.handlers[event].push(handler);
  
  // Return an unsubscribe function
  return () => {
    if (this.handlers?.[event]) {
      this.handlers[event] = this.handlers[event].filter(h => h !== handler);
    }
  };
});

const mockEmit = mock(function(event, ...args) {
  // Call the stored handlers
  if (this.handlers?.[event]) {
    this.handlers[event].forEach(handler => handler(...args));
  }
});

const mockClear = mock(function() {
  // Clear all handlers
  this.handlers = {};
});

// Shared emitter instance for testing
const emitterInstance = {
  handlers: {},
  on: mockOn,
  emit: mockEmit,
  clear: mockClear
};

// Mock the emitter module
mock.module('../../../../src/core/state/emitter', () => ({
  createEmitter: () => emitterInstance
}));

describe('withLifecycle', () => {
  let component;
  let textElement;
  let iconElement;
  let removeCalls;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    removeCalls = [];
    
    // Reset the handlers on the shared emitter instance
    emitterInstance.handlers = {};
    
    // Create elements with tracking remove method
    const removeFunction = mock(function() {
      removeCalls.push(this.tagName.toLowerCase());
    });
    
    // Create component element
    const element = document.createElement('div');
    element.remove = removeFunction;
    
    // Create text element
    textElement = document.createElement('span');
    textElement.remove = removeFunction;
    
    // Create icon element
    iconElement = document.createElement('span');
    iconElement.remove = removeFunction;
    
    // Create component with elements
    component = {
      element: element,
      events: {
        destroy: mock(() => { removeCalls.push('events'); })
      },
      text: {
        getElement: () => textElement
      },
      icon: {
        getElement: () => iconElement
      }
    };
    
    // Reset mocks
    mockOn.mockClear();
    mockEmit.mockClear();
    mockClear.mockClear();
    removeFunction.mockClear();
    component.events.destroy.mockClear();
  });
  
  test('should add lifecycle methods to component', () => {
    const enhanced = withLifecycle()(component);
    
    expect(enhanced.lifecycle).toBeDefined();
    expect(typeof enhanced.lifecycle.mount).toBe('function');
    expect(typeof enhanced.lifecycle.unmount).toBe('function');
    expect(typeof enhanced.lifecycle.isMounted).toBe('function');
    expect(typeof enhanced.lifecycle.destroy).toBe('function');
    expect(typeof enhanced.lifecycle.onMount).toBe('function');
    expect(typeof enhanced.lifecycle.onUnmount).toBe('function');
  });
  
  test('mount should fire onMount handler', () => {
    const enhanced = withLifecycle()(component);
    const mountHandler = mock(() => { removeCalls.push('mount-handler'); });
    
    enhanced.lifecycle.onMount(mountHandler);
    enhanced.lifecycle.mount();
    
    expect(mockEmit).toHaveBeenCalledWith('mount');
    expect(mountHandler).toHaveBeenCalled();
    expect(removeCalls).toContain('mount-handler');
  });
  
  test('unmount should fire onUnmount handler', () => {
    const enhanced = withLifecycle()(component);
    const unmountHandler = mock(() => { removeCalls.push('unmount-handler'); });
    
    enhanced.lifecycle.onUnmount(unmountHandler);
    enhanced.lifecycle.mount();
    enhanced.lifecycle.unmount();
    
    expect(mockEmit).toHaveBeenCalledWith('unmount');
    expect(unmountHandler).toHaveBeenCalled();
    expect(removeCalls).toContain('unmount-handler');
    expect(mockClear).toHaveBeenCalled();
  });
  
  test('isMounted should return correct state', () => {
    const enhanced = withLifecycle()(component);
    
    expect(enhanced.lifecycle.isMounted()).toBe(false);
    
    enhanced.lifecycle.mount();
    expect(enhanced.lifecycle.isMounted()).toBe(true);
    
    enhanced.lifecycle.unmount();
    expect(enhanced.lifecycle.isMounted()).toBe(false);
  });
  
  test('destroy should clean up resources', () => {
    const enhanced = withLifecycle()(component);
    
    enhanced.lifecycle.mount();
    enhanced.lifecycle.destroy();
    
    // Should have called events.destroy
    expect(component.events.destroy).toHaveBeenCalled();
    
    // Should have removed elements
    expect(removeCalls).toContain('span'); // for text and icon elements
    expect(removeCalls).toContain('div'); // for component element
  });
  
  test('destroy should call unmount if mounted', () => {
    const enhanced = withLifecycle()(component);
    const unmountHandler = mock(() => { removeCalls.push('unmount-handler'); });
    
    enhanced.lifecycle.onUnmount(unmountHandler);
    enhanced.lifecycle.mount();
    enhanced.lifecycle.destroy();
    
    expect(unmountHandler).toHaveBeenCalled();
    expect(removeCalls).toContain('unmount-handler');
  });
  
  test('multiple mount calls should only trigger once', () => {
    const enhanced = withLifecycle()(component);
    const mountHandler = mock(() => { removeCalls.push('mount-handler'); });
    
    enhanced.lifecycle.onMount(mountHandler);
    enhanced.lifecycle.mount();
    enhanced.lifecycle.mount();
    enhanced.lifecycle.mount();
    
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mountHandler).toHaveBeenCalledTimes(1);
    expect(removeCalls.filter(call => call === 'mount-handler').length).toBe(1);
  });
  
  test('unmount should not trigger if not mounted', () => {
    const enhanced = withLifecycle()(component);
    const unmountHandler = mock(() => { removeCalls.push('unmount-handler'); });
    
    enhanced.lifecycle.onUnmount(unmountHandler);
    enhanced.lifecycle.unmount();
    
    expect(mockEmit).not.toHaveBeenCalledWith('unmount');
    expect(unmountHandler).not.toHaveBeenCalled();
    expect(removeCalls).not.toContain('unmount-handler');
  });
  
  test('onMount return value should unsubscribe handler', () => {
    const enhanced = withLifecycle()(component);
    const mountHandler = mock(() => { removeCalls.push('mount-handler'); });
    
    const unsubscribe = enhanced.lifecycle.onMount(mountHandler);
    unsubscribe();
    
    enhanced.lifecycle.mount();
    
    expect(mountHandler).not.toHaveBeenCalled();
    expect(removeCalls).not.toContain('mount-handler');
  });
});