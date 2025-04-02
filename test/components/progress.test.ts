// test/components/progress.test.ts
import { describe, test, expect } from 'bun:test';
import { 
  type ProgressComponent,
  type ProgressConfig,
  type ProgressVariant,
  type ProgressEvent
} from '../../src/components/progress/types';

// Constants for progress variants
const PROGRESS_VARIANTS = {
  LINEAR: 'linear',
  CIRCULAR: 'circular'
} as const;

// Constants for progress events
const PROGRESS_EVENTS = {
  CHANGE: 'change',
  COMPLETE: 'complete'
} as const;

// Mock progress component implementation
const createMockProgress = (config: ProgressConfig = {}): ProgressComponent => {
  // Create main elements
  const element = document.createElement('div');
  element.className = 'mtrl-progress';
  
  const trackElement = document.createElement('div');
  trackElement.className = 'mtrl-progress-track';
  
  const indicatorElement = document.createElement('div');
  indicatorElement.className = 'mtrl-progress-indicator';
  
  // Default settings
  const settings = {
    variant: config.variant || PROGRESS_VARIANTS.LINEAR,
    value: config.value !== undefined ? config.value : 0,
    max: config.max !== undefined ? config.max : 100,
    buffer: config.buffer !== undefined ? config.buffer : 0,
    disabled: config.disabled || false,
    indeterminate: config.indeterminate || false,
    showLabel: config.showLabel || false,
    labelFormatter: config.labelFormatter || ((value, max) => `${Math.round((value/max) * 100)}%`),
    componentName: 'progress',
    prefix: config.prefix || 'mtrl'
  };
  
  // Apply variant class
  element.classList.add(`mtrl-progress--${settings.variant}`);
  
  // Apply disabled state
  if (settings.disabled) {
    element.classList.add('mtrl-progress--disabled');
  }
  
  // Apply indeterminate state
  if (settings.indeterminate) {
    element.classList.add('mtrl-progress--indeterminate');
  }
  
  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  // Create buffer element for linear variant
  let bufferElement: HTMLElement | undefined;
  if (settings.variant === PROGRESS_VARIANTS.LINEAR) {
    bufferElement = document.createElement('div');
    bufferElement.className = 'mtrl-progress-buffer';
    trackElement.appendChild(bufferElement);
  }
  
  // Create label element if enabled
  let labelElement: HTMLElement | undefined;
  if (settings.showLabel) {
    labelElement = document.createElement('div');
    labelElement.className = 'mtrl-progress-label';
    labelElement.textContent = settings.labelFormatter(settings.value, settings.max);
  }
  
  // Assemble elements
  trackElement.appendChild(indicatorElement);
  element.appendChild(trackElement);
  
  if (labelElement) {
    element.appendChild(labelElement);
  }
  
  // Track event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Update visuals based on current value
  const updateVisuals = () => {
    if (!settings.indeterminate) {
      const percentage = (settings.value / settings.max) * 100;
      
      if (settings.variant === PROGRESS_VARIANTS.LINEAR) {
        indicatorElement.style.width = `${percentage}%`;
        
        if (bufferElement) {
          const bufferPercentage = (settings.buffer / settings.max) * 100;
          bufferElement.style.width = `${bufferPercentage}%`;
        }
      } else if (settings.variant === PROGRESS_VARIANTS.CIRCULAR) {
        // For circular progress, update stroke-dashoffset or similar property
        const circumference = 100; // Simplified for testing
        const offset = circumference - (percentage / 100 * circumference);
        indicatorElement.style.setProperty('--progress-offset', `${offset}`);
      }
      
      // Update label if present
      if (labelElement) {
        labelElement.textContent = settings.labelFormatter(settings.value, settings.max);
      }
    }
  };
  
  // Initialize visuals
  updateVisuals();
  
  // Emit an event
  const emit = (event: string, data?: any) => {
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(handler => handler(data));
    }
  };
  
  // Create the progress component
  const progress: ProgressComponent = {
    element,
    trackElement,
    indicatorElement,
    bufferElement,
    labelElement,
    
    getClass: (name: string) => {
      const prefix = settings.prefix;
      return name ? `${prefix}-${name}` : `${prefix}-progress`;
    },
    
    setValue: (value: number) => {
      // Ensure value is within bounds
      value = Math.max(0, Math.min(value, settings.max));
      
      const oldValue = settings.value;
      settings.value = value;
      
      // Update visuals
      updateVisuals();
      
      // Emit change event
      emit(PROGRESS_EVENTS.CHANGE, { value, oldValue });
      
      // Emit complete event if reached 100%
      if (value === settings.max && oldValue !== settings.max) {
        emit(PROGRESS_EVENTS.COMPLETE, { value });
      }
      
      return progress;
    },
    
    getValue: () => settings.value,
    
    setBuffer: (value: number) => {
      // Ensure buffer is within bounds
      value = Math.max(0, Math.min(value, settings.max));
      settings.buffer = value;
      
      // Update visuals
      updateVisuals();
      
      return progress;
    },
    
    getBuffer: () => settings.buffer,
    
    enable: () => {
      progress.disabled.enable();
      return progress;
    },
    
    disable: () => {
      progress.disabled.disable();
      return progress;
    },
    
    isDisabled: () => progress.disabled.isDisabled(),
    
    showLabel: () => {
      settings.showLabel = true;
      
      if (!labelElement) {
        labelElement = document.createElement('div');
        labelElement.className = 'mtrl-progress-label';
        labelElement.textContent = settings.labelFormatter(settings.value, settings.max);
        element.appendChild(labelElement);
        progress.labelElement = labelElement;
      }
      
      return progress;
    },
    
    hideLabel: () => {
      settings.showLabel = false;
      
      if (labelElement) {
        element.removeChild(labelElement);
        labelElement = undefined;
        progress.labelElement = undefined;
      }
      
      return progress;
    },
    
    setLabelFormatter: (formatter: (value: number, max: number) => string) => {
      settings.labelFormatter = formatter;
      
      if (labelElement) {
        labelElement.textContent = formatter(settings.value, settings.max);
      }
      
      return progress;
    },
    
    setIndeterminate: (indeterminate: boolean) => {
      settings.indeterminate = indeterminate;
      
      if (indeterminate) {
        element.classList.add('mtrl-progress--indeterminate');
      } else {
        element.classList.remove('mtrl-progress--indeterminate');
        updateVisuals();
      }
      
      return progress;
    },
    
    isIndeterminate: () => settings.indeterminate,
    
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      return progress;
    },
    
    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      
      return progress;
    },
    
    destroy: () => {
      // Remove element from DOM if it has a parent
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Clear event handlers
      for (const event in eventHandlers) {
        eventHandlers[event] = [];
      }
    },
    
    addClass: (...classes: string[]) => {
      classes.forEach(className => element.classList.add(className));
      return progress;
    },
    
    disabled: {
      enable: () => {
        settings.disabled = false;
        element.classList.remove('mtrl-progress--disabled');
      },
      
      disable: () => {
        settings.disabled = true;
        element.classList.add('mtrl-progress--disabled');
      },
      
      isDisabled: () => settings.disabled
    },
    
    lifecycle: {
      destroy: () => {
        progress.destroy();
      }
    }
  };
  
  return progress;
};

describe('Progress Component', () => {
  test('should create a progress element', () => {
    const progress = createMockProgress();
    
    expect(progress.element).toBeDefined();
    expect(progress.element.tagName).toBe('DIV');
    expect(progress.element.className).toContain('mtrl-progress');
    
    expect(progress.trackElement).toBeDefined();
    expect(progress.trackElement.className).toContain('mtrl-progress-track');
    
    expect(progress.indicatorElement).toBeDefined();
    expect(progress.indicatorElement.className).toContain('mtrl-progress-indicator');
  });
  
  test('should apply linear variant by default', () => {
    const progress = createMockProgress();
    
    expect(progress.element.className).toContain('mtrl-progress--linear');
    expect(progress.bufferElement).toBeDefined();
  });
  
  test('should apply circular variant when specified', () => {
    const progress = createMockProgress({
      variant: PROGRESS_VARIANTS.CIRCULAR
    });
    
    expect(progress.element.className).toContain('mtrl-progress--circular');
    expect(progress.bufferElement).toBeUndefined();
  });
  
  test('should set initial value', () => {
    const progress = createMockProgress({
      value: 25
    });
    
    expect(progress.getValue()).toBe(25);
    expect(progress.indicatorElement.style.width).toBe('25%');
  });
  
  test('should set initial buffer value', () => {
    const progress = createMockProgress({
      buffer: 50
    });
    
    expect(progress.getBuffer()).toBe(50);
    expect(progress.bufferElement?.style.width).toBe('50%');
  });
  
  test('should apply disabled state', () => {
    const progress = createMockProgress({
      disabled: true
    });
    
    expect(progress.element.className).toContain('mtrl-progress--disabled');
    expect(progress.isDisabled()).toBe(true);
  });
  
  test('should apply indeterminate state', () => {
    const progress = createMockProgress({
      indeterminate: true
    });
    
    expect(progress.element.className).toContain('mtrl-progress--indeterminate');
    expect(progress.isIndeterminate()).toBe(true);
  });
  
  test('should show label when configured', () => {
    const progress = createMockProgress({
      showLabel: true,
      value: 75
    });
    
    expect(progress.labelElement).toBeDefined();
    expect(progress.labelElement?.textContent).toBe('75%');
  });
  
  test('should use custom label formatter', () => {
    const formatter = (value: number, max: number) => `${value} of ${max}`;
    
    const progress = createMockProgress({
      showLabel: true,
      value: 50,
      max: 200,
      labelFormatter: formatter
    });
    
    expect(progress.labelElement?.textContent).toBe('50 of 200');
  });
  
  test('should update value and appearance', () => {
    const progress = createMockProgress({
      value: 0
    });
    
    expect(progress.getValue()).toBe(0);
    expect(progress.indicatorElement.style.width).toBe('0%');
    
    progress.setValue(60);
    
    expect(progress.getValue()).toBe(60);
    expect(progress.indicatorElement.style.width).toBe('60%');
  });
  
  test('should update buffer value', () => {
    const progress = createMockProgress();
    
    expect(progress.getBuffer()).toBe(0);
    
    progress.setBuffer(75);
    
    expect(progress.getBuffer()).toBe(75);
    expect(progress.bufferElement?.style.width).toBe('75%');
  });
  
  test('should constrain values within bounds', () => {
    const progress = createMockProgress({
      max: 100
    });
    
    progress.setValue(-10);
    expect(progress.getValue()).toBe(0);
    
    progress.setValue(150);
    expect(progress.getValue()).toBe(100);
    
    progress.setBuffer(-20);
    expect(progress.getBuffer()).toBe(0);
    
    progress.setBuffer(200);
    expect(progress.getBuffer()).toBe(100);
  });
  
  test('should toggle disabled state', () => {
    const progress = createMockProgress();
    
    expect(progress.isDisabled()).toBe(false);
    
    progress.disable();
    
    expect(progress.isDisabled()).toBe(true);
    expect(progress.element.className).toContain('mtrl-progress--disabled');
    
    progress.enable();
    
    expect(progress.isDisabled()).toBe(false);
    expect(progress.element.className).not.toContain('mtrl-progress--disabled');
  });
  
  test('should toggle indeterminate state', () => {
    const progress = createMockProgress();
    
    expect(progress.isIndeterminate()).toBe(false);
    
    progress.setIndeterminate(true);
    
    expect(progress.isIndeterminate()).toBe(true);
    expect(progress.element.className).toContain('mtrl-progress--indeterminate');
    
    progress.setIndeterminate(false);
    
    expect(progress.isIndeterminate()).toBe(false);
    expect(progress.element.className).not.toContain('mtrl-progress--indeterminate');
  });
  
  test('should show and hide label', () => {
    const progress = createMockProgress();
    
    expect(progress.labelElement).toBeUndefined();
    
    progress.showLabel();
    
    expect(progress.labelElement).toBeDefined();
    expect(progress.element.contains(progress.labelElement)).toBe(true);
    
    progress.hideLabel();
    
    expect(progress.labelElement).toBeUndefined();
    expect(progress.element.querySelector('.mtrl-progress-label')).toBeNull();
  });
  
  test('should update label formatter', () => {
    const progress = createMockProgress({
      showLabel: true,
      value: 50
    });
    
    expect(progress.labelElement?.textContent).toBe('50%');
    
    progress.setLabelFormatter((value) => `${value} units`);
    
    expect(progress.labelElement?.textContent).toBe('50 units');
  });
  
  test('should emit change event when value changes', () => {
    const progress = createMockProgress();
    let changeEventFired = false;
    let eventData = null;
    
    progress.on(PROGRESS_EVENTS.CHANGE, (data) => {
      changeEventFired = true;
      eventData = data;
    });
    
    progress.setValue(50);
    
    expect(changeEventFired).toBe(true);
    expect(eventData).toEqual({ value: 50, oldValue: 0 });
  });
  
  test('should emit complete event when reaching max', () => {
    const progress = createMockProgress({
      value: 50,
      max: 100
    });
    
    let completeEventFired = false;
    
    progress.on(PROGRESS_EVENTS.COMPLETE, () => {
      completeEventFired = true;
    });
    
    progress.setValue(99);
    expect(completeEventFired).toBe(false);
    
    progress.setValue(100);
    expect(completeEventFired).toBe(true);
  });
  
  test('should remove event listeners', () => {
    const progress = createMockProgress();
    let eventCount = 0;
    
    const handler = () => {
      eventCount++;
    };
    
    progress.on(PROGRESS_EVENTS.CHANGE, handler);
    
    progress.setValue(10);
    expect(eventCount).toBe(1);
    
    progress.off(PROGRESS_EVENTS.CHANGE, handler);
    
    progress.setValue(20);
    expect(eventCount).toBe(1); // Count should not increase
  });
  
  test('should add CSS classes', () => {
    const progress = createMockProgress();
    
    progress.addClass('custom-class', 'special-progress');
    
    expect(progress.element.className).toContain('custom-class');
    expect(progress.element.className).toContain('special-progress');
  });
  
  test('should be properly destroyed', () => {
    const progress = createMockProgress();
    document.body.appendChild(progress.element);
    
    expect(document.body.contains(progress.element)).toBe(true);
    
    progress.destroy();
    
    expect(document.body.contains(progress.element)).toBe(false);
  });
});