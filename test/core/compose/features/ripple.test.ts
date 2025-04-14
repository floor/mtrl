// test/core/compose/features/text.test.ts
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { withText } from '../../../../src/core/compose/features/text';
import '../../../setup'; // Import the jsdom setup

// Mock text manager
const mockTextManager = {
  setText: mock(() => mockTextManager),
  getText: mock(() => "Mock text"),
  getElement: mock(() => document.createElement('span'))
};

// Mock the createText function in the module
let createTextOptions = null;
mock.module('../../../../src/core/build/text', () => ({
  createText: (element, options) => {
    createTextOptions = options;
    return mockTextManager;
  }
}));

describe('withText', () => {
  let component;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    component = {
      element: document.createElement('div'),
      getClass: (name) => `mtrl-${name}`
    };
    
    // Reset our mocks
    mockTextManager.setText.mockClear();
    mockTextManager.getText.mockClear();
    mockTextManager.getElement.mockClear();
    createTextOptions = null;
  });
  
  test('should add text manager to component', () => {
    const enhanced = withText({})(component);
    
    expect(enhanced.text).toBeDefined();
    expect(enhanced.text.setText).toBeDefined();
    expect(enhanced.text.getText).toBeDefined();
    expect(enhanced.text.getElement).toBeDefined();
  });
  
  test('should set text if provided in config', () => {
    const config = {
      text: 'Initial text',
      prefix: 'mtrl',
      componentName: 'button'
    };
    
    const enhanced = withText(config)(component);
    
    expect(mockTextManager.setText).toHaveBeenCalledTimes(1);
    expect(mockTextManager.setText).toHaveBeenCalledWith('Initial text');
  });
  
  test('should not set text if not provided in config', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button'
    };
    
    const enhanced = withText(config)(component);
    
    expect(mockTextManager.setText).toHaveBeenCalledTimes(0);
  });
  
  test('should pass correct options to createText', () => {
    const config = {
      prefix: 'custom-prefix',
      componentName: 'custom-component'
    };
    
    const enhanced = withText(config)(component);
    
    expect(createTextOptions).toEqual({
      prefix: 'custom-prefix',
      type: 'custom-component'
    });
  });
  
  test('should use componentName as type if provided', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'custom-component'
    };
    
    const enhanced = withText(config)(component);
    
    expect(createTextOptions.type).toBe('custom-component');
  });
  
  test('should use "component" as default type if componentName not provided', () => {
    const config = {
      prefix: 'mtrl'
    };
    
    const enhanced = withText(config)(component);
    
    expect(createTextOptions.type).toBe('component');
  });
});