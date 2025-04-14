// test/core/compose/features/textlabel.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { withTextLabel } from '../../../../src/core/compose/features/textlabel';
import { PREFIX } from '../../../../src/core/config';
import '../../../setup'; // Import the jsdom setup

describe('withTextLabel', () => {
  let component;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    component = {
      element: document.createElement('div'),
      componentName: 'checkbox',
      getClass: (name) => `${PREFIX}-${name}`
    };
  });
  
  test('should not add label if label text is not provided', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'checkbox'
    };
    
    const enhanced = withTextLabel(config)(component);
    
    expect(enhanced.label).toBeUndefined();
    expect(component.element.querySelector('label')).toBeNull();
  });
  
  test('should add label element with text if label is provided', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'checkbox',
      label: 'Test Label'
    };
    
    const enhanced = withTextLabel(config)(component);
    
    expect(enhanced.label).toBeDefined();
    
    const labelElement = component.element.querySelector('label');
    expect(labelElement).not.toBeNull();
    expect(labelElement.textContent).toBe('Test Label');
    expect(labelElement.className).toBe(`${PREFIX}-checkbox-label`);
  });
  
  test('should position label at start by default', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'checkbox',
      label: 'Test Label'
    };
    
    const enhanced = withTextLabel(config)(component);
    
    // Label should be the first child
    expect(component.element.firstChild.tagName).toBe('LABEL');
    expect(component.element.classList.contains(`${PREFIX}-checkbox--label-start`)).toBe(true);
  });
  
  test('should position label at end when specified', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'checkbox',
      label: 'Test Label',
      labelPosition: 'end'
    };
    
    const enhanced = withTextLabel(config)(component);
    
    // Label should be the last child
    expect(component.element.lastChild.tagName).toBe('LABEL');
    expect(component.element.classList.contains(`${PREFIX}-checkbox--label-end`)).toBe(true);
  });
  
  test('label API should work correctly', () => {
    const config = {
      prefix: PREFIX,
      componentName: 'checkbox',
      label: 'Initial Label'
    };
    
    const enhanced = withTextLabel(config)(component);
    
    // Test setText method
    enhanced.label.setText('Updated Label');
    expect(enhanced.label.getText()).toBe('Updated Label');
    
    const labelElement = component.element.querySelector('label');
    expect(labelElement.textContent).toBe('Updated Label');
    
    // Test getElement method
    expect(enhanced.label.getElement()).toBe(labelElement);
  });
  
  test('should handle special case for slider component', () => {
    // Special case mentioned in the code where slider doesn't get label position class
    const sliderComponent = {
      element: document.createElement('div'),
      componentName: 'slider',
      getClass: (name) => `${PREFIX}-${name}`
    };
    
    const config = {
      prefix: PREFIX,
      componentName: 'slider',
      label: 'Slider Label',
      labelPosition: 'end'
    };
    
    const enhanced = withTextLabel(config)(sliderComponent);
    
    // For slider, the labelPosition shouldn't add a class
    expect(sliderComponent.element.classList.contains(`${PREFIX}-slider--label-end`)).toBe(false);
    
    // But the label should still be correctly positioned
    expect(sliderComponent.element.lastChild.tagName).toBe('LABEL');
  });
});