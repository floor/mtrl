// test/components/radios.test.ts
import { describe, test, expect } from 'bun:test';
import { 
  type RadiosComponent,
  type RadiosConfig,
  type RadioOptionConfig,
  type RadioItem
} from '../../src/components/radios/types';

// Mock radios implementation
const createMockRadios = (config: RadiosConfig): RadiosComponent => {
  // Create main container element
  const element = document.createElement('div');
  element.className = 'mtrl-radios';
  
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  if (config.disabled) {
    element.classList.add('mtrl-radios--disabled');
  }
  
  // Store settings
  const settings = {
    name: config.name,
    componentName: config.componentName || 'radios',
    prefix: config.prefix || 'mtrl',
    ripple: config.ripple !== undefined ? config.ripple : true,
    disabled: config.disabled || false,
    value: config.value || ''
  };
  
  // Create radio items
  const radios: RadioItem[] = [];
  
  // Track event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Emit an event
  const emit = (event: string, data?: any) => {
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(handler => handler(data));
    }
  };
  
  // Helper function to create a radio item
  const createRadioItem = (option: RadioOptionConfig): RadioItem => {
    const radioElement = document.createElement('div');
    radioElement.className = 'mtrl-radio';
    
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = settings.name;
    input.value = option.value;
    input.className = 'mtrl-radio__input';
    input.checked = option.value === settings.value;
    
    if (option.disabled || settings.disabled) {
      input.disabled = true;
      radioElement.classList.add('mtrl-radio--disabled');
    }
    
    const label = document.createElement('label');
    label.className = 'mtrl-radio__label';
    label.textContent = option.label;
    label.setAttribute('for', `${settings.name}-${option.value}`);
    
    if (option.labelBefore) {
      radioElement.classList.add('mtrl-radio--label-before');
      radioElement.appendChild(label);
      radioElement.appendChild(input);
    } else {
      radioElement.appendChild(input);
      radioElement.appendChild(label);
    }
    
    // Create ripple element if enabled
    if (settings.ripple) {
      const ripple = document.createElement('span');
      ripple.className = 'mtrl-radio__ripple';
      radioElement.appendChild(ripple);
    }
    
    // Handle change event
    const handleChange = () => {
      if (input.checked) {
        settings.value = option.value;
        
        // Update checked state of all radios
        radios.forEach(radio => {
          radio.input.checked = radio.input.value === settings.value;
        });
        
        emit('change', { value: settings.value });
      }
    };
    
    input.addEventListener('change', handleChange);
    
    const radioItem: RadioItem = {
      element: radioElement,
      input,
      label,
      config: { ...option },
      destroy: () => {
        input.removeEventListener('change', handleChange);
        if (radioElement.parentNode) {
          radioElement.parentNode.removeChild(radioElement);
        }
      }
    };
    
    return radioItem;
  };
  
  // Add initial options
  if (config.options) {
    config.options.forEach(option => {
      const radioItem = createRadioItem(option);
      radios.push(radioItem);
      element.appendChild(radioItem.element);
    });
  }
  
  // Create the radios component
  const radiosComponent: RadiosComponent = {
    element,
    radios,
    
    lifecycle: {
      destroy: () => {
        radiosComponent.destroy();
      }
    },
    
    getClass: (name: string) => {
      const prefix = settings.prefix;
      return name ? `${prefix}-${name}` : `${prefix}-radios`;
    },
    
    getValue: () => settings.value,
    
    setValue: (value: string) => {
      settings.value = value;
      
      // Update radio inputs
      radios.forEach(radio => {
        radio.input.checked = radio.config.value === value;
      });
      
      emit('change', { value });
      
      return radiosComponent;
    },
    
    getSelected: () => {
      const selectedRadio = radios.find(radio => radio.config.value === settings.value);
      return selectedRadio ? { ...selectedRadio.config } : null;
    },
    
    addOption: (option: RadioOptionConfig) => {
      // Check if option with this value already exists
      const existingIndex = radios.findIndex(radio => radio.config.value === option.value);
      
      if (existingIndex === -1) {
        const radioItem = createRadioItem(option);
        radios.push(radioItem);
        element.appendChild(radioItem.element);
      }
      
      return radiosComponent;
    },
    
    removeOption: (value: string) => {
      const index = radios.findIndex(radio => radio.config.value === value);
      
      if (index !== -1) {
        const radioItem = radios[index];
        radioItem.destroy();
        radios.splice(index, 1);
        
        // If we removed the selected option, clear the value
        if (settings.value === value) {
          settings.value = '';
        }
      }
      
      return radiosComponent;
    },
    
    enable: () => {
      settings.disabled = false;
      element.classList.remove('mtrl-radios--disabled');
      
      radios.forEach(radio => {
        if (!radio.config.disabled) {
          radio.input.disabled = false;
          radio.element.classList.remove('mtrl-radio--disabled');
        }
      });
      
      return radiosComponent;
    },
    
    disable: () => {
      settings.disabled = true;
      element.classList.add('mtrl-radios--disabled');
      
      radios.forEach(radio => {
        radio.input.disabled = true;
        radio.element.classList.add('mtrl-radio--disabled');
      });
      
      return radiosComponent;
    },
    
    enableOption: (value: string) => {
      const radio = radios.find(r => r.config.value === value);
      
      if (radio) {
        radio.config.disabled = false;
        
        if (!settings.disabled) {
          radio.input.disabled = false;
          radio.element.classList.remove('mtrl-radio--disabled');
        }
      }
      
      return radiosComponent;
    },
    
    disableOption: (value: string) => {
      const radio = radios.find(r => r.config.value === value);
      
      if (radio) {
        radio.config.disabled = true;
        radio.input.disabled = true;
        radio.element.classList.add('mtrl-radio--disabled');
      }
      
      return radiosComponent;
    },
    
    destroy: () => {
      // Clean up radio items
      radios.forEach(radio => radio.destroy());
      radios.length = 0;
      
      // Remove element from DOM if it has a parent
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Clear event handlers
      for (const event in eventHandlers) {
        eventHandlers[event] = [];
      }
    },
    
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      return radiosComponent;
    },
    
    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      
      return radiosComponent;
    }
  };
  
  return radiosComponent;
};

describe('Radios Component', () => {
  test('should create a radios component with options', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options
    });
    
    expect(radios.element).toBeDefined();
    expect(radios.element.tagName).toBe('DIV');
    expect(radios.element.className).toContain('mtrl-radios');
    
    expect(radios.radios.length).toBe(3);
    
    const radioElements = radios.element.querySelectorAll('.mtrl-radio');
    expect(radioElements.length).toBe(3);
    
    const inputs = radios.element.querySelectorAll('input[type="radio"]');
    expect(inputs.length).toBe(3);
    
    inputs.forEach((input: Element, index: number) => {
      expect((input as HTMLInputElement).name).toBe('test-radios');
      expect((input as HTMLInputElement).value).toBe(options[index].value);
      
      const label = input.parentElement?.querySelector('label');
      expect(label?.textContent).toBe(options[index].label);
    });
  });
  
  test('should set initial selected value', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options,
      value: 'option2'
    });
    
    expect(radios.getValue()).toBe('option2');
    
    const inputs = radios.element.querySelectorAll('input[type="radio"]');
    expect((inputs[0] as HTMLInputElement).checked).toBe(false);
    expect((inputs[1] as HTMLInputElement).checked).toBe(true);
    expect((inputs[2] as HTMLInputElement).checked).toBe(false);
  });
  
  test('should create with label before radio when configured', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1', labelBefore: true }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options
    });
    
    const radioElement = radios.element.querySelector('.mtrl-radio');
    expect(radioElement?.className).toContain('mtrl-radio--label-before');
    
    // First child should be label when labelBefore is true
    const firstChild = radioElement?.firstChild;
    expect(firstChild?.nodeName).toBe('LABEL');
  });
  
  test('should disable specific options', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
      { value: 'option3', label: 'Option 3' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options
    });
    
    const inputs = radios.element.querySelectorAll('input[type="radio"]');
    expect((inputs[0] as HTMLInputElement).disabled).toBe(false);
    expect((inputs[1] as HTMLInputElement).disabled).toBe(true);
    expect((inputs[2] as HTMLInputElement).disabled).toBe(false);
    
    const radioElements = radios.element.querySelectorAll('.mtrl-radio');
    expect(radioElements[1].className).toContain('mtrl-radio--disabled');
  });
  
  test('should disable all options when component is disabled', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options,
      disabled: true
    });
    
    expect(radios.element.className).toContain('mtrl-radios--disabled');
    
    const inputs = radios.element.querySelectorAll('input[type="radio"]');
    inputs.forEach(input => {
      expect((input as HTMLInputElement).disabled).toBe(true);
    });
    
    const radioElements = radios.element.querySelectorAll('.mtrl-radio');
    radioElements.forEach(radio => {
      expect(radio.className).toContain('mtrl-radio--disabled');
    });
  });
  
  test('should create ripple effect by default', () => {
    const radios = createMockRadios({
      name: 'test-radios',
      options: [{ value: 'option1', label: 'Option 1' }]
    });
    
    const ripples = radios.element.querySelectorAll('.mtrl-radio__ripple');
    expect(ripples.length).toBe(1);
  });
  
  test('should not create ripple when disabled', () => {
    const radios = createMockRadios({
      name: 'test-radios',
      options: [{ value: 'option1', label: 'Option 1' }],
      ripple: false
    });
    
    const ripples = radios.element.querySelectorAll('.mtrl-radio__ripple');
    expect(ripples.length).toBe(0);
  });
  
  test('should change selected value', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options
    });
    
    expect(radios.getValue()).toBe('');
    
    radios.setValue('option2');
    
    expect(radios.getValue()).toBe('option2');
    
    const inputs = radios.element.querySelectorAll('input[type="radio"]');
    expect((inputs[0] as HTMLInputElement).checked).toBe(false);
    expect((inputs[1] as HTMLInputElement).checked).toBe(true);
    expect((inputs[2] as HTMLInputElement).checked).toBe(false);
  });
  
  test('should get selected option config', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options,
      value: 'option2'
    });
    
    const selected = radios.getSelected();
    expect(selected).toEqual(options[1]);
  });
  
  test('should add a new option', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options
    });
    
    expect(radios.radios.length).toBe(2);
    
    const newOption: RadioOptionConfig = {
      value: 'option3',
      label: 'Option 3'
    };
    
    radios.addOption(newOption);
    
    expect(radios.radios.length).toBe(3);
    
    const radioElements = radios.element.querySelectorAll('.mtrl-radio');
    expect(radioElements.length).toBe(3);
    
    const lastInput = radios.radios[2].input;
    expect(lastInput.value).toBe('option3');
    
    const lastLabel = radios.radios[2].label;
    expect(lastLabel.textContent).toBe('Option 3');
  });
  
  test('should remove an option', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options
    });
    
    expect(radios.radios.length).toBe(3);
    
    radios.removeOption('option2');
    
    expect(radios.radios.length).toBe(2);
    
    const radioElements = radios.element.querySelectorAll('.mtrl-radio');
    expect(radioElements.length).toBe(2);
    
    const remainingValues = radios.radios.map(radio => radio.config.value);
    expect(remainingValues).toEqual(['option1', 'option3']);
  });
  
  test('should clear value when selected option is removed', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options,
      value: 'option2'
    });
    
    expect(radios.getValue()).toBe('option2');
    
    radios.removeOption('option2');
    
    expect(radios.getValue()).toBe('');
  });
  
  test('should enable and disable the component', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options
    });
    
    expect(radios.element.className).not.toContain('mtrl-radios--disabled');
    
    radios.disable();
    
    expect(radios.element.className).toContain('mtrl-radios--disabled');
    
    const inputs = radios.element.querySelectorAll('input[type="radio"]');
    inputs.forEach(input => {
      expect((input as HTMLInputElement).disabled).toBe(true);
    });
    
    radios.enable();
    
    expect(radios.element.className).not.toContain('mtrl-radios--disabled');
    
    inputs.forEach(input => {
      expect((input as HTMLInputElement).disabled).toBe(false);
    });
  });
  
  test('should enable and disable specific options', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options
    });
    
    radios.disableOption('option1');
    
    const input1 = radios.radios[0].input;
    const input2 = radios.radios[1].input;
    
    expect(input1.disabled).toBe(true);
    expect(input2.disabled).toBe(false);
    
    expect(radios.radios[0].element.className).toContain('mtrl-radio--disabled');
    expect(radios.radios[1].element.className).not.toContain('mtrl-radio--disabled');
    
    radios.enableOption('option1');
    
    expect(input1.disabled).toBe(false);
    expect(radios.radios[0].element.className).not.toContain('mtrl-radio--disabled');
  });
  
  test('should emit change events', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options
    });
    
    let eventFired = false;
    let eventValue = '';
    
    radios.on('change', (data) => {
      eventFired = true;
      eventValue = data.value;
    });
    
    radios.setValue('option2');
    
    expect(eventFired).toBe(true);
    expect(eventValue).toBe('option2');
  });
  
  test('should handle input change events', () => {
    const options: RadioOptionConfig[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];
    
    const radios = createMockRadios({
      name: 'test-radios',
      options
    });
    
    let eventFired = false;
    let eventValue = '';
    
    radios.on('change', (data) => {
      eventFired = true;
      eventValue = data.value;
    });
    
    // Simulate radio button change
    const input = radios.radios[1].input;
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    
    expect(eventFired).toBe(true);
    expect(eventValue).toBe('option2');
    expect(radios.getValue()).toBe('option2');
  });
  
  test('should remove event listeners', () => {
    const radios = createMockRadios({
      name: 'test-radios',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ]
    });
    
    let eventCount = 0;
    
    const handler = () => {
      eventCount++;
    };
    
    radios.on('change', handler);
    
    radios.setValue('option1');
    expect(eventCount).toBe(1);
    
    radios.off('change', handler);
    
    radios.setValue('option2');
    expect(eventCount).toBe(1); // Count should not increase
  });
  
  test('should be properly destroyed', () => {
    const radios = createMockRadios({
      name: 'test-radios',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ]
    });
    
    document.body.appendChild(radios.element);
    
    expect(document.body.contains(radios.element)).toBe(true);
    expect(radios.radios.length).toBe(2);
    
    radios.destroy();
    
    expect(document.body.contains(radios.element)).toBe(false);
    expect(radios.radios.length).toBe(0);
  });
});