// test/core/compose/features/text.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { withText } from '../../../../src/core/compose/features/text';
import '../../../setup'; // Import the jsdom setup

describe('withText', () => {
  let component;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    component = {
      element: document.createElement('div'),
      getClass: (name) => `mtrl-${name}`
    };
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
  
  test('should pass correct options to createText', () => {
    const config = {
      prefix: 'custom',
      componentName: 'checkbox'
    };
    
    const enhanced = withText(config)(component);
    
    const textElement = enhanced.text.getElement();
    expect(textElement).toBeNull(); // Should be null until text is set
  });
  
  test('should use componentName as type if provided', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button',
      text: 'Test'
    };
    
    const enhanced = withText(config)(component);
    
    const textElement = enhanced.text.getElement();
    expect(textElement).not.toBeNull();
    expect(textElement.className).toBe('mtrl-button-text');
  });
  
  test('should use "component" as default type if componentName not provided', () => {
    const config = {
      prefix: 'mtrl',
      text: 'Test'
    };
    
    const enhanced = withText(config)(component);
    
    const textElement = enhanced.text.getElement();
    expect(textElement).not.toBeNull();
    expect(textElement.className).toBe('mtrl-component-text');
  });
  
  test('should pass correct parameters to createText', () => {
    const config = {
      prefix: 'custom',
      componentName: 'checkbox',
      text: 'Test text'
    };
    
    const enhanced = withText(config)(component);
    
    const textElement = enhanced.text.getElement();
    expect(textElement).not.toBeNull();
    expect(textElement.className).toBe('custom-checkbox-text');
    expect(textElement.textContent).toBe('Test text');
  });
  
  test('should use componentName from config for text type', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button',
      text: 'Test text'
    };
    
    const enhanced = withText(config)(component);
    
    const textElement = enhanced.text.getElement();
    expect(textElement).not.toBeNull();
    expect(textElement.className).toBe('mtrl-button-text');
  });
  
  test('should fallback to "component" if componentName is missing', () => {
    const config = {
      prefix: 'mtrl',
      text: 'Test text'
    };
    
    const enhanced = withText(config)(component);
    
    const textElement = enhanced.text.getElement();
    expect(textElement).not.toBeNull();
    expect(textElement.className).toBe('mtrl-component-text');
  });
  
  test('should set initial text if provided in config', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button',
      text: 'Initial text'
    };
    
    const enhanced = withText(config)(component);
    
    expect(enhanced.text.getText()).toBe('Initial text');
    expect(enhanced.text.getElement().textContent).toBe('Initial text');
  });
  
  test('should not set text if not provided in config', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button'
    };
    
    const enhanced = withText(config)(component);
    
    expect(enhanced.text.getElement()).toBeNull();
    expect(enhanced.text.getText()).toBe('');
  });
  
  test('should pass text manager methods directly to component', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button'
    };
    
    const enhanced = withText(config)(component);
    
    // Call text methods on the enhanced component
    enhanced.text.setText('New text');
    
    expect(enhanced.text.getText()).toBe('New text');
    expect(enhanced.text.getElement().textContent).toBe('New text');
  });
});