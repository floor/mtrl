// test/core/compose/features/ripple.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { withText } from '../../../../src/core/compose/features/text';
import '../../../setup'; // Import the jsdom setup

describe('withText (additional tests)', () => {
  let component;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    component = {
      element: document.createElement('div'),
      getClass: (name) => `mtrl-${name}`
    };
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
    
    const textElement = enhanced.text.getElement();
    expect(textElement).not.toBeNull();
    expect(textElement.textContent).toBe('Initial text');
  });
  
  test('should not set text if not provided in config', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'button'
    };
    
    const enhanced = withText(config)(component);
    
    expect(enhanced.text.getElement()).toBeNull();
  });
  
  test('should pass correct options to createText', () => {
    const config = {
      prefix: 'custom-prefix',
      componentName: 'custom-component',
      text: 'Test text'
    };
    
    const enhanced = withText(config)(component);
    
    const textElement = enhanced.text.getElement();
    expect(textElement).not.toBeNull();
    expect(textElement.className).toBe('custom-prefix-custom-component-text');
    expect(textElement.textContent).toBe('Test text');
  });
  
  test('should use componentName as type if provided', () => {
    const config = {
      prefix: 'mtrl',
      componentName: 'custom-component',
      text: 'Test'
    };
    
    const enhanced = withText(config)(component);
    
    const textElement = enhanced.text.getElement();
    expect(textElement).not.toBeNull();
    expect(textElement.className).toBe('mtrl-custom-component-text');
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
});