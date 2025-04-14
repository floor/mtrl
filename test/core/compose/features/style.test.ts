// test/core/compose/features/style.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { withStyle } from '../../../../src/core/compose/features/style';
import { PREFIX } from '../../../../src/core/config';
import '../../../setup'; // Import the jsdom setup

describe('withStyle', () => {
  let component;
  let getClassCalls;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    getClassCalls = [];
    
    component = {
      element: document.createElement('div'),
      getClass: (name) => {
        getClassCalls.push(name);
        return `${PREFIX}-${name}`;
      }
    };
  });
  
  test('should add variant class if variant is provided', () => {
    const config = {
      variant: 'primary'
    };
    
    const enhanced = withStyle(config)(component);
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--primary`)).toBe(true);
    expect(getClassCalls).toContain('button');
  });
  
  test('should add size class if size is provided', () => {
    const config = {
      size: 'large'
    };
    
    const enhanced = withStyle(config)(component);
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--large`)).toBe(true);
  });
  
  test('should add both variant and size classes if both are provided', () => {
    const config = {
      variant: 'outlined',
      size: 'small'
    };
    
    const enhanced = withStyle(config)(component);
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--outlined`)).toBe(true);
    expect(enhanced.element.classList.contains(`${PREFIX}-button--small`)).toBe(true);
  });
  
  test('should not add classes if no style properties are provided', () => {
    const config = {};
    
    const enhanced = withStyle(config)(component);
    
    // Element should not have any classes
    expect(enhanced.element.classList.length).toBe(0);
  });
  
  test('should handle various variant values', () => {
    const variants = ['filled', 'outlined', 'elevated', 'text', 'tonal'];
    
    variants.forEach(variant => {
      // Create fresh component for each test
      const testComponent = {
        element: document.createElement('div'),
        getClass: (name) => `${PREFIX}-${name}`
      };
      
      const config = {
        variant
      };
      
      const enhanced = withStyle(config)(testComponent);
      
      expect(enhanced.element.classList.contains(`${PREFIX}-button--${variant}`)).toBe(true);
    });
  });
  
  test('should handle various size values', () => {
    const sizes = ['small', 'medium', 'large', 'xl'];
    
    sizes.forEach(size => {
      // Create fresh component for each test
      const testComponent = {
        element: document.createElement('div'),
        getClass: (name) => `${PREFIX}-${name}`
      };
      
      const config = {
        size
      };
      
      const enhanced = withStyle(config)(testComponent);
      
      expect(enhanced.element.classList.contains(`${PREFIX}-button--${size}`)).toBe(true);
    });
  });
  
  test('should use button prefix for getClass', () => {
    // Reset calls
    getClassCalls = [];
    
    const config = {
      variant: 'primary'
    };
    
    withStyle(config)(component);
    
    // Verify getClass was called with 'button'
    expect(getClassCalls).toContain('button');
  });
  
  test('should work with an empty config', () => {
    const enhanced = withStyle()(component);
    
    // Should be the same component
    expect(enhanced).toBe(component);
    // No classes should be added
    expect(enhanced.element.classList.length).toBe(0);
  });
});