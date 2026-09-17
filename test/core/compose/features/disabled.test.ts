// test/core/compose/features/disabled.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { withDisabled } from '../../../../src/core/compose/features/disabled';
import { PREFIX } from '../../../../src/core/config';
import '../../../setup'; // Import the jsdom setup

describe('withDisabled', () => {
  let component;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    component = {
      element: document.createElement('div'),
      componentName: 'button',
      getClass: (name) => `${PREFIX}-${name}`
    };
  });
  
  test('should add disabled manager to component', () => {
    const config = {
      componentName: 'button'
    };
    
    const enhanced = withDisabled(config)(component);
    
    expect(enhanced.disabled).toBeDefined();
    expect(typeof enhanced.disabled.enable).toBe('function');
    expect(typeof enhanced.disabled.disable).toBe('function');
    expect(typeof enhanced.disabled.toggle).toBe('function');
    expect(typeof enhanced.disabled.isDisabled).toBe('function');
  });
  
  test('should set initial disabled state if specified', () => {
    const config = {
      disabled: true,
      componentName: 'button'
    };
    
    // Override requestAnimationFrame to run immediately
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      callback();
      return 0;
    };
    
    const enhanced = withDisabled(config)(component);
    
    // Restore original requestAnimationFrame
    window.requestAnimationFrame = originalRAF;
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--disabled`)).toBe(true);
  });
  
  test('enable method should remove disabled state', () => {
    const config = {
      componentName: 'button'
    };
    
    const enhanced = withDisabled(config)(component);
    
    // First disable it
    enhanced.disabled.disable();
    expect(enhanced.element.classList.contains(`${PREFIX}-button--disabled`)).toBe(true);
    
    // Then enable it
    enhanced.disabled.enable();
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--disabled`)).toBe(false);
    expect(enhanced.element.hasAttribute('disabled')).toBe(false);
  });
  
  test('disable method should add disabled state', () => {
    const config = {
      componentName: 'button'
    };
    
    const enhanced = withDisabled(config)(component);
    
    enhanced.disabled.disable();
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--disabled`)).toBe(true);
    expect(enhanced.element.hasAttribute('disabled')).toBe(true);
    expect(enhanced.element.getAttribute('disabled')).toBe('true');
  });
  
  test('toggle method should toggle disabled state', () => {
    const config = {
      componentName: 'button'
    };
    
    const enhanced = withDisabled(config)(component);
    
    // Initial state is enabled
    expect(enhanced.disabled.isDisabled()).toBe(false);
    
    // Toggle to disabled
    enhanced.disabled.toggle();
    expect(enhanced.disabled.isDisabled()).toBe(true);
    expect(enhanced.element.classList.contains(`${PREFIX}-button--disabled`)).toBe(true);
    
    // Toggle back to enabled
    enhanced.disabled.toggle();
    expect(enhanced.disabled.isDisabled()).toBe(false);
    expect(enhanced.element.classList.contains(`${PREFIX}-button--disabled`)).toBe(false);
  });
  
  test('isDisabled method should return current disabled state', () => {
    const config = {
      componentName: 'button'
    };
    
    const enhanced = withDisabled(config)(component);
    
    // Initial state
    expect(enhanced.disabled.isDisabled()).toBe(false);
    
    // After disabling
    enhanced.disabled.disable();
    expect(enhanced.disabled.isDisabled()).toBe(true);
    
    // After enabling
    enhanced.disabled.enable();
    expect(enhanced.disabled.isDisabled()).toBe(false);
  });
  
  test('should handle input elements', () => {
    const inputElement = document.createElement('input');
    component.input = inputElement;
    component.element.appendChild(inputElement);
    
    const config = {
      componentName: 'checkbox'
    };
    
    const enhanced = withDisabled(config)(component);
    
    // Test disable
    enhanced.disabled.disable();
    
    expect(enhanced.element.classList.contains(`${PREFIX}-checkbox--disabled`)).toBe(true);
    expect(enhanced.input.disabled).toBe(true);
    expect(enhanced.input.getAttribute('disabled')).toBe('true');
    
    // Test enable
    enhanced.disabled.enable();
    
    expect(enhanced.element.classList.contains(`${PREFIX}-checkbox--disabled`)).toBe(false);
    expect(enhanced.input.disabled).toBe(false);
    expect(enhanced.input.hasAttribute('disabled')).toBe(false);
  });
  
  test('should use provided component name for class', () => {
    const config = {
      componentName: 'custom-button'
    };
    
    const enhanced = withDisabled(config)(component);
    
    enhanced.disabled.disable();
    
    expect(enhanced.element.classList.contains(`${PREFIX}-custom-button--disabled`)).toBe(true);
  });
  
  test('should use component\'s componentName if not provided in config', () => {
    const config = {};
    
    const enhanced = withDisabled(config)(component);
    
    enhanced.disabled.disable();
    
    expect(enhanced.element.classList.contains(`${PREFIX}-button--disabled`)).toBe(true);
  });
  
  test('should fall back to "component" if no componentName is available', () => {
    const config = {};
    delete component.componentName;
    
    const enhanced = withDisabled(config)(component);
    
    enhanced.disabled.disable();
    
    expect(enhanced.element.classList.contains(`${PREFIX}-component--disabled`)).toBe(true);
  });
  
  test('should allow chaining of disabled methods', () => {
    const config = {
      componentName: 'button'
    };
    
    const enhanced = withDisabled(config)(component);
    
    // Should allow chaining
    const result1 = enhanced.disabled.disable();
    expect(result1).toBe(enhanced.disabled);
    
    const result2 = enhanced.disabled.enable();
    expect(result2).toBe(enhanced.disabled);
    
    const result3 = enhanced.disabled.toggle();
    expect(result3).toBe(enhanced.disabled);
  });
});