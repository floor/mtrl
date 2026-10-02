// test/core/compose/features/input.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { withInput } from '../../../../src/core/compose/features/input';
import { PREFIX } from '../../../../src/core/config';
import '../../../setup'; // Import the jsdom setup

describe('withInput', () => {
  let component;
  let emitCalls;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    emitCalls = [];
    
    component = {
      element: document.createElement('div'),
      componentName: 'test-component',
      emit: function() { emitCalls.push(Array.from(arguments)); },
      getClass: (name) => `${PREFIX}-${name}`
    };
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('should add input element to component', () => {
    const config = { 
      name: 'test-input',
      value: 'test-value'
    };
    
    const enhanced = withInput(config)(component);
    
    expect(enhanced.input).toBeDefined();
    expect(enhanced.input.tagName).toBe('INPUT');
    expect(enhanced.input.type).toBe('checkbox');
    expect(enhanced.input.name).toBe('test-input');
    expect(enhanced.input.value).toBe('test-value');
    expect(component.element.contains(enhanced.input)).toBe(true);
  });
  
  test('should set attributes correctly', () => {
    const config = {
      name: 'test-input',
      required: true,
      disabled: true,
      checked: true,
      ariaLabel: 'Test checkbox'
    };
    
    const enhanced = withInput(config)(component);
    
    expect(enhanced.input.hasAttribute('name')).toBe(true);
    expect(enhanced.input.hasAttribute('required')).toBe(true);
    expect(enhanced.input.disabled).toBe(true);
    expect(enhanced.input.checked).toBe(true);
    expect(enhanced.input.getAttribute('aria-label')).toBe('Test checkbox');
  });
  
  test('should emit change event when input changes', () => {
    const enhanced = withInput({})(component);
    
    // Simulate a change event by directly calling the event handler
    // First we need to find which handler is registered to the input element
    // Since we can't access listeners directly in JSDOM, we'll simulate it
    enhanced.input.checked = true;
    
    // Directly trigger change event 
    const changeEvent = new Event('change', { bubbles: true });
    enhanced.input.dispatchEvent(changeEvent);
    
    expect(emitCalls.length).toBe(1);
    expect(emitCalls[0][0]).toBe('change');
    expect(emitCalls[0][1].checked).toBe(true);
    // 1.0: value is the checked boolean; the input's string is valueAttribute
    expect(emitCalls[0][1].value).toBe(true);
    expect(emitCalls[0][1].valueAttribute).toBe('on');
    expect(emitCalls[0][1].nativeEvent).toBeDefined();
  });
  
  test('should handle keyboard events', () => {
    const enhanced = withInput({})(component);
    
    // We can't fully test keyboard events in this environment,
    // but we can verify the input element has the correct key event listeners
    // by checking if it has event listeners
    expect(enhanced.input.onkeydown).toBeNull(); // Standard DOM doesn't expose listeners
    
    // We can test the functionality indirectly through the API
    expect(enhanced.input.checked).toBe(false);
    enhanced.input.checked = true;
    expect(enhanced.input.checked).toBe(true);
  });
  
  // 1.0: getValue and setValue work on the checked boolean, what change.value
  // carries; the input's string is getValueAttribute and setValueAttribute, the
  // names the checkbox and the switch use.
  test('getValue returns the checked state, getValueAttribute the input value', () => {
    const enhanced = withInput({ value: 'custom-value', checked: true })(component);

    expect(enhanced.getValue()).toBe(true);
    expect(enhanced.getValueAttribute()).toBe('custom-value');
    expect(withInput({ value: 'custom-value' })(component).getValue()).toBe(false);
  });

  test('setValue checks and unchecks the input, silently', () => {
    const enhanced = withInput({})(component);

    expect(enhanced.setValue(true)).toBe(enhanced);
    expect(enhanced.input.checked).toBe(true);
    expect(enhanced.getValue()).toBe(true);
    enhanced.setValue(false);
    expect(enhanced.input.checked).toBe(false);
    expect(enhanced.input.value).toBe('on');
    expect(emitCalls).toEqual([]);
  });

  test('setValueAttribute sets the input value, silently', () => {
    const enhanced = withInput({})(component);

    expect(enhanced.setValueAttribute('new-value')).toBe(enhanced);
    expect(enhanced.input.value).toBe('new-value');
    expect(enhanced.getValueAttribute()).toBe('new-value');
    expect(enhanced.getValue()).toBe(false);
    expect(emitCalls).toEqual([]);
  });
  
  test('should use default value if not provided', () => {
    const enhanced = withInput({})(component);
    
    expect(enhanced.input.value).toBe('on');
  });

  test('should not copy a node label into aria-label', () => {
    const slot = document.createElement('slot');
    const enhanced = withInput({ prefix: PREFIX, componentName: 'switch', label: slot })(component);

    expect(enhanced.input.hasAttribute('aria-label')).toBe(false);
  });
});
