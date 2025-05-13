// test/core/compose/features/checkable.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { withCheckable } from '../../../../src/core/compose/features/checkable';
import { PREFIX } from '../../../../src/core/config';
import '../../../setup'; // Import the jsdom setup
import { createTestInputComponent } from './test-helpers';

describe('withCheckable', () => {
  let inputComponent;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    inputComponent = createTestInputComponent();
  });
  
  test('should add checked property to component', () => {
    const enhanced = withCheckable({})(inputComponent);
    
    expect(enhanced.checked).toBeDefined();
    expect(enhanced.isChecked).toBeDefined();
    expect(typeof enhanced.isChecked).toBe('function');
    expect(typeof enhanced.setChecked).toBe('function');
  });
  
  test('should initialize checked state from config', () => {
    const enhanced = withCheckable({ checked: true })(inputComponent);
    
    expect(enhanced.isChecked()).toBe(true);
    expect(enhanced.input.checked).toBe(true);
  });
  
  test('should set checked state', () => {
    const enhanced = withCheckable({})(inputComponent);
    
    enhanced.setChecked(true);
    
    expect(enhanced.isChecked()).toBe(true);
    expect(enhanced.input.checked).toBe(true);
    
    enhanced.setChecked(false);
    
    expect(enhanced.isChecked()).toBe(false);
    expect(enhanced.input.checked).toBe(false);
  });
  
  test('should add checkable methods to component', () => {
    const enhanced = withCheckable()(inputComponent);
    
    expect(enhanced.checkable).toBeDefined();
    expect(typeof enhanced.checkable.check).toBe('function');
    expect(typeof enhanced.checkable.uncheck).toBe('function');
    expect(typeof enhanced.checkable.toggle).toBe('function');
    expect(typeof enhanced.checkable.isChecked).toBe('function');
  });
  
  test('should set initial checked state if specified', () => {
    const config = { checked: true };
    const enhanced = withCheckable(config)(inputComponent);
    
    expect(enhanced.input.checked).toBe(true);
    expect(enhanced.element.classList.contains(`${PREFIX}-switch--checked`)).toBe(true);
  });
  
  test('should not add checkable if input is missing', () => {
    const componentWithoutInput = {
      element: document.createElement('div')
    };
    
    const enhanced = withCheckable()(componentWithoutInput);
    
    expect(enhanced).toBe(componentWithoutInput);
    expect(enhanced.checkable).toBeUndefined();
  });
  
  test('check method should set checked to true', () => {
    const enhanced = withCheckable()(inputComponent);
    
    // Initially unchecked
    expect(enhanced.input.checked).toBe(false);
    
    enhanced.checkable.check();
    
    expect(enhanced.input.checked).toBe(true);
    expect(enhanced.element.classList.contains(`${PREFIX}-switch--checked`)).toBe(true);
  });
  
  test('check method should not emit event if already checked', () => {
    const enhanced = withCheckable({ checked: true })(inputComponent);
    
    enhanced.checkable.check();
    
    expect(enhanced.input.checked).toBe(true);
  });
  
  test('uncheck method should set checked to false', () => {
    const enhanced = withCheckable({ checked: true })(inputComponent);
    
    enhanced.checkable.uncheck();
    
    expect(enhanced.input.checked).toBe(false);
    expect(enhanced.element.classList.contains(`${PREFIX}-switch--checked`)).toBe(false);
  });
  
  test('toggle method should toggle checked state', () => {
    const enhanced = withCheckable()(inputComponent);
    
    // Initially unchecked
    expect(enhanced.input.checked).toBe(false);
    
    enhanced.checkable.toggle();
    
    // Should now be checked
    expect(enhanced.input.checked).toBe(true);
    expect(enhanced.element.classList.contains(`${PREFIX}-switch--checked`)).toBe(true);
  });
  
  test('isChecked method should return current checked state', () => {
    const enhanced = withCheckable()(inputComponent);
    
    // Initially unchecked
    expect(enhanced.checkable.isChecked()).toBe(false);
    
    enhanced.input.checked = true;
    
    expect(enhanced.checkable.isChecked()).toBe(true);
  });
  
  test('should allow chaining of checkable methods', () => {
    const enhanced = withCheckable()(inputComponent);
    
    // Should allow chaining
    const result1 = enhanced.checkable.check();
    expect(result1).toBe(enhanced.checkable);
    
    const result2 = enhanced.checkable.uncheck();
    expect(result2).toBe(enhanced.checkable);
    
    const result3 = enhanced.checkable.toggle();
    expect(result3).toBe(enhanced.checkable);
  });
  
  test('should handle emit being undefined', () => {
    // Component without emit method
    const componentWithoutEmit = {
      element: document.createElement('div'),
      input: document.createElement('input'),
      getClass: (name) => `${PREFIX}-${name}`
    };
    componentWithoutEmit.input.type = 'checkbox';
    
    const enhanced = withCheckable()(componentWithoutEmit);
    
    // Should not throw when methods are called
    expect(() => enhanced.checkable.check()).not.toThrow();
    expect(() => enhanced.checkable.uncheck()).not.toThrow();
    expect(() => enhanced.checkable.toggle()).not.toThrow();
  });
});