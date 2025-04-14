// test/core/compose/features/text.test.ts
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { withText } from '../../../../src/core/compose/features/text';
import '../../../setup'; // Import the jsdom setup

// Keep track of parameters passed to createText
let lastCreateTextElement;
let lastCreateTextConfig;

// Mock text manager methods
const mockSetText = mock(function(text) { return this; });
const mockGetText = mock(() => 'Test text');
const mockGetElement = mock(() => document.createElement('span'));

// Use Bun's mock functionality
mock.module('../../../../src/core/build/text', () => {
  return {
    createText: (element, config) => {
      // Store parameters for test inspection
      lastCreateTextElement = element;
      lastCreateTextConfig = config;
      
      // Return text manager interface
      return {
        setText: mockSetText,
        getText: mockGetText,
        getElement: mockGetElement
      };
    }
  };
});

describe('withText', () => {
  let component;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    component = {
      element: document.createElement('div'),
      getClass: (name) => `mtrl-${name}`
    };
    
    // Reset state
    lastCreateTextElement = null;
    lastCreateTextConfig = null;
    
    // Reset mocks
    mockSetText.mockClear();
    mockGetText.mockClear();
    mockGetElement.mockClear();
  });
  
  test('should add text manager to component', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button'
    };
    
    const enhanced = withText(config)(component);
    
    expect(enhanced.text).toBeDefined();
    expect(typeof enhanced.text.setText).toBe('function');
    expect(typeof enhanced.text.getText).toBe('function');
    expect(typeof enhanced.text.getElement).toBe('function');
  });
  
  test('should pass correct parameters to createText', () => {
    const config = {
      prefix: 'custom',
      componentName: 'checkbox'
    };
    
    withText(config)(component);
    
    // Check that correct parameters were passed to createText
    expect(lastCreateTextElement).toBe(component.element);
    expect(lastCreateTextConfig).toBeDefined();
    expect(lastCreateTextConfig.prefix).toBe('custom');
    expect(lastCreateTextConfig.type).toBe('checkbox');
  });
  
  test('should use componentName from config for text type', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button'
    };
    
    withText(config)(component);
    
    expect(lastCreateTextConfig.type).toBe('button');
  });
  
  test('should fallback to "component" if componentName is missing', () => {
    const config = {
      prefix: 'mtrl'
    };
    
    withText(config)(component);
    
    expect(lastCreateTextConfig.type).toBe('component');
  });
  
  test('should set initial text if provided in config', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button',
      text: 'Initial text'
    };
    
    withText(config)(component);
    
    expect(mockSetText).toHaveBeenCalledTimes(1);
    expect(mockSetText).toHaveBeenCalledWith('Initial text');
  });
  
  test('should not set text if not provided in config', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button'
    };
    
    withText(config)(component);
    
    expect(mockSetText).toHaveBeenCalledTimes(0);
  });
  
  test('should pass text manager methods directly to component', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button'
    };
    
    const enhanced = withText(config)(component);
    
    // Call text methods on the enhanced component
    enhanced.text.setText('New text');
    enhanced.text.getText();
    enhanced.text.getElement();
    
    // Verify the mock functions were called
    expect(mockSetText).toHaveBeenCalledTimes(1);
    expect(mockSetText).toHaveBeenCalledWith('New text');
    expect(mockGetText).toHaveBeenCalledTimes(1);
    expect(mockGetElement).toHaveBeenCalledTimes(1);
  });
});