// test/core/compose/features/position.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { withPosition, POSITIONS } from '../../../../src/core/compose/features/position';
import { PREFIX } from '../../../../src/core/config';
import '../../../setup'; // Import the jsdom setup

describe('withPosition', () => {
  let component;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    component = {
      element: document.createElement('div'),
      getClass: (name) => `${PREFIX}-${name}`
    };
  });
  
  test('should not add position class if position is not provided', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'button'
    };
    
    const enhanced = withPosition(config)(component);
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--left`)).toBe(false);
    expect(enhanced.element.classList.contains(`${PREFIX}-button--right`)).toBe(false);
    expect(enhanced.position).toBeUndefined();
  });
  
  test('should add position class when position is provided', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'button',
      position: 'left'
    };
    
    const enhanced = withPosition(config)(component);
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--left`)).toBe(true);
    expect(enhanced.position).toBeDefined();
  });
  
  test('should handle enum positions (uppercase)', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'button',
      position: 'RIGHT'
    };
    
    const enhanced = withPosition(config)(component);
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--right`)).toBe(true);
    expect(enhanced.position.getPosition()).toBe('right');
  });
  
  test('should add position manager with setPosition method', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'button',
      position: 'left'
    };
    
    const enhanced = withPosition(config)(component);
    
    // Change position
    enhanced.position.setPosition('right');
    
    // Old class should be removed
    expect(enhanced.element.classList.contains(`${PREFIX}-button--left`)).toBe(false);
    
    // New class should be added
    expect(enhanced.element.classList.contains(`${PREFIX}-button--right`)).toBe(true);
  });
  
  test('should add position manager with getPosition method', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'button',
      position: 'bottom'
    };
    
    const enhanced = withPosition(config)(component);
    
    expect(enhanced.position.getPosition()).toBe('bottom');
    
    enhanced.position.setPosition('top');
    // Note: getPosition method returns initial position
    expect(enhanced.position.getPosition()).toBe('bottom');
  });
  
  test('should support all position enum values', () => {
    // Test all position values from enum
    Object.values(POSITIONS).forEach(positionValue => {
      const testComponent = {
        element: document.createElement('div'),
        getClass: (name) => `${PREFIX}-${name}`
      };
      
      const config = {
        prefix: PREFIX,
        componentName: 'tooltip',
        position: positionValue
      };
      
      const enhanced = withPosition(config)(testComponent);
      
      expect(enhanced.element.classList.contains(`${PREFIX}-tooltip--${positionValue}`)).toBe(true);
      expect(enhanced.position.getPosition()).toBe(positionValue);
    });
  });
  
  test('should allow chaining of position methods', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'dropdown',
      position: 'top'
    };
    
    const enhanced = withPosition(config)(component);
    
    // Should allow chaining
    const result = enhanced.position.setPosition('bottom');
    
    expect(result).toBe(enhanced.position);
  });
  
  test('should not add position if element is missing', () => {
    const componentWithoutElement = {
      getClass: (name) => `${PREFIX}-${name}`
    };
    
    const config = {
      prefix: PREFIX,
      componentName: 'dropdown',
      position: 'top'
    };
    
    const enhanced = withPosition(config)(componentWithoutElement);
    
    // Should just return the original component
    expect(enhanced).toBe(componentWithoutElement);
  });
});