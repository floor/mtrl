// test/components/chip.test.ts
import { describe, test, expect } from 'bun:test';
import { 
  type ChipComponent,
  type ChipConfig,
  type ChipVariant
} from '../../src/components/chip/types';

// Constants for chip variants
const CHIP_VARIANTS = {
  FILLED: 'filled',
  OUTLINED: 'outlined',
  ELEVATED: 'elevated',
  ASSIST: 'assist',
  FILTER: 'filter',
  INPUT: 'input',
  SUGGESTION: 'suggestion'
} as const;

// Mock chip implementation
const createMockChip = (config: ChipConfig = {}): ChipComponent => {
  // Create the main element
  const element = document.createElement('div');
  element.className = 'mtrl-chip';
  
  // Set default configuration
  const componentConfig = {
    componentName: 'chip',
    prefix: config.prefix || 'mtrl',
    variant: config.variant || CHIP_VARIANTS.FILLED,
    disabled: config.disabled || false,
    selected: config.selected || false,
    ripple: config.ripple !== undefined ? config.ripple : true
  };
  
  // Apply variant class
  if (componentConfig.variant) {
    element.classList.add(`mtrl-chip--${componentConfig.variant}`);
  }
  
  // Apply disabled state
  if (componentConfig.disabled) {
    element.classList.add('mtrl-chip--disabled');
    element.setAttribute('aria-disabled', 'true');
  }
  
  // Apply selected state
  if (componentConfig.selected) {
    element.classList.add('mtrl-chip--selected');
    element.setAttribute('aria-selected', 'true');
  }
  
  // Apply value if provided
  if (config.value) {
    element.setAttribute('data-value', config.value);
  }
  
  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  // Create ripple element if enabled
  if (componentConfig.ripple) {
    const ripple = document.createElement('span');
    ripple.className = 'mtrl-chip__ripple';
    element.appendChild(ripple);
  }
  
  // Create text element
  const textElement = document.createElement('span');
  textElement.className = 'mtrl-chip__text';
  if (config.text) {
    textElement.textContent = config.text;
  }
  element.appendChild(textElement);
  
  // Create leading icon element if provided
  let leadingIconElement: HTMLElement | null = null;
  if (config.leadingIcon || config.icon) {
    leadingIconElement = document.createElement('span');
    leadingIconElement.className = 'mtrl-chip__icon mtrl-chip__icon--leading';
    leadingIconElement.innerHTML = config.leadingIcon || config.icon || '';
    element.insertBefore(leadingIconElement, textElement);
  }
  
  // Create trailing icon element if provided
  let trailingIconElement: HTMLElement | null = null;
  if (config.trailingIcon) {
    trailingIconElement = document.createElement('span');
    trailingIconElement.className = 'mtrl-chip__icon mtrl-chip__icon--trailing';
    trailingIconElement.innerHTML = config.trailingIcon;
    element.appendChild(trailingIconElement);
    
    // Add click handler if provided
    if (config.onTrailingIconClick) {
      trailingIconElement.addEventListener('click', (e) => {
        e.stopPropagation();
        if (config.onTrailingIconClick) {
          config.onTrailingIconClick(chip);
        }
      });
    }
  }
  
  // Set up event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  const emit = (event: string, data?: any) => {
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(handler => handler(data));
    }
  };
  
  // Click handler to toggle selected state if selectable
  const handleClick = () => {
    if (componentConfig.disabled) return;
    
    if (config.selectable || 
        componentConfig.variant === CHIP_VARIANTS.FILTER || 
        componentConfig.variant === CHIP_VARIANTS.INPUT) {
      chip.toggleSelected();
      
      if (config.onChange) {
        config.onChange(chip);
      }
      
      emit('change', { selected: chip.isSelected() });
    }
    
    emit('click');
  };
  
  // Add click handler to the element
  element.addEventListener('click', handleClick);
  
  // Initialize text API
  const textAPI = {
    setText: (content: string) => {
      textElement.textContent = content;
      return textAPI;
    },
    getText: () => textElement.textContent || '',
    getElement: () => textElement
  };
  
  // Initialize icon API
  const iconAPI = {
    setIcon: (html: string) => {
      if (!leadingIconElement) {
        leadingIconElement = document.createElement('span');
        leadingIconElement.className = 'mtrl-chip__icon mtrl-chip__icon--leading';
        element.insertBefore(leadingIconElement, textElement);
      }
      leadingIconElement.innerHTML = html;
      return iconAPI;
    },
    getIcon: () => leadingIconElement ? leadingIconElement.innerHTML : '',
    getElement: () => leadingIconElement
  };
  
  // Create the chip component
  const chip: ChipComponent = {
    element,
    text: textAPI,
    icon: iconAPI,
    
    disabled: {
      enable: () => {
        element.classList.remove('mtrl-chip--disabled');
        element.removeAttribute('aria-disabled');
      },
      disable: () => {
        element.classList.add('mtrl-chip--disabled');
        element.setAttribute('aria-disabled', 'true');
      },
      isDisabled: () => element.classList.contains('mtrl-chip--disabled')
    },
    
    lifecycle: {
      destroy: () => {
        chip.destroy();
      }
    },
    
    getClass: (name: string) => {
      const prefix = componentConfig.prefix;
      return name ? `${prefix}-${name}` : `${prefix}-chip`;
    },
    
    getValue: () => element.getAttribute('data-value'),
    
    setValue: (value: string) => {
      element.setAttribute('data-value', value);
      return chip;
    },
    
    enable: () => {
      chip.disabled.enable();
      return chip;
    },
    
    disable: () => {
      chip.disabled.disable();
      return chip;
    },
    
    isDisabled: () => chip.disabled.isDisabled(),
    
    setText: (content: string) => {
      textAPI.setText(content);
      return chip;
    },
    
    getText: () => textAPI.getText(),
    
    setIcon: (icon: string) => {
      iconAPI.setIcon(icon);
      return chip;
    },
    
    getIcon: () => iconAPI.getIcon(),
    
    setLeadingIcon: (icon: string) => {
      iconAPI.setIcon(icon);
      return chip;
    },
    
    setTrailingIcon: (icon: string, onClick?: (chip: ChipComponent) => void) => {
      if (!trailingIconElement) {
        trailingIconElement = document.createElement('span');
        trailingIconElement.className = 'mtrl-chip__icon mtrl-chip__icon--trailing';
        element.appendChild(trailingIconElement);
      }
      
      trailingIconElement.innerHTML = icon;
      
      // Clear previous handlers and add new one if provided
      const newTrailingElement = trailingIconElement.cloneNode(true);
      trailingIconElement.parentNode?.replaceChild(newTrailingElement, trailingIconElement);
      trailingIconElement = newTrailingElement as HTMLElement;
      
      if (onClick) {
        trailingIconElement.addEventListener('click', (e) => {
          e.stopPropagation();
          onClick(chip);
        });
      }
      
      return chip;
    },
    
    isSelected: () => element.classList.contains('mtrl-chip--selected'),
    
    setSelected: (selected: boolean) => {
      if (selected) {
        element.classList.add('mtrl-chip--selected');
        element.setAttribute('aria-selected', 'true');
        
        if (config.onSelect) {
          config.onSelect(chip);
        }
      } else {
        element.classList.remove('mtrl-chip--selected');
        element.removeAttribute('aria-selected');
      }
      
      return chip;
    },
    
    toggleSelected: () => {
      const newSelectedState = !chip.isSelected();
      chip.setSelected(newSelectedState);
      return chip;
    },
    
    destroy: () => {
      // Remove event listeners
      element.removeEventListener('click', handleClick);
      
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
      return chip;
    },
    
    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      return chip;
    },
    
    addClass: (...classes: string[]) => {
      classes.forEach(className => element.classList.add(className));
      return chip;
    }
  };
  
  return chip;
};

describe('Chip Component', () => {
  test('should create a chip element', () => {
    const chip = createMockChip();
    expect(chip.element).toBeDefined();
    expect(chip.element.tagName).toBe('DIV');
    expect(chip.element.className).toContain('mtrl-chip');
  });
  
  test('should apply variant classes', () => {
    const variants: ChipVariant[] = [
      CHIP_VARIANTS.FILLED,
      CHIP_VARIANTS.OUTLINED,
      CHIP_VARIANTS.ELEVATED,
      CHIP_VARIANTS.ASSIST,
      CHIP_VARIANTS.FILTER,
      CHIP_VARIANTS.INPUT,
      CHIP_VARIANTS.SUGGESTION
    ];
    
    variants.forEach(variant => {
      const chip = createMockChip({ variant });
      expect(chip.element.className).toContain(`mtrl-chip--${variant}`);
    });
  });
  
  test('should set initial text content', () => {
    const chip = createMockChip({ text: 'Test Chip' });
    
    const textElement = chip.element.querySelector('.mtrl-chip__text');
    expect(textElement).toBeDefined();
    expect(textElement?.textContent).toBe('Test Chip');
    expect(chip.getText()).toBe('Test Chip');
  });
  
  test('should set initial leading icon', () => {
    const iconHtml = '<svg><path></path></svg>';
    const chip = createMockChip({ leadingIcon: iconHtml });
    
    const iconElement = chip.element.querySelector('.mtrl-chip__icon--leading');
    expect(iconElement).toBeDefined();
    expect(iconElement?.innerHTML).toBe(iconHtml);
    expect(chip.getIcon()).toBe(iconHtml);
  });
  
  test('should use icon as alias for leadingIcon', () => {
    const iconHtml = '<svg><path></path></svg>';
    const chip = createMockChip({ icon: iconHtml });
    
    const iconElement = chip.element.querySelector('.mtrl-chip__icon--leading');
    expect(iconElement).toBeDefined();
    expect(iconElement?.innerHTML).toBe(iconHtml);
    expect(chip.getIcon()).toBe(iconHtml);
  });
  
  test('should set initial trailing icon', () => {
    const iconHtml = '<svg><path></path></svg>';
    const chip = createMockChip({ trailingIcon: iconHtml });
    
    const iconElement = chip.element.querySelector('.mtrl-chip__icon--trailing');
    expect(iconElement).toBeDefined();
    expect(iconElement?.innerHTML).toBe(iconHtml);
  });
  
  test('should set value attribute', () => {
    const chip = createMockChip({ value: 'chip-123' });
    
    expect(chip.element.getAttribute('data-value')).toBe('chip-123');
    expect(chip.getValue()).toBe('chip-123');
  });
  
  test('should create ripple element by default', () => {
    const chip = createMockChip();
    
    const rippleElement = chip.element.querySelector('.mtrl-chip__ripple');
    expect(rippleElement).toBeDefined();
  });
  
  test('should not create ripple element when disabled', () => {
    const chip = createMockChip({ ripple: false });
    
    const rippleElement = chip.element.querySelector('.mtrl-chip__ripple');
    expect(rippleElement).toBeNull();
  });
  
  test('should apply disabled state', () => {
    const chip = createMockChip({ disabled: true });
    
    expect(chip.element.className).toContain('mtrl-chip--disabled');
    expect(chip.element.getAttribute('aria-disabled')).toBe('true');
    expect(chip.isDisabled()).toBe(true);
  });
  
  test('should apply selected state', () => {
    const chip = createMockChip({ selected: true });
    
    expect(chip.element.className).toContain('mtrl-chip--selected');
    expect(chip.element.getAttribute('aria-selected')).toBe('true');
    expect(chip.isSelected()).toBe(true);
  });
  
  test('should be able to change text content', () => {
    const chip = createMockChip({ text: 'Initial Text' });
    
    expect(chip.getText()).toBe('Initial Text');
    
    chip.setText('Updated Text');
    
    expect(chip.getText()).toBe('Updated Text');
    
    const textElement = chip.element.querySelector('.mtrl-chip__text');
    expect(textElement?.textContent).toBe('Updated Text');
  });
  
  test('should be able to change leading icon', () => {
    const chip = createMockChip();
    
    const initialIconElement = chip.element.querySelector('.mtrl-chip__icon--leading');
    expect(initialIconElement).toBeNull();
    
    const iconHtml = '<svg><path></path></svg>';
    chip.setIcon(iconHtml);
    
    const updatedIconElement = chip.element.querySelector('.mtrl-chip__icon--leading');
    expect(updatedIconElement).toBeDefined();
    expect(updatedIconElement?.innerHTML).toBe(iconHtml);
    expect(chip.getIcon()).toBe(iconHtml);
  });
  
  test('should be able to change trailing icon', () => {
    const chip = createMockChip();
    
    const initialIconElement = chip.element.querySelector('.mtrl-chip__icon--trailing');
    expect(initialIconElement).toBeNull();
    
    const iconHtml = '<svg><path></path></svg>';
    chip.setTrailingIcon(iconHtml);
    
    const updatedIconElement = chip.element.querySelector('.mtrl-chip__icon--trailing');
    expect(updatedIconElement).toBeDefined();
    expect(updatedIconElement?.innerHTML).toBe(iconHtml);
  });
  
  test('should handle trailing icon click events', () => {
    let clickHandled = false;
    
    const chip = createMockChip({
      trailingIcon: '<svg></svg>',
      onTrailingIconClick: () => {
        clickHandled = true;
      }
    });
    
    const trailingIcon = chip.element.querySelector('.mtrl-chip__icon--trailing');
    expect(trailingIcon).toBeDefined();
    
    const clickEvent = new Event('click');
    clickEvent.stopPropagation = () => {};
    trailingIcon?.dispatchEvent(clickEvent);
    
    expect(clickHandled).toBe(true);
  });
  
  test('should be able to change selected state', () => {
    const chip = createMockChip();
    
    expect(chip.isSelected()).toBe(false);
    
    chip.setSelected(true);
    
    expect(chip.isSelected()).toBe(true);
    expect(chip.element.className).toContain('mtrl-chip--selected');
    expect(chip.element.getAttribute('aria-selected')).toBe('true');
    
    chip.setSelected(false);
    
    expect(chip.isSelected()).toBe(false);
    expect(chip.element.className).not.toContain('mtrl-chip--selected');
    expect(chip.element.getAttribute('aria-selected')).toBeNull();
  });
  
  test('should be able to toggle selected state', () => {
    const chip = createMockChip();
    
    expect(chip.isSelected()).toBe(false);
    
    chip.toggleSelected();
    
    expect(chip.isSelected()).toBe(true);
    
    chip.toggleSelected();
    
    expect(chip.isSelected()).toBe(false);
  });
  
  test('should be able to change disabled state', () => {
    const chip = createMockChip();
    
    expect(chip.isDisabled()).toBe(false);
    
    chip.disable();
    
    expect(chip.isDisabled()).toBe(true);
    expect(chip.element.className).toContain('mtrl-chip--disabled');
    expect(chip.element.getAttribute('aria-disabled')).toBe('true');
    
    chip.enable();
    
    expect(chip.isDisabled()).toBe(false);
    expect(chip.element.className).not.toContain('mtrl-chip--disabled');
    expect(chip.element.getAttribute('aria-disabled')).toBeNull();
  });
  
  test('should be able to change value', () => {
    const chip = createMockChip();
    
    expect(chip.getValue()).toBeNull();
    
    chip.setValue('new-value');
    
    expect(chip.getValue()).toBe('new-value');
    expect(chip.element.getAttribute('data-value')).toBe('new-value');
  });
  
  test('should add event listeners', () => {
    const chip = createMockChip();
    let eventFired = false;
    
    chip.on('click', () => {
      eventFired = true;
    });
    
    // Simulate click
    chip.element.dispatchEvent(new Event('click'));
    
    expect(eventFired).toBe(true);
  });
  
  test('should remove event listeners', () => {
    const chip = createMockChip();
    let count = 0;
    
    const handler = () => {
      count++;
    };
    
    chip.on('click', handler);
    
    // First click
    chip.element.dispatchEvent(new Event('click'));
    expect(count).toBe(1);
    
    // Remove listener
    chip.off('click', handler);
    
    // Second click
    chip.element.dispatchEvent(new Event('click'));
    expect(count).toBe(1); // Count should not increase
  });
  
  test('should add CSS classes', () => {
    const chip = createMockChip();
    
    chip.addClass('custom-class', 'special-chip');
    
    expect(chip.element.className).toContain('custom-class');
    expect(chip.element.className).toContain('special-chip');
  });
  
  test('should toggle selected state when clicked for filter chips', () => {
    const chip = createMockChip({ variant: CHIP_VARIANTS.FILTER });
    
    expect(chip.isSelected()).toBe(false);
    
    // Simulate click
    chip.element.dispatchEvent(new Event('click'));
    
    expect(chip.isSelected()).toBe(true);
    
    // Click again
    chip.element.dispatchEvent(new Event('click'));
    
    expect(chip.isSelected()).toBe(false);
  });
  
  test('should call onChange when selection changes', () => {
    let changeHandled = false;
    let selectedState = false;
    
    const chip = createMockChip({
      variant: CHIP_VARIANTS.FILTER,
      onChange: (c) => {
        changeHandled = true;
        selectedState = c.isSelected();
      }
    });
    
    // Simulate click
    chip.element.dispatchEvent(new Event('click'));
    
    expect(changeHandled).toBe(true);
    expect(selectedState).toBe(true);
  });
  
  test('should call onSelect when selected', () => {
    let selectHandled = false;
    
    const chip = createMockChip({
      onSelect: () => {
        selectHandled = true;
      }
    });
    
    chip.setSelected(true);
    
    expect(selectHandled).toBe(true);
  });
  
  test('should make any chip variant selectable with selectable flag', () => {
    const chip = createMockChip({
      variant: CHIP_VARIANTS.FILLED,
      selectable: true
    });
    
    expect(chip.isSelected()).toBe(false);
    
    // Simulate click
    chip.element.dispatchEvent(new Event('click'));
    
    expect(chip.isSelected()).toBe(true);
  });
  
  test('should not toggle selection when disabled', () => {
    const chip = createMockChip({
      variant: CHIP_VARIANTS.FILTER,
      disabled: true
    });
    
    expect(chip.isSelected()).toBe(false);
    
    // Simulate click
    chip.element.dispatchEvent(new Event('click'));
    
    expect(chip.isSelected()).toBe(false);
  });
  
  test('should be properly destroyed', () => {
    const chip = createMockChip();
    document.body.appendChild(chip.element);
    
    expect(document.body.contains(chip.element)).toBe(true);
    
    chip.destroy();
    
    expect(document.body.contains(chip.element)).toBe(false);
  });
  
  test('should handle basic chip set creation', () => {
    // Create a chip set container
    const chipSetElement = document.createElement('div');
    chipSetElement.className = 'mtrl-chip-set';
    
    // Add chips to the set
    const chip1 = createMockChip({ text: 'Chip 1' });
    const chip2 = createMockChip({ text: 'Chip 2', selected: true });
    const chip3 = createMockChip({ text: 'Chip 3' });
    
    chipSetElement.appendChild(chip1.element);
    chipSetElement.appendChild(chip2.element);
    chipSetElement.appendChild(chip3.element);
    
    // Check if all chips are in the set
    expect(chipSetElement.children.length).toBe(3);
    expect(chipSetElement.children[0].className).toContain('mtrl-chip');
    expect(chipSetElement.children[1].className).toContain('mtrl-chip--selected');
  });
});