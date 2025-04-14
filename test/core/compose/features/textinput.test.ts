// test/core/compose/features/textinput.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { withTextInput } from '../../../../src/core/compose/features/textinput';
import { PREFIX } from '../../../../src/core/config';
import '../../../setup'; // Import the jsdom setup

describe('withTextInput', () => {
  let component;
  let emitCalls;
  let lifecycleDestroyCalls;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    emitCalls = [];
    lifecycleDestroyCalls = [];
    
    component = {
      element: document.createElement('div'),
      componentName: 'textfield',
      emit: function() { emitCalls.push(Array.from(arguments)); },
      getClass: (name) => `${PREFIX}-${name}`,
      lifecycle: {
        destroy: function() { lifecycleDestroyCalls.push('destroy'); }
      }
    };
  });
  
  test('should add input element to component', () => {
    const config = {};
    const enhanced = withTextInput(config)(component);
    
    expect(enhanced.input).toBeDefined();
    expect(enhanced.input.tagName).toBe('INPUT');
    expect(enhanced.input.type).toBe('text');
    expect(component.element.contains(enhanced.input)).toBe(true);
  });
  
  test('should create textarea for multiline inputs', () => {
    // Test with multiline: true
    const config1 = { multiline: true };
    const enhanced1 = withTextInput(config1)(component);
    
    expect(enhanced1.input.tagName).toBe('TEXTAREA');
    expect(enhanced1.input.getAttribute('data-type')).toBe('multiline');
    expect(component.element.classList.contains(`${PREFIX}-textfield--multiline`)).toBe(true);
    
    // Reset component
    document.body.innerHTML = '';
    component.element = document.createElement('div');
    
    // Test with type: 'multiline'
    const config2 = { type: 'multiline' };
    const enhanced2 = withTextInput(config2)(component);
    
    expect(enhanced2.input.tagName).toBe('TEXTAREA');
    expect(enhanced2.input.getAttribute('data-type')).toBe('multiline');
  });
  
  test('should set attributes correctly', () => {
    const config = {
      name: 'test-input',
      required: true,
      disabled: true,
      maxLength: 100,
      pattern: '[A-Z]+',
      autocomplete: 'off',
      value: 'Initial value',
      type: 'email'
    };
    
    const enhanced = withTextInput(config)(component);
    
    expect(enhanced.input.name).toBe('test-input');
    expect(enhanced.input.required).toBe(true);
    expect(enhanced.input.disabled).toBe(true);
    expect(enhanced.input.getAttribute('maxLength')).toBe('100');
    expect(enhanced.input.pattern).toBe('[A-Z]+');
    expect(enhanced.input.autocomplete).toBe('off');
    expect(enhanced.input.value).toBe('Initial value');
    expect(enhanced.input.type).toBe('email');
  });
  
  test('should use default input type if not provided', () => {
    const config = {};
    const enhanced = withTextInput(config)(component);
    
    expect(enhanced.input.type).toBe('text');
  });
  
  test('should emit events on focus, blur, and input', () => {
    const enhanced = withTextInput({})(component);
    
    // Trigger focus event
    enhanced.input.dispatchEvent(new Event('focus'));
    expect(emitCalls.length).toBe(1);
    expect(emitCalls[0][0]).toBe('focus');
    expect(emitCalls[0][1].isEmpty).toBe(true);
    expect(component.element.classList.contains(`${PREFIX}-textfield--focused`)).toBe(true);
    
    // Trigger input event
    enhanced.input.value = 'test';
    enhanced.input.dispatchEvent(new Event('input'));
    expect(emitCalls.length).toBe(2);
    expect(emitCalls[1][0]).toBe('input');
    expect(emitCalls[1][1].value).toBe('test');
    expect(emitCalls[1][1].isEmpty).toBe(false);
    expect(emitCalls[1][1].isAutofilled).toBe(false);
    expect(component.element.classList.contains(`${PREFIX}-textfield--empty`)).toBe(false);
    
    // Trigger blur event
    enhanced.input.dispatchEvent(new Event('blur'));
    expect(emitCalls.length).toBe(3);
    expect(emitCalls[2][0]).toBe('blur');
    expect(emitCalls[2][1].isEmpty).toBe(false);
    expect(component.element.classList.contains(`${PREFIX}-textfield--focused`)).toBe(false);
  });
  
  test('setValue should update input value and state', () => {
    const enhanced = withTextInput({})(component);
    
    enhanced.setValue('New value');
    
    expect(enhanced.input.value).toBe('New value');
    expect(component.element.classList.contains(`${PREFIX}-textfield--empty`)).toBe(false);
    
    enhanced.setValue('');
    
    expect(enhanced.input.value).toBe('');
    expect(component.element.classList.contains(`${PREFIX}-textfield--empty`)).toBe(true);
  });
  
  test('getValue should return input value', () => {
    const enhanced = withTextInput({ value: 'Test value' })(component);
    
    expect(enhanced.getValue()).toBe('Test value');
    
    enhanced.input.value = 'Updated value';
    
    expect(enhanced.getValue()).toBe('Updated value');
  });
  
  test('should handle attribute methods', () => {
    const enhanced = withTextInput({})(component);
    
    enhanced.setAttribute('aria-label', 'Test label');
    expect(enhanced.input.getAttribute('aria-label')).toBe('Test label');
    
    expect(enhanced.getAttribute('aria-label')).toBe('Test label');
    
    enhanced.removeAttribute('aria-label');
    expect(enhanced.input.hasAttribute('aria-label')).toBe(false);
  });
  
  test('should integrate with lifecycle if available', () => {
    const enhanced = withTextInput({})(component);
    const input = enhanced.input;
    
    // Call destroy
    component.lifecycle.destroy();
    
    // Check that destroy was called
    expect(lifecycleDestroyCalls).toContain('destroy');
    
    // Check that input was removed from DOM
    expect(input.parentNode).toBeNull();
  });
  
  test('should update empty state on initialization', () => {
    // With empty value
    const enhanced1 = withTextInput({})(component);
    expect(component.element.classList.contains(`${PREFIX}-textfield--empty`)).toBe(true);
    
    // Reset component
    document.body.innerHTML = '';
    component.element = document.createElement('div');
    
    // With non-empty value
    const enhanced2 = withTextInput({ value: 'Initial' })(component);
    expect(component.element.classList.contains(`${PREFIX}-textfield--empty`)).toBe(false);
  });
  
  test('should support method chaining', () => {
    const enhanced = withTextInput({})(component);
    
    const result1 = enhanced.setValue('test');
    expect(result1).toBe(enhanced);
    
    const result2 = enhanced.setAttribute('data-test', 'value');
    expect(result2).toBe(enhanced);
    
    const result3 = enhanced.removeAttribute('data-test');
    expect(result3).toBe(enhanced);
  });
});