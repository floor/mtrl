// test/core/compose/features/checkable.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { withCheckable } from '../../../../src/core/compose/features/checkable';
import { PREFIX } from '../../../../src/core/config';
import '../../../setup'; // Import the jsdom setup

describe('withCheckable', () => {
  let component;
  let emitCalls;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    emitCalls = [];
    
    // Create a component with input element
    const inputElement = document.createElement('input');
    inputElement.type = 'checkbox';
    
    component = {
      element: document.createElement('div'),
      input: inputElement,
      emit: function() { emitCalls.push(Array.from(arguments)); },
      on: function() { return component; },
      componentName: 'switch',
      getClass: (name) => `${PREFIX}-${name}`
    };
    
    component.element.appendChild(inputElement);
  });
  
  test('should add checkable methods to component', () => {
    const enhanced = withCheckable()(component);
    
    expect(enhanced.checkable).toBeDefined();
    expect(typeof enhanced.checkable.check).toBe('function');
    expect(typeof enhanced.checkable.uncheck).toBe('function');
    expect(typeof enhanced.checkable.toggle).toBe('function');
    expect(typeof enhanced.checkable.isChecked).toBe('function');
  });
  
  test('should set initial checked state if specified', () => {
    const config = { checked: true };
    const enhanced = withCheckable(config)(component);
    
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
    const enhanced = withCheckable()(component);
    
    // Initially unchecked
    expect(enhanced.input.checked).toBe(false);
    
    enhanced.checkable.check();
    
    expect(enhanced.input.checked).toBe(true);
    expect(enhanced.element.classList.contains(`${PREFIX}-switch--checked`)).toBe(true);
    expect(emitCalls.length).toBe(1);
    expect(emitCalls[0][0]).toBe('change');
    expect(emitCalls[0][1].checked).toBe(true);
  });
  
  test('check method should not emit event if already checked', () => {
    const enhanced = withCheckable({ checked: true })(component);
    emitCalls = []; // Clear initial calls
    
    enhanced.checkable.check();
    
    expect(enhanced.input.checked).toBe(true);
    expect(emitCalls.length).toBe(0);
  });
  
  test('uncheck method should set checked to false', () => {
    const enhanced = withCheckable({ checked: true })(component);
    emitCalls = []; // Clear initial calls
    
    enhanced.checkable.uncheck();
    
    expect(enhanced.input.checked).toBe(false);
    expect(enhanced.element.classList.contains(`${PREFIX}-switch--checked`)).toBe(false);
    expect(emitCalls.length).toBe(1);
    expect(emitCalls[0][0]).toBe('change');
    expect(emitCalls[0][1].checked).toBe(false);
  });
  
  test('uncheck method should not emit event if already unchecked', () => {
    const enhanced = withCheckable()(component);
    
    enhanced.checkable.uncheck();
    
    expect(enhanced.input.checked).toBe(false);
    expect(emitCalls.length).toBe(0);
  });
  
  test('toggle method should toggle checked state', () => {
    const enhanced = withCheckable()(component);
    
    // Initially unchecked
    expect(enhanced.input.checked).toBe(false);
    
    enhanced.checkable.toggle();
    
    // Should now be checked
    expect(enhanced.input.checked).toBe(true);
    expect(enhanced.element.classList.contains(`${PREFIX}-switch--checked`)).toBe(true);
    expect(emitCalls.length).toBe(1);
    expect(emitCalls[0][0]).toBe('change');
    expect(emitCalls[0][1].checked).toBe(true);
    
    emitCalls = []; // Clear previous calls
    
    enhanced.checkable.toggle();
    
    // Should now be unchecked again
    expect(enhanced.input.checked).toBe(false);
    expect(enhanced.element.classList.contains(`${PREFIX}-switch--checked`)).toBe(false);
    expect(emitCalls.length).toBe(1);
    expect(emitCalls[0][0]).toBe('change');
    expect(emitCalls[0][1].checked).toBe(false);
  });
  
  test('isChecked method should return current checked state', () => {
    const enhanced = withCheckable()(component);
    
    // Initially unchecked
    expect(enhanced.checkable.isChecked()).toBe(false);
    
    enhanced.input.checked = true;
    
    expect(enhanced.checkable.isChecked()).toBe(true);
  });
  
  test('should allow chaining of checkable methods', () => {
    const enhanced = withCheckable()(component);
    
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