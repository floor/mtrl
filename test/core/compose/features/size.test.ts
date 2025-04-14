// test/core/compose/features/size.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { withSize } from '../../../../src/core/compose/features/size';
import { PREFIX } from '../../../../src/core/config';
import '../../../setup'; // Import the jsdom setup

describe('withSize', () => {
  let component;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    component = {
      element: document.createElement('div'),
      getClass: (name) => `${PREFIX}-${name}`
    };
  });
  
  test('should not add size class if size is not provided', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'button'
    };
    
    const enhanced = withSize(config)(component);
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--small`)).toBe(false);
    expect(enhanced.element.classList.contains(`${PREFIX}-button--large`)).toBe(false);
  });
  
  test('should add size class when size is provided', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'button',
      size: 'small'
    };
    
    const enhanced = withSize(config)(component);
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--small`)).toBe(true);
  });
  
  test('should handle various size values', () => {
    const sizes = ['small', 'medium', 'large', 'xl', 'mini'];
    
    sizes.forEach(size => {
      // Create fresh component for each test
      const testComponent = {
        element: document.createElement('div'),
        getClass: (name) => `${PREFIX}-${name}`
      };
      
      const config = {
        prefix: PREFIX,
        componentName: 'button',
        size
      };
      
      const enhanced = withSize(config)(testComponent);
      
      expect(enhanced.element.classList.contains(`${PREFIX}-button--${size}`)).toBe(true);
    });
  });
  
  test('should not modify component if element is missing', () => {
    const componentWithoutElement = {
      getClass: (name) => `${PREFIX}-${name}`
    };
    
    const config = {
      prefix: PREFIX,
      componentName: 'button',
      size: 'large'
    };
    
    const enhanced = withSize(config)(componentWithoutElement);
    
    // Should return the same component
    expect(enhanced).toBe(componentWithoutElement);
  });
  
  test('should respect prefix in class name', () => {
    const customPrefix = 'custom';
    
    const config = {
      prefix: customPrefix,
      componentName: 'button',
      size: 'small'
    };
    
    const enhanced = withSize(config)(component);
    
    expect(enhanced.element.classList.contains(`${customPrefix}-button--small`)).toBe(true);
    expect(enhanced.element.classList.contains(`${PREFIX}-button--small`)).toBe(false);
  });
  
  test('should handle dynamic component names', () => {
    const componentNames = ['button', 'checkbox', 'switch', 'radio'];
    
    componentNames.forEach(componentName => {
      // Create fresh component for each test
      const testComponent = {
        element: document.createElement('div'),
        getClass: (name) => `${PREFIX}-${name}`
      };
      
      const config = {
        prefix: PREFIX,
        componentName,
        size: 'large'
      };
      
      const enhanced = withSize(config)(testComponent);
      
      expect(enhanced.element.classList.contains(`${PREFIX}-${componentName}--large`)).toBe(true);
    });
  });
});