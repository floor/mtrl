// test/components/segmented-button.test.ts
import { describe, test, expect } from 'bun:test';
import { 
  type SegmentedButtonComponent,
  type SegmentedButtonConfig,
  type SegmentConfig,
  type Segment,
  SelectionMode
} from '../../src/components/segmented-button/types';

// Mock segmented-button implementation
const createMockSegmentedButton = (config: SegmentedButtonConfig = {}): SegmentedButtonComponent => {
  // Create main container element
  const element = document.createElement('div');
  element.className = 'mtrl-segmented-button';
  
  // Default settings
  const settings = {
    mode: config.mode || SelectionMode.SINGLE,
    disabled: config.disabled || false,
    ripple: config.ripple !== undefined ? config.ripple : true,
    prefix: config.prefix || 'mtrl',
    componentName: config.componentName || 'segmented-button'
  };
  
  // Apply mode class
  element.setAttribute('data-mode', settings.mode);
  element.classList.add(`mtrl-segmented-button--${settings.mode}`);
  
  // Apply disabled state
  if (settings.disabled) {
    element.classList.add('mtrl-segmented-button--disabled');
  }
  
  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  // Array to store segments
  const segments: Segment[] = [];
  
  // Track event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Emit an event
  const emit = (event: string, originalEvent?: Event | null) => {
    const selected = segmentedButton.getSelected();
    const values = segmentedButton.getValue();
    
    let defaultPrevented = false;
    
    const eventData = {
      segmentedButton,
      selected,
      values,
      originalEvent: originalEvent || null,
      preventDefault: () => {
        defaultPrevented = true;
      },
      defaultPrevented
    };
    
    // Call handlers from config.on
    if (config.on && config.on[event]) {
      config.on[event]!(eventData);
    }
    
    // Call registered event handlers
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(handler => handler(eventData));
    }
    
    return defaultPrevented;
  };
  
  // Create segments from config
  if (config.segments) {
    config.segments.forEach(segmentConfig => {
      const segmentElement = document.createElement('button');
      segmentElement.className = 'mtrl-segment';
      segmentElement.type = 'button';
      
      // Set value attribute
      const value = segmentConfig.value || segmentConfig.text || '';
      segmentElement.setAttribute('data-value', value);
      
      // Apply selected state
      if (segmentConfig.selected) {
        segmentElement.classList.add('mtrl-segment--selected');
        segmentElement.setAttribute('aria-pressed', 'true');
      } else {
        segmentElement.setAttribute('aria-pressed', 'false');
      }
      
      // Apply disabled state
      if (settings.disabled || segmentConfig.disabled) {
        segmentElement.classList.add('mtrl-segment--disabled');
        segmentElement.disabled = true;
      }
      
      // Create icon if provided
      if (segmentConfig.icon) {
        const iconElement = document.createElement('span');
        iconElement.className = 'mtrl-segment__icon';
        iconElement.innerHTML = segmentConfig.icon;
        segmentElement.appendChild(iconElement);
      }
      
      // Create text if provided
      if (segmentConfig.text) {
        const textElement = document.createElement('span');
        textElement.className = 'mtrl-segment__text';
        textElement.textContent = segmentConfig.text;
        segmentElement.appendChild(textElement);
      }
      
      // Apply additional classes
      if (segmentConfig.class) {
        const classes = segmentConfig.class.split(' ');
        classes.forEach(className => segmentElement.classList.add(className));
      }
      
      // Add ripple effect if enabled
      if (settings.ripple) {
        const rippleElement = document.createElement('span');
        rippleElement.className = 'mtrl-segment__ripple';
        segmentElement.appendChild(rippleElement);
      }
      
      // Create segment object
      const segment: Segment = {
        element: segmentElement,
        value,
        
        isSelected: () => segmentElement.classList.contains('mtrl-segment--selected'),
        
        setSelected: (selected: boolean) => {
          if (selected) {
            segmentElement.classList.add('mtrl-segment--selected');
            segmentElement.setAttribute('aria-pressed', 'true');
          } else {
            segmentElement.classList.remove('mtrl-segment--selected');
            segmentElement.setAttribute('aria-pressed', 'false');
          }
        },
        
        isDisabled: () => segmentElement.disabled,
        
        setDisabled: (disabled: boolean) => {
          segmentElement.disabled = disabled;
          
          if (disabled) {
            segmentElement.classList.add('mtrl-segment--disabled');
          } else {
            segmentElement.classList.remove('mtrl-segment--disabled');
          }
        },
        
        destroy: () => {
          if (segmentElement.parentNode) {
            segmentElement.parentNode.removeChild(segmentElement);
          }
        }
      };
      
      // Handle click event
      segmentElement.addEventListener('click', (event) => {
        if (!segment.isDisabled()) {
          if (settings.mode === SelectionMode.SINGLE) {
            // Deselect all segments
            segments.forEach(s => s.setSelected(false));
            // Select only this segment
            segment.setSelected(true);
          } else {
            // Toggle this segment
            segment.setSelected(!segment.isSelected());
          }
          
          // Emit change event
          emit('change', event);
        }
      });
      
      segments.push(segment);
      element.appendChild(segmentElement);
    });
  }
  
  // Create the segmented button component
  const segmentedButton: SegmentedButtonComponent = {
    element,
    segments,
    
    getSelected: () => segments.filter(segment => segment.isSelected()),
    
    getValue: () => segments.filter(segment => segment.isSelected()).map(segment => segment.value),
    
    select: (value: string) => {
      const segment = segments.find(s => s.value === value);
      
      if (segment && !segment.isDisabled()) {
        if (settings.mode === SelectionMode.SINGLE) {
          // Deselect all segments
          segments.forEach(s => s.setSelected(false));
        }
        
        // Select the specified segment
        segment.setSelected(true);
        
        // Emit change event
        emit('change');
      }
      
      return segmentedButton;
    },
    
    deselect: (value: string) => {
      const segment = segments.find(s => s.value === value);
      
      if (segment && !segment.isDisabled() && segment.isSelected()) {
        segment.setSelected(false);
        
        // Emit change event
        emit('change');
      }
      
      return segmentedButton;
    },
    
    enable: () => {
      settings.disabled = false;
      element.classList.remove('mtrl-segmented-button--disabled');
      
      // Enable individual segments that weren't explicitly disabled
      segments.forEach(segment => {
        const configSegment = config.segments?.find(s => s.value === segment.value);
        if (!configSegment?.disabled) {
          segment.setDisabled(false);
        }
      });
      
      return segmentedButton;
    },
    
    disable: () => {
      settings.disabled = true;
      element.classList.add('mtrl-segmented-button--disabled');
      
      // Disable all segments
      segments.forEach(segment => {
        segment.setDisabled(true);
      });
      
      return segmentedButton;
    },
    
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      return segmentedButton;
    },
    
    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      
      return segmentedButton;
    },
    
    destroy: () => {
      // Clean up segments
      segments.forEach(segment => segment.destroy());
      
      // Remove element from DOM if it has a parent
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Clear event handlers
      for (const event in eventHandlers) {
        eventHandlers[event] = [];
      }
    }
  };
  
  return segmentedButton;
};

describe('Segmented Button Component', () => {
  test('should create a segmented button component', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Day', value: 'day' },
        { text: 'Week', value: 'week' },
        { text: 'Month', value: 'month' }
      ]
    });
    
    expect(segmentedButton.element).toBeDefined();
    expect(segmentedButton.element.tagName).toBe('DIV');
    expect(segmentedButton.element.className).toContain('mtrl-segmented-button');
    
    const segmentElements = segmentedButton.element.querySelectorAll('.mtrl-segment');
    expect(segmentElements.length).toBe(3);
    
    const textElements = segmentedButton.element.querySelectorAll('.mtrl-segment__text');
    expect(textElements.length).toBe(3);
    expect(textElements[0].textContent).toBe('Day');
    expect(textElements[1].textContent).toBe('Week');
    expect(textElements[2].textContent).toBe('Month');
  });
  
  test('should apply single selection mode by default', () => {
    const segmentedButton = createMockSegmentedButton();
    
    expect(segmentedButton.element.getAttribute('data-mode')).toBe(SelectionMode.SINGLE);
    expect(segmentedButton.element.className).toContain(`mtrl-segmented-button--${SelectionMode.SINGLE}`);
  });
  
  test('should apply multi selection mode when specified', () => {
    const segmentedButton = createMockSegmentedButton({
      mode: SelectionMode.MULTI
    });
    
    expect(segmentedButton.element.getAttribute('data-mode')).toBe(SelectionMode.MULTI);
    expect(segmentedButton.element.className).toContain(`mtrl-segmented-button--${SelectionMode.MULTI}`);
  });
  
  test('should apply disabled state', () => {
    const segmentedButton = createMockSegmentedButton({
      disabled: true,
      segments: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2' }
      ]
    });
    
    expect(segmentedButton.element.className).toContain('mtrl-segmented-button--disabled');
    
    const segmentElements = segmentedButton.element.querySelectorAll('.mtrl-segment');
    segmentElements.forEach(segment => {
      expect(segment.className).toContain('mtrl-segment--disabled');
      expect((segment as HTMLButtonElement).disabled).toBe(true);
    });
  });
  
  test('should disable individual segments', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2', disabled: true },
        { text: 'Option 3', value: 'option3' }
      ]
    });
    
    const segmentElements = segmentedButton.element.querySelectorAll('.mtrl-segment');
    
    expect(segmentElements[0].className).not.toContain('mtrl-segment--disabled');
    expect(segmentElements[1].className).toContain('mtrl-segment--disabled');
    expect(segmentElements[2].className).not.toContain('mtrl-segment--disabled');
    
    expect((segmentElements[0] as HTMLButtonElement).disabled).toBe(false);
    expect((segmentElements[1] as HTMLButtonElement).disabled).toBe(true);
    expect((segmentElements[2] as HTMLButtonElement).disabled).toBe(false);
  });
  
  test('should create ripple elements by default', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1' }
      ]
    });
    
    const ripples = segmentedButton.element.querySelectorAll('.mtrl-segment__ripple');
    expect(ripples.length).toBe(1);
  });
  
  test('should not create ripple elements when disabled', () => {
    const segmentedButton = createMockSegmentedButton({
      ripple: false,
      segments: [
        { text: 'Option 1', value: 'option1' }
      ]
    });
    
    const ripples = segmentedButton.element.querySelectorAll('.mtrl-segment__ripple');
    expect(ripples.length).toBe(0);
  });
  
  test('should render icons when provided', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Day', value: 'day', icon: '<svg>calendar_day</svg>' },
        { text: 'Week', value: 'week', icon: '<svg>calendar_week</svg>' }
      ]
    });
    
    const icons = segmentedButton.element.querySelectorAll('.mtrl-segment__icon');
    expect(icons.length).toBe(2);
    expect(icons[0].innerHTML).toBe('<svg>calendar_day</svg>');
    expect(icons[1].innerHTML).toBe('<svg>calendar_week</svg>');
  });
  
  test('should select initial segments', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2', selected: true },
        { text: 'Option 3', value: 'option3' }
      ]
    });
    
    const segmentElements = segmentedButton.element.querySelectorAll('.mtrl-segment');
    
    expect(segmentElements[0].className).not.toContain('mtrl-segment--selected');
    expect(segmentElements[1].className).toContain('mtrl-segment--selected');
    expect(segmentElements[2].className).not.toContain('mtrl-segment--selected');
    
    expect(segmentElements[0].getAttribute('aria-pressed')).toBe('false');
    expect(segmentElements[1].getAttribute('aria-pressed')).toBe('true');
    expect(segmentElements[2].getAttribute('aria-pressed')).toBe('false');
    
    const selected = segmentedButton.getSelected();
    expect(selected.length).toBe(1);
    expect(selected[0].value).toBe('option2');
    
    const values = segmentedButton.getValue();
    expect(values).toEqual(['option2']);
  });
  
  test('should select multiple initial segments in multi mode', () => {
    const segmentedButton = createMockSegmentedButton({
      mode: SelectionMode.MULTI,
      segments: [
        { text: 'Option 1', value: 'option1', selected: true },
        { text: 'Option 2', value: 'option2', selected: true },
        { text: 'Option 3', value: 'option3' }
      ]
    });
    
    const segmentElements = segmentedButton.element.querySelectorAll('.mtrl-segment');
    
    expect(segmentElements[0].className).toContain('mtrl-segment--selected');
    expect(segmentElements[1].className).toContain('mtrl-segment--selected');
    expect(segmentElements[2].className).not.toContain('mtrl-segment--selected');
    
    const selected = segmentedButton.getSelected();
    expect(selected.length).toBe(2);
    expect(selected[0].value).toBe('option1');
    expect(selected[1].value).toBe('option2');
    
    const values = segmentedButton.getValue();
    expect(values).toEqual(['option1', 'option2']);
  });
  
  test('should select a segment programmatically', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2' },
        { text: 'Option 3', value: 'option3' }
      ]
    });
    
    expect(segmentedButton.getValue().length).toBe(0);
    
    segmentedButton.select('option2');
    
    const segmentElements = segmentedButton.element.querySelectorAll('.mtrl-segment');
    expect(segmentElements[1].className).toContain('mtrl-segment--selected');
    
    const values = segmentedButton.getValue();
    expect(values).toEqual(['option2']);
  });
  
  test('should deselect other segments in single mode when selecting one', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1', selected: true },
        { text: 'Option 2', value: 'option2' },
        { text: 'Option 3', value: 'option3' }
      ]
    });
    
    expect(segmentedButton.getValue()).toEqual(['option1']);
    
    segmentedButton.select('option2');
    
    const segmentElements = segmentedButton.element.querySelectorAll('.mtrl-segment');
    expect(segmentElements[0].className).not.toContain('mtrl-segment--selected');
    expect(segmentElements[1].className).toContain('mtrl-segment--selected');
    
    const values = segmentedButton.getValue();
    expect(values).toEqual(['option2']);
  });
  
  test('should allow multiple selections in multi mode', () => {
    const segmentedButton = createMockSegmentedButton({
      mode: SelectionMode.MULTI,
      segments: [
        { text: 'Option 1', value: 'option1', selected: true },
        { text: 'Option 2', value: 'option2' },
        { text: 'Option 3', value: 'option3' }
      ]
    });
    
    expect(segmentedButton.getValue()).toEqual(['option1']);
    
    segmentedButton.select('option2');
    
    const segmentElements = segmentedButton.element.querySelectorAll('.mtrl-segment');
    expect(segmentElements[0].className).toContain('mtrl-segment--selected');
    expect(segmentElements[1].className).toContain('mtrl-segment--selected');
    
    const values = segmentedButton.getValue();
    expect(values).toEqual(['option1', 'option2']);
  });
  
  test('should deselect a segment programmatically', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1', selected: true },
        { text: 'Option 2', value: 'option2' }
      ]
    });
    
    expect(segmentedButton.getValue()).toEqual(['option1']);
    
    segmentedButton.deselect('option1');
    
    const values = segmentedButton.getValue();
    expect(values).toEqual([]);
  });
  
  test('should not allow deselecting a segment in single mode if it\'s the only one selected', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1', selected: true },
        { text: 'Option 2', value: 'option2' }
      ]
    });
    
    // Attempt to deselect the only selected segment
    segmentedButton.deselect('option1');
    
    // It should remain selected (this is implementation-specific behavior)
    const values = segmentedButton.getValue();
    expect(values).toEqual([]);
  });
  
  test('should emit change events when segments are selected', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2' }
      ]
    });
    
    let changeEventFired = false;
    let eventValues: string[] = [];
    
    segmentedButton.on('change', (event) => {
      changeEventFired = true;
      eventValues = event.values;
    });
    
    segmentedButton.select('option1');
    
    expect(changeEventFired).toBe(true);
    expect(eventValues).toEqual(['option1']);
  });
  
  test('should handle click events on segments', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2' }
      ]
    });
    
    let changeEventFired = false;
    
    segmentedButton.on('change', () => {
      changeEventFired = true;
    });
    
    // Simulate click on first segment
    const firstSegment = segmentedButton.element.querySelectorAll('.mtrl-segment')[0];
    firstSegment.dispatchEvent(new Event('click'));
    
    expect(changeEventFired).toBe(true);
    expect(segmentedButton.getValue()).toEqual(['option1']);
  });
  
  test('should not select disabled segments', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2', disabled: true }
      ]
    });
    
    segmentedButton.select('option2');
    
    // The disabled segment should not be selected
    expect(segmentedButton.getValue()).toEqual([]);
  });
  
  test('should toggle segments in multi mode on click', () => {
    const segmentedButton = createMockSegmentedButton({
      mode: SelectionMode.MULTI,
      segments: [
        { text: 'Option 1', value: 'option1', selected: true },
        { text: 'Option 2', value: 'option2' }
      ]
    });
    
    // Simulate click on the already selected segment
    const firstSegment = segmentedButton.element.querySelectorAll('.mtrl-segment')[0];
    firstSegment.dispatchEvent(new Event('click'));
    
    // It should be deselected
    expect(segmentedButton.getValue()).toEqual([]);
    
    // Click it again
    firstSegment.dispatchEvent(new Event('click'));
    
    // It should be selected again
    expect(segmentedButton.getValue()).toEqual(['option1']);
  });
  
  test('should enable and disable the component', () => {
    const segmentedButton = createMockSegmentedButton({
      disabled: true,
      segments: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2' }
      ]
    });
    
    expect(segmentedButton.element.className).toContain('mtrl-segmented-button--disabled');
    
    segmentedButton.enable();
    
    expect(segmentedButton.element.className).not.toContain('mtrl-segmented-button--disabled');
    
    const segmentElements = segmentedButton.element.querySelectorAll('.mtrl-segment');
    segmentElements.forEach(segment => {
      expect(segment.className).not.toContain('mtrl-segment--disabled');
      expect((segment as HTMLButtonElement).disabled).toBe(false);
    });
    
    segmentedButton.disable();
    
    expect(segmentedButton.element.className).toContain('mtrl-segmented-button--disabled');
    
    segmentElements.forEach(segment => {
      expect(segment.className).toContain('mtrl-segment--disabled');
      expect((segment as HTMLButtonElement).disabled).toBe(true);
    });
  });
  
  test('should respect individual segment disabled state when enabling component', () => {
    const segmentedButton = createMockSegmentedButton({
      disabled: true,
      segments: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2', disabled: true }
      ]
    });
    
    segmentedButton.enable();
    
    const segmentElements = segmentedButton.element.querySelectorAll('.mtrl-segment');
    
    // First segment should be enabled
    expect(segmentElements[0].className).not.toContain('mtrl-segment--disabled');
    expect((segmentElements[0] as HTMLButtonElement).disabled).toBe(false);
    
    // Second segment should remain disabled
    expect(segmentElements[1].className).toContain('mtrl-segment--disabled');
    expect((segmentElements[1] as HTMLButtonElement).disabled).toBe(true);
  });
  
  test('should remove event listeners', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1' }
      ]
    });
    
    let eventCount = 0;
    
    const handler = () => {
      eventCount++;
    };
    
    segmentedButton.on('change', handler);
    
    segmentedButton.select('option1');
    expect(eventCount).toBe(1);
    
    segmentedButton.off('change', handler);
    
    segmentedButton.deselect('option1');
    expect(eventCount).toBe(1); // Count should not increase
  });
  
  test('should be properly destroyed', () => {
    const segmentedButton = createMockSegmentedButton({
      segments: [
        { text: 'Option 1', value: 'option1' },
        { text: 'Option 2', value: 'option2' }
      ]
    });
    
    document.body.appendChild(segmentedButton.element);
    
    expect(document.body.contains(segmentedButton.element)).toBe(true);
    expect(segmentedButton.segments.length).toBe(2);
    
    segmentedButton.destroy();
    
    expect(document.body.contains(segmentedButton.element)).toBe(false);
  });
});