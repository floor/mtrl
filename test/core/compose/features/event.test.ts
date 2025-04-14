// test/core/compose/features/events.test.ts
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { withEvents } from '../../../../src/core/compose/features/events';
import '../../../setup'; // Import the jsdom setup

// Create proper mock functions using Bun's mock 
const mockOn = mock(function(event, handler) { 
  // Return this for chaining in real implementation
  return this; 
});

const mockOff = mock(function(event, handler) {
  // Return this for chaining in real implementation
  return this;
});

const mockEmit = mock(function(event, data) {
  // Return this for chaining in real implementation
  return this;
});

const mockClear = mock(() => {});

// Mock the createEmitter function
mock.module('../../../../src/core/state/emitter', () => ({
  createEmitter: () => ({
    on: mockOn,
    off: mockOff,
    emit: mockEmit,
    clear: mockClear
  })
}));

describe('withEvents', () => {
  let component;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    component = {
      element: document.createElement('div'),
      getClass: (name) => `mtrl-${name}`
    };
    
    // Reset mocks
    mockOn.mockClear();
    mockOff.mockClear();
    mockEmit.mockClear();
    mockClear.mockClear();
  });
  
  test('should add events methods to component', () => {
    const enhanced = withEvents()(component);
    
    expect(enhanced.on).toBeDefined();
    expect(enhanced.off).toBeDefined();
    expect(enhanced.emit).toBeDefined();
    expect(typeof enhanced.on).toBe('function');
    expect(typeof enhanced.off).toBe('function');
    expect(typeof enhanced.emit).toBe('function');
  });
  
  test('on method should call emitter on', () => {
    const enhanced = withEvents()(component);
    const handler = () => {};
    
    enhanced.on('click', handler);
    
    expect(mockOn).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenCalledWith('click', handler);
  });
  
  test('off method should call emitter off', () => {
    const enhanced = withEvents()(component);
    const handler = () => {};
    
    enhanced.off('click', handler);
    
    expect(mockOff).toHaveBeenCalledTimes(1);
    expect(mockOff).toHaveBeenCalledWith('click', handler);
  });
  
  test('emit method should call emitter emit', () => {
    const enhanced = withEvents()(component);
    const data = { value: 'test' };
    
    enhanced.emit('change', data);
    
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenCalledWith('change', data);
  });
  
  test('on method should return the component for chaining', () => {
    const enhanced = withEvents()(component);
    const handler = () => {};
    
    const result = enhanced.on('click', handler);
    
    expect(result).toBe(enhanced);
  });
  
  test('off method should return the component for chaining', () => {
    const enhanced = withEvents()(component);
    const handler = () => {};
    
    const result = enhanced.off('click', handler);
    
    expect(result).toBe(enhanced);
  });
  
  test('emit method should return the component for chaining', () => {
    const enhanced = withEvents()(component);
    
    const result = enhanced.emit('change');
    
    expect(result).toBe(enhanced);
  });
  
  test('should integrate with lifecycle if available', () => {
    const lifecycleDestroyMock = mock(() => {});
    
    component.lifecycle = {
      destroy: lifecycleDestroyMock
    };
    
    const enhanced = withEvents()(component);
    
    // Call lifecycle destroy
    enhanced.lifecycle.destroy();
    
    // Original destroy should be called
    expect(lifecycleDestroyMock).toHaveBeenCalledTimes(1);
  });
  
  test('should handle multiple event subscriptions', () => {
    const enhanced = withEvents()(component);
    const handler1 = () => {};
    const handler2 = () => {};
    
    enhanced.on('click', handler1);
    enhanced.on('change', handler2);
    
    expect(mockOn).toHaveBeenCalledTimes(2);
    expect(mockOn).toHaveBeenCalledWith('click', handler1);
    expect(mockOn).toHaveBeenCalledWith('change', handler2);
  });
  
  test('should handle emitting events with and without data', () => {
    const enhanced = withEvents()(component);
    
    // Emit without data
    enhanced.emit('focus');
    expect(mockEmit).toHaveBeenCalledWith('focus', undefined);
    
    // Emit with data
    enhanced.emit('input', { value: 'test' });
    expect(mockEmit).toHaveBeenCalledWith('input', { value: 'test' });
  });
});