// test/components/slider.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { 
  type SliderComponent,
  type SliderConfig,
  type SliderColor,
  type SliderSize,
  type SliderEventType,
  type SliderEvent
} from '../../src/components/slider/types';

// Setup jsdom environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;

beforeAll(() => {
  // Create a new JSDOM instance
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true
  });
  
  // Get window and document from jsdom
  window = dom.window;
  document = window.document;
  
  // Store original globals
  originalGlobalDocument = global.document;
  originalGlobalWindow = global.window;
  
  // Set globals to use jsdom
  global.document = document;
  global.window = window;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.HTMLButtonElement = window.HTMLButtonElement;
  global.Event = window.Event;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  
  // Clean up jsdom
  window.close();
});

// Constants for slider colors
const SLIDER_COLORS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  ERROR: 'error'
} as const;

// Constants for slider sizes
const SLIDER_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const;

// Constants for slider events
const SLIDER_EVENTS = {
  CHANGE: 'change',
  INPUT: 'input',
  FOCUS: 'focus',
  BLUR: 'blur',
  START: 'start',
  END: 'end'
} as const;

// Mock slider implementation
const createMockSlider = (config: SliderConfig = {}): SliderComponent => {
  // Create main container element
  const element = document.createElement('div');
  element.className = 'mtrl-slider';
  
  // Default settings
  const settings = {
    min: config.min !== undefined ? config.min : 0,
    max: config.max !== undefined ? config.max : 100,
    value: config.value !== undefined ? config.value : 0,
    secondValue: config.secondValue,
    step: config.step !== undefined ? config.step : 1,
    disabled: config.disabled || false,
    color: config.color || SLIDER_COLORS.PRIMARY,
    size: config.size || SLIDER_SIZES.MEDIUM,
    ticks: config.ticks || false,
    valueFormatter: config.valueFormatter || ((value: number) => value.toString()),
    showValue: config.showValue || false,
    snapToSteps: config.snapToSteps !== undefined ? config.snapToSteps : false,
    range: config.range || false,
    label: config.label || '',
    labelPosition: config.labelPosition || 'start',
    icon: config.icon || '',
    iconPosition: config.iconPosition || 'start'
  };
  
  // Apply color class
  element.classList.add(`mtrl-slider--${settings.color}`);
  
  // Apply size class
  element.classList.add(`mtrl-slider--${settings.size}`);
  
  // Apply disabled state
  if (settings.disabled) {
    element.classList.add('mtrl-slider--disabled');
  }
  
  // Apply ticks class
  if (settings.ticks) {
    element.classList.add('mtrl-slider--ticks');
  }
  
  // Apply range class
  if (settings.range) {
    element.classList.add('mtrl-slider--range');
  }
  
  // Apply label position class
  if (settings.label) {
    element.classList.add(`mtrl-slider--label-${settings.labelPosition}`);
  }
  
  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  // Create label if provided
  let labelElement: HTMLElement | null = null;
  if (settings.label) {
    labelElement = document.createElement('label');
    labelElement.className = 'mtrl-slider__label';
    labelElement.textContent = settings.label;
    element.appendChild(labelElement);
  }
  
  // Create icon if provided
  let iconElement: HTMLElement | null = null;
  if (settings.icon) {
    iconElement = document.createElement('span');
    iconElement.className = `mtrl-slider__icon mtrl-slider__icon--${settings.iconPosition}`;
    iconElement.innerHTML = settings.icon;
    element.appendChild(iconElement);
  }
  
  // Create slider track
  const track = document.createElement('div');
  track.className = 'mtrl-slider__track';
  
  // Create slider fill (progress)
  const fill = document.createElement('div');
  fill.className = 'mtrl-slider__fill';
  track.appendChild(fill);
  
  // Create ticks if enabled
  if (settings.ticks) {
    const ticksContainer = document.createElement('div');
    ticksContainer.className = 'mtrl-slider__ticks';
    
    // Calculate number of ticks based on step
    const numTicks = Math.floor((settings.max - settings.min) / settings.step) + 1;
    for (let i = 0; i < numTicks; i++) {
      const tick = document.createElement('div');
      tick.className = 'mtrl-slider__tick';
      ticksContainer.appendChild(tick);
    }
    
    track.appendChild(ticksContainer);
  }
  
  // Create thumb (handle)
  const thumb = document.createElement('div');
  thumb.className = 'mtrl-slider__thumb';
  
  // Create second thumb for range slider
  let secondThumb: HTMLElement | null = null;
  if (settings.range) {
    secondThumb = document.createElement('div');
    secondThumb.className = 'mtrl-slider__thumb mtrl-slider__thumb--second';
  }
  
  // Create value display if enabled
  let valueElement: HTMLElement | null = null;
  if (settings.showValue) {
    valueElement = document.createElement('div');
    valueElement.className = 'mtrl-slider__value';
    valueElement.textContent = settings.valueFormatter(settings.value);
    thumb.appendChild(valueElement);
    
    if (settings.range && secondThumb) {
      const secondValueElement = document.createElement('div');
      secondValueElement.className = 'mtrl-slider__value';
      secondValueElement.textContent = settings.valueFormatter(settings.secondValue || settings.min);
      secondThumb.appendChild(secondValueElement);
    }
  }
  
  // Add thumbs to track
  track.appendChild(thumb);
  if (settings.range && secondThumb) {
    track.appendChild(secondThumb);
  }
  
  // Add track to container
  element.appendChild(track);
  
  // Update UI based on current values
  const updateSliderUI = () => {
    const range = settings.max - settings.min;
    
    // Calculate percentage for first thumb
    const percent = ((settings.value - settings.min) / range) * 100;
    
    // Set fill width and thumb position
    if (settings.range && settings.secondValue !== undefined) {
      // For range slider, fill is between the two thumbs
      const secondPercent = ((settings.secondValue - settings.min) / range) * 100;
      const startPercent = Math.min(percent, secondPercent);
      const endPercent = Math.max(percent, secondPercent);
      
      fill.style.left = `${startPercent}%`;
      fill.style.width = `${endPercent - startPercent}%`;
      
      thumb.style.left = `${percent}%`;
      if (secondThumb) {
        secondThumb.style.left = `${secondPercent}%`;
      }
    } else {
      // For regular slider, fill starts from beginning
      fill.style.width = `${percent}%`;
      thumb.style.left = `${percent}%`;
    }
    
    // Update value display if present
    if (valueElement) {
      valueElement.textContent = settings.valueFormatter(settings.value);
      
      if (settings.range && secondThumb && settings.secondValue !== undefined) {
        const secondValueEl = secondThumb.querySelector('.mtrl-slider__value');
        if (secondValueEl) {
          secondValueEl.textContent = settings.valueFormatter(settings.secondValue);
        }
      }
    }
  };
  
  // Initialize slider UI
  updateSliderUI();
  
  // Track event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Emit an event
  const emit = (event: SliderEventType, originalEvent?: Event | null) => {
    let defaultPrevented = false;
    
    const eventData: SliderEvent = {
      slider,
      value: settings.value,
      secondValue: settings.range ? settings.secondValue || null : null,
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
  
  // Create the slider component
  const slider: SliderComponent = {
    element,
    
    setValue: (value: number, triggerEvent: boolean = false) => {
      // Ensure value is within min/max bounds
      value = Math.max(settings.min, Math.min(settings.max, value));
      
      // Snap to nearest step if enabled
      if (settings.snapToSteps && settings.step > 0) {
        value = Math.round((value - settings.min) / settings.step) * settings.step + settings.min;
      }
      
      // Update value
      settings.value = value;
      
      // Update UI
      updateSliderUI();
      
      // Emit events if requested
      if (triggerEvent) {
        emit(SLIDER_EVENTS.INPUT);
        emit(SLIDER_EVENTS.CHANGE);
      }
      
      return slider;
    },
    
    getValue: () => settings.value,
    
    setSecondValue: (value: number, triggerEvent: boolean = false) => {
      if (!settings.range) return slider;
      
      // Ensure value is within min/max bounds
      value = Math.max(settings.min, Math.min(settings.max, value));
      
      // Snap to nearest step if enabled
      if (settings.snapToSteps && settings.step > 0) {
        value = Math.round((value - settings.min) / settings.step) * settings.step + settings.min;
      }
      
      // Update value
      settings.secondValue = value;
      
      // Update UI
      updateSliderUI();
      
      // Emit events if requested
      if (triggerEvent) {
        emit(SLIDER_EVENTS.INPUT);
        emit(SLIDER_EVENTS.CHANGE);
      }
      
      return slider;
    },
    
    getSecondValue: () => {
      return settings.range ? settings.secondValue || null : null;
    },
    
    setMin: (min: number) => {
      settings.min = min;
      
      // Adjust values if they're now outside bounds
      if (settings.value < min) {
        settings.value = min;
      }
      
      if (settings.range && settings.secondValue !== undefined && settings.secondValue < min) {
        settings.secondValue = min;
      }
      
      // Update ticks if enabled
      if (settings.ticks) {
        const ticksContainer = element.querySelector('.mtrl-slider__ticks');
        if (ticksContainer) {
          ticksContainer.innerHTML = '';
          
          const numTicks = Math.floor((settings.max - settings.min) / settings.step) + 1;
          for (let i = 0; i < numTicks; i++) {
            const tick = document.createElement('div');
            tick.className = 'mtrl-slider__tick';
            ticksContainer.appendChild(tick);
          }
        }
      }
      
      // Update UI
      updateSliderUI();
      
      return slider;
    },
    
    getMin: () => settings.min,
    
    setMax: (max: number) => {
      settings.max = max;
      
      // Adjust values if they're now outside bounds
      if (settings.value > max) {
        settings.value = max;
      }
      
      if (settings.range && settings.secondValue !== undefined && settings.secondValue > max) {
        settings.secondValue = max;
      }
      
      // Update ticks if enabled
      if (settings.ticks) {
        const ticksContainer = element.querySelector('.mtrl-slider__ticks');
        if (ticksContainer) {
          ticksContainer.innerHTML = '';
          
          const numTicks = Math.floor((settings.max - settings.min) / settings.step) + 1;
          for (let i = 0; i < numTicks; i++) {
            const tick = document.createElement('div');
            tick.className = 'mtrl-slider__tick';
            ticksContainer.appendChild(tick);
          }
        }
      }
      
      // Update UI
      updateSliderUI();
      
      return slider;
    },
    
    getMax: () => settings.max,
    
    setStep: (step: number) => {
      settings.step = step;
      
      // Update ticks if enabled
      if (settings.ticks) {
        const ticksContainer = element.querySelector('.mtrl-slider__ticks');
        if (ticksContainer) {
          ticksContainer.innerHTML = '';
          
          const numTicks = Math.floor((settings.max - settings.min) / settings.step) + 1;
          for (let i = 0; i < numTicks; i++) {
            const tick = document.createElement('div');
            tick.className = 'mtrl-slider__tick';
            ticksContainer.appendChild(tick);
          }
        }
      }
      
      // Snap current values to new step if enabled
      if (settings.snapToSteps) {
        settings.value = Math.round((settings.value - settings.min) / step) * step + settings.min;
        
        if (settings.range && settings.secondValue !== undefined) {
          settings.secondValue = Math.round((settings.secondValue - settings.min) / step) * step + settings.min;
        }
        
        // Update UI
        updateSliderUI();
      }
      
      return slider;
    },
    
    getStep: () => settings.step,
    
    enable: () => {
      settings.disabled = false;
      element.classList.remove('mtrl-slider--disabled');
      return slider;
    },
    
    disable: () => {
      settings.disabled = true;
      element.classList.add('mtrl-slider--disabled');
      return slider;
    },
    
    isDisabled: () => settings.disabled,
    
    setColor: (color: SliderColor) => {
      // Remove existing color class
      Object.values(SLIDER_COLORS).forEach(c => {
        element.classList.remove(`mtrl-slider--${c}`);
      });
      
      // Add new color class
      element.classList.add(`mtrl-slider--${color}`);
      settings.color = color;
      
      return slider;
    },
    
    getColor: () => settings.color,
    
    setSize: (size: SliderSize) => {
      // Remove existing size class
      Object.values(SLIDER_SIZES).forEach(s => {
        element.classList.remove(`mtrl-slider--${s}`);
      });
      
      // Add new size class
      element.classList.add(`mtrl-slider--${size}`);
      settings.size = size;
      
      return slider;
    },
    
    getSize: () => settings.size,
    
    showTicks: (show: boolean) => {
      settings.ticks = show;
      
      if (show) {
        element.classList.add('mtrl-slider--ticks');
        
        // Create ticks if they don't exist
        let ticksContainer = element.querySelector('.mtrl-slider__ticks');
        if (!ticksContainer) {
          ticksContainer = document.createElement('div');
          ticksContainer.className = 'mtrl-slider__ticks';
          
          const numTicks = Math.floor((settings.max - settings.min) / settings.step) + 1;
          for (let i = 0; i < numTicks; i++) {
            const tick = document.createElement('div');
            tick.className = 'mtrl-slider__tick';
            ticksContainer.appendChild(tick);
          }
          
          const track = element.querySelector('.mtrl-slider__track');
          if (track) {
            track.appendChild(ticksContainer);
          }
        }
      } else {
        element.classList.remove('mtrl-slider--ticks');
        
        // Remove ticks if they exist
        const ticksContainer = element.querySelector('.mtrl-slider__ticks');
        if (ticksContainer) {
          ticksContainer.remove();
        }
      }
      
      return slider;
    },
    
    showCurrentValue: (show: boolean) => {
      settings.showValue = show;
      
      if (show) {
        // Create value display for main thumb if it doesn't exist
        let valueEl = thumb.querySelector('.mtrl-slider__value');
        if (!valueEl) {
          valueEl = document.createElement('div');
          valueEl.className = 'mtrl-slider__value';
          valueEl.textContent = settings.valueFormatter(settings.value);
          thumb.appendChild(valueEl);
        }
        
        // Create value display for second thumb if range slider
        if (settings.range && secondThumb) {
          let secondValueEl = secondThumb.querySelector('.mtrl-slider__value');
          if (!secondValueEl) {
            secondValueEl = document.createElement('div');
            secondValueEl.className = 'mtrl-slider__value';
            secondValueEl.textContent = settings.valueFormatter(settings.secondValue || settings.min);
            secondThumb.appendChild(secondValueEl);
          }
        }
      } else {
        // Remove value display from main thumb
        const valueEl = thumb.querySelector('.mtrl-slider__value');
        if (valueEl) {
          valueEl.remove();
        }
        
        // Remove value display from second thumb
        if (settings.range && secondThumb) {
          const secondValueEl = secondThumb.querySelector('.mtrl-slider__value');
          if (secondValueEl) {
            secondValueEl.remove();
          }
        }
      }
      
      return slider;
    },
    
    setLabel: (text: string) => {
      settings.label = text;
      
      if (text) {
        if (!labelElement) {
          labelElement = document.createElement('label');
          labelElement.className = 'mtrl-slider__label';
          element.insertBefore(labelElement, element.firstChild);
          
          // Apply label position class
          element.classList.add(`mtrl-slider--label-${settings.labelPosition}`);
        }
        
        labelElement.textContent = text;
      } else if (labelElement) {
        labelElement.remove();
        labelElement = null;
        
        // Remove label position class
        element.classList.remove(`mtrl-slider--label-${settings.labelPosition}`);
      }
      
      return slider;
    },
    
    getLabel: () => settings.label,
    
    setIcon: (iconHtml: string) => {
      settings.icon = iconHtml;
      
      if (iconHtml) {
        if (!iconElement) {
          iconElement = document.createElement('span');
          iconElement.className = `mtrl-slider__icon mtrl-slider__icon--${settings.iconPosition}`;
          
          if (settings.iconPosition === 'start') {
            element.insertBefore(iconElement, element.firstChild);
          } else {
            element.appendChild(iconElement);
          }
        }
        
        iconElement.innerHTML = iconHtml;
      } else if (iconElement) {
        iconElement.remove();
        iconElement = null;
      }
      
      return slider;
    },
    
    getIcon: () => settings.icon,
    
    on: (event: SliderEventType, handler: (event: SliderEvent) => void) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      return slider;
    },
    
    off: (event: SliderEventType, handler: (event: SliderEvent) => void) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      
      return slider;
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
    }
  };
  
  return slider;
};

describe('Slider Component', () => {
  test('should create a slider element', () => {
    const slider = createMockSlider();
    
    expect(slider.element).toBeDefined();
    expect(slider.element.tagName).toBe('DIV');
    expect(slider.element.className).toContain('mtrl-slider');
    
    const track = slider.element.querySelector('.mtrl-slider__track');
    expect(track).toBeDefined();
    
    const fill = slider.element.querySelector('.mtrl-slider__fill');
    expect(fill).toBeDefined();
    
    const thumb = slider.element.querySelector('.mtrl-slider__thumb');
    expect(thumb).toBeDefined();
  });
  
  test('should apply primary color by default', () => {
    const slider = createMockSlider();
    expect(slider.element.className).toContain('mtrl-slider--primary');
  });
  
  test('should apply different colors', () => {
    const colors: SliderColor[] = [
      SLIDER_COLORS.PRIMARY,
      SLIDER_COLORS.SECONDARY,
      SLIDER_COLORS.TERTIARY,
      SLIDER_COLORS.ERROR
    ];
    
    colors.forEach(color => {
      const slider = createMockSlider({ color });
      expect(slider.element.className).toContain(`mtrl-slider--${color}`);
    });
  });
  
  test('should apply medium size by default', () => {
    const slider = createMockSlider();
    expect(slider.element.className).toContain('mtrl-slider--medium');
  });
  
  test('should apply different sizes', () => {
    const sizes: SliderSize[] = [
      SLIDER_SIZES.SMALL,
      SLIDER_SIZES.MEDIUM,
      SLIDER_SIZES.LARGE
    ];
    
    sizes.forEach(size => {
      const slider = createMockSlider({ size });
      expect(slider.element.className).toContain(`mtrl-slider--${size}`);
    });
  });
  
  test('should set initial value', () => {
    const slider = createMockSlider({
      min: 0,
      max: 100,
      value: 50
    });
    
    expect(slider.getValue()).toBe(50);
    
    const fill = slider.element.querySelector('.mtrl-slider__fill');
    expect(fill?.style.width).toBe('50%');
    
    const thumb = slider.element.querySelector('.mtrl-slider__thumb');
    expect(thumb?.style.left).toBe('50%');
  });
  
  test('should support range slider with two thumbs', () => {
    const slider = createMockSlider({
      range: true,
      value: 25,
      secondValue: 75
    });
    
    expect(slider.element.className).toContain('mtrl-slider--range');
    expect(slider.getValue()).toBe(25);
    expect(slider.getSecondValue()).toBe(75);
    
    const thumbs = slider.element.querySelectorAll('.mtrl-slider__thumb');
    expect(thumbs.length).toBe(2);
    expect(thumbs[0].style.left).toBe('25%');
    expect(thumbs[1].style.left).toBe('75%');
    
    const fill = slider.element.querySelector('.mtrl-slider__fill');
    expect(fill?.style.left).toBe('25%');
    expect(fill?.style.width).toBe('50%');
  });
  
  test('should display tick marks when configured', () => {
    const slider = createMockSlider({
      min: 0,
      max: 10,
      step: 2,
      ticks: true
    });
    
    expect(slider.element.className).toContain('mtrl-slider--ticks');
    
    const ticksContainer = slider.element.querySelector('.mtrl-slider__ticks');
    expect(ticksContainer).toBeDefined();
    
    const ticks = slider.element.querySelectorAll('.mtrl-slider__tick');
    // Should have 6 ticks for values 0, 2, 4, 6, 8, 10
    expect(ticks.length).toBe(6);
  });
  
  test('should display current value when configured', () => {
    const slider = createMockSlider({
      value: 50,
      showValue: true
    });
    
    const valueElement = slider.element.querySelector('.mtrl-slider__value');
    expect(valueElement).toBeDefined();
    expect(valueElement?.textContent).toBe('50');
  });
  
  test('should apply custom value formatter', () => {
    const formatter = (value: number) => `$${value}`;
    
    const slider = createMockSlider({
      value: 50,
      showValue: true,
      valueFormatter: formatter
    });
    
    const valueElement = slider.element.querySelector('.mtrl-slider__value');
    expect(valueElement?.textContent).toBe('$50');
  });
  
  test('should apply disabled state', () => {
    const slider = createMockSlider({
      disabled: true
    });
    
    expect(slider.element.className).toContain('mtrl-slider--disabled');
    expect(slider.isDisabled()).toBe(true);
  });
  
  test('should set label', () => {
    const slider = createMockSlider({
      label: 'Volume'
    });
    
    const label = slider.element.querySelector('.mtrl-slider__label');
    expect(label).toBeDefined();
    expect(label?.textContent).toBe('Volume');
    expect(slider.getLabel()).toBe('Volume');
  });
  
  test('should set label position', () => {
    const slider = createMockSlider({
      label: 'Volume',
      labelPosition: 'end'
    });
    
    expect(slider.element.className).toContain('mtrl-slider--label-end');
  });
  
  test('should set icon', () => {
    const iconHtml = '<svg>volume</svg>';
    
    const slider = createMockSlider({
      icon: iconHtml
    });
    
    const icon = slider.element.querySelector('.mtrl-slider__icon');
    expect(icon).toBeDefined();
    expect(icon?.innerHTML).toBe(iconHtml);
    expect(slider.getIcon()).toBe(iconHtml);
  });
  
  test('should set icon position', () => {
    const slider = createMockSlider({
      icon: '<svg>volume</svg>',
      iconPosition: 'end'
    });
    
    const icon = slider.element.querySelector('.mtrl-slider__icon');
    expect(icon?.className).toContain('mtrl-slider__icon--end');
  });
  
  test('should update value', () => {
    const slider = createMockSlider({
      min: 0,
      max: 100,
      value: 0
    });
    
    expect(slider.getValue()).toBe(0);
    
    slider.setValue(75);
    
    expect(slider.getValue()).toBe(75);
    
    const fill = slider.element.querySelector('.mtrl-slider__fill');
    expect(fill?.style.width).toBe('75%');
    
    const thumb = slider.element.querySelector('.mtrl-slider__thumb');
    expect(thumb?.style.left).toBe('75%');
  });
  
  test('should constrain value to min/max range', () => {
    const slider = createMockSlider({
      min: 0,
      max: 100,
      value: 50
    });
    
    slider.setValue(-10);
    expect(slider.getValue()).toBe(0);
    
    slider.setValue(150);
    expect(slider.getValue()).toBe(100);
  });
  
  test('should snap to steps when configured', () => {
    const slider = createMockSlider({
      min: 0,
      max: 10,
      step: 2,
      snapToSteps: true
    });
    
    slider.setValue(3);
    // Rounding to nearest step, 3 is closer to 4 than 2
    expect(slider.getValue()).toBe(4); // Snaps to nearest step (4)
    
    slider.setValue(5.1);
    // Rounding to nearest step, 5.1 is closer to 6 than 4
    expect(slider.getValue()).toBe(6); // Snaps to nearest step (6)
  });
  
  test('should update second value for range slider', () => {
    const slider = createMockSlider({
      range: true,
      value: 25,
      secondValue: 75
    });
    
    slider.setSecondValue(60);
    
    expect(slider.getSecondValue()).toBe(60);
    
    const secondThumb = slider.element.querySelector('.mtrl-slider__thumb--second');
    expect(secondThumb?.style.left).toBe('60%');
    
    const fill = slider.element.querySelector('.mtrl-slider__fill');
    expect(fill?.style.left).toBe('25%');
    expect(fill?.style.width).toBe('35%');
  });
  
  test('should update min value', () => {
    const slider = createMockSlider({
      min: 0,
      max: 100,
      value: 50
    });
    
    slider.setMin(20);
    
    expect(slider.getMin()).toBe(20);
    
    // Value percentage should now be (50-20)/(100-20) = 30/80 = 37.5%
    const fill = slider.element.querySelector('.mtrl-slider__fill');
    expect(fill?.style.width).toBe('37.5%');
  });
  
  test('should update max value', () => {
    const slider = createMockSlider({
      min: 0,
      max: 100,
      value: 50
    });
    
    slider.setMax(200);
    
    expect(slider.getMax()).toBe(200);
    
    // Value percentage should now be (50-0)/(200-0) = 50/200 = 25%
    const fill = slider.element.querySelector('.mtrl-slider__fill');
    expect(fill?.style.width).toBe('25%');
  });
  
  test('should adjust value when min/max changes', () => {
    const slider = createMockSlider({
      min: 0,
      max: 100,
      value: 10
    });
    
    // Value should be adjusted to new minimum
    slider.setMin(20);
    expect(slider.getValue()).toBe(20);
    
    // Set value to test max adjustment
    slider.setValue(90);
    
    // Value should be adjusted to new maximum
    slider.setMax(80);
    expect(slider.getValue()).toBe(80);
  });
  
  test('should update step size', () => {
    const slider = createMockSlider({
      min: 0,
      max: 10,
      step: 1,
      ticks: true
    });
    
    // Initially should have 11 ticks (0 to 10 in steps of 1)
    let ticks = slider.element.querySelectorAll('.mtrl-slider__tick');
    expect(ticks.length).toBe(11);
    
    slider.setStep(2);
    
    expect(slider.getStep()).toBe(2);
    
    // After updating step to 2, should have 6 ticks (0, 2, 4, 6, 8, 10)
    ticks = slider.element.querySelectorAll('.mtrl-slider__tick');
    expect(ticks.length).toBe(6);
  });
  
  test('should adjust value to new step', () => {
    const slider = createMockSlider({
      min: 0,
      max: 10,
      value: 3,
      step: 1,
      snapToSteps: true
    });
    
    slider.setStep(5);
    
    // Value should be adjusted to nearest step of 5
    expect(slider.getValue()).toBe(5);
  });
  
  test('should enable and disable slider', () => {
    const slider = createMockSlider();
    
    expect(slider.isDisabled()).toBe(false);
    
    slider.disable();
    
    expect(slider.isDisabled()).toBe(true);
    expect(slider.element.className).toContain('mtrl-slider--disabled');
    
    slider.enable();
    
    expect(slider.isDisabled()).toBe(false);
    expect(slider.element.className).not.toContain('mtrl-slider--disabled');
  });
  
  test('should change color', () => {
    const slider = createMockSlider({
      color: SLIDER_COLORS.PRIMARY
    });
    
    expect(slider.getColor()).toBe(SLIDER_COLORS.PRIMARY);
    expect(slider.element.className).toContain('mtrl-slider--primary');
    
    slider.setColor(SLIDER_COLORS.SECONDARY);
    
    expect(slider.getColor()).toBe(SLIDER_COLORS.SECONDARY);
    expect(slider.element.className).toContain('mtrl-slider--secondary');
    expect(slider.element.className).not.toContain('mtrl-slider--primary');
  });
  
  test('should change size', () => {
    const slider = createMockSlider({
      size: SLIDER_SIZES.MEDIUM
    });
    
    expect(slider.getSize()).toBe(SLIDER_SIZES.MEDIUM);
    expect(slider.element.className).toContain('mtrl-slider--medium');
    
    slider.setSize(SLIDER_SIZES.LARGE);
    
    expect(slider.getSize()).toBe(SLIDER_SIZES.LARGE);
    expect(slider.element.className).toContain('mtrl-slider--large');
    expect(slider.element.className).not.toContain('mtrl-slider--medium');
  });
  
  test('should toggle tick marks', () => {
    const slider = createMockSlider({
      ticks: false
    });
    
    expect(slider.element.className).not.toContain('mtrl-slider--ticks');
    expect(slider.element.querySelector('.mtrl-slider__ticks')).toBeNull();
    
    slider.showTicks(true);
    
    expect(slider.element.className).toContain('mtrl-slider--ticks');
    expect(slider.element.querySelector('.mtrl-slider__ticks')).not.toBeNull();
    
    slider.showTicks(false);
    
    expect(slider.element.className).not.toContain('mtrl-slider--ticks');
    expect(slider.element.querySelector('.mtrl-slider__ticks')).toBeNull();
  });
  
  test('should toggle value display', () => {
    const slider = createMockSlider({
      showValue: false,
      value: 50
    });
    
    expect(slider.element.querySelector('.mtrl-slider__value')).toBeNull();
    
    slider.showCurrentValue(true);
    
    const valueElement = slider.element.querySelector('.mtrl-slider__value');
    expect(valueElement).not.toBeNull();
    expect(valueElement?.textContent).toBe('50');
    
    slider.showCurrentValue(false);
    
    expect(slider.element.querySelector('.mtrl-slider__value')).toBeNull();
  });
  
  test('should change label', () => {
    const slider = createMockSlider();
    
    expect(slider.getLabel()).toBe('');
    expect(slider.element.querySelector('.mtrl-slider__label')).toBeNull();
    
    slider.setLabel('Volume');
    
    expect(slider.getLabel()).toBe('Volume');
    const label = slider.element.querySelector('.mtrl-slider__label');
    expect(label).not.toBeNull();
    expect(label?.textContent).toBe('Volume');
    
    // Change existing label
    slider.setLabel('Brightness');
    expect(label?.textContent).toBe('Brightness');
    
    // Remove label
    slider.setLabel('');
    expect(slider.element.querySelector('.mtrl-slider__label')).toBeNull();
  });
  
  test('should change icon', () => {
    const slider = createMockSlider();
    
    expect(slider.getIcon()).toBe('');
    expect(slider.element.querySelector('.mtrl-slider__icon')).toBeNull();
    
    const iconHtml = '<svg>volume</svg>';
    slider.setIcon(iconHtml);
    
    expect(slider.getIcon()).toBe(iconHtml);
    const icon = slider.element.querySelector('.mtrl-slider__icon');
    expect(icon).not.toBeNull();
    expect(icon?.innerHTML).toBe(iconHtml);
    
    // Change existing icon
    const newIconHtml = '<svg>brightness</svg>';
    slider.setIcon(newIconHtml);
    expect(icon?.innerHTML).toBe(newIconHtml);
    
    // Remove icon
    slider.setIcon('');
    expect(slider.element.querySelector('.mtrl-slider__icon')).toBeNull();
  });
  
  test('should emit change events', () => {
    const slider = createMockSlider({
      value: 0
    });
    
    let changeEventFired = false;
    let eventValue: number | null = null;
    
    slider.on(SLIDER_EVENTS.CHANGE, (event) => {
      changeEventFired = true;
      eventValue = event.value;
    });
    
    slider.setValue(50, true);
    
    expect(changeEventFired).toBe(true);
    expect(eventValue).toBe(50);
  });
  
  test('should emit input events', () => {
    const slider = createMockSlider({
      value: 0
    });
    
    let inputEventFired = false;
    
    slider.on(SLIDER_EVENTS.INPUT, () => {
      inputEventFired = true;
    });
    
    slider.setValue(50, true);
    
    expect(inputEventFired).toBe(true);
  });
  
  test('should include secondValue in events for range slider', () => {
    const slider = createMockSlider({
      range: true,
      value: 25,
      secondValue: 75
    });
    
    let secondValue: number | null = null;
    
    slider.on(SLIDER_EVENTS.CHANGE, (event) => {
      secondValue = event.secondValue;
    });
    
    slider.setValue(30, true);
    
    expect(secondValue).toBe(75);
  });
  
  test('should remove event listeners', () => {
    const slider = createMockSlider();
    
    let eventCount = 0;
    
    const handler = () => {
      eventCount++;
    };
    
    slider.on(SLIDER_EVENTS.CHANGE, handler);
    
    slider.setValue(10, true);
    expect(eventCount).toBe(1);
    
    slider.off(SLIDER_EVENTS.CHANGE, handler);
    
    slider.setValue(20, true);
    expect(eventCount).toBe(1); // Count should not increase
  });
  
  test('should be properly destroyed', () => {
    const slider = createMockSlider();
    document.body.appendChild(slider.element);
    
    expect(document.body.contains(slider.element)).toBe(true);
    
    slider.destroy();
    
    expect(document.body.contains(slider.element)).toBe(false);
  });
});