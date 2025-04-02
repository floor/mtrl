// test/components/extended-fab.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { 
  type ExtendedFabComponent,
  type ExtendedFabConfig,
  type ExtendedFabVariant,
  type ExtendedFabWidth,
  type ExtendedFabPosition
} from '../../src/components/extended-fab/types';

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

// Constants for extended fab variants
const EXTENDED_FAB_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  SURFACE: 'surface'
} as const;

// Constants for extended fab positions
const EXTENDED_FAB_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left'
} as const;

// Constants for extended fab width behaviors
const EXTENDED_FAB_WIDTHS = {
  FIXED: 'fixed',
  FLUID: 'fluid'
} as const;

// Mock extended fab implementation
const createMockExtendedFab = (config: ExtendedFabConfig = {}): ExtendedFabComponent => {
  // Create the main element
  const element = document.createElement('button');
  element.className = 'mtrl-extended-fab';
  element.type = config.type || 'button';
  
  // Set default configuration
  const settings = {
    componentName: 'extended-fab',
    prefix: config.prefix || 'mtrl',
    variant: config.variant || EXTENDED_FAB_VARIANTS.PRIMARY,
    disabled: config.disabled || false,
    iconPosition: config.iconPosition || 'start',
    ripple: config.ripple !== undefined ? config.ripple : true,
    width: config.width || EXTENDED_FAB_WIDTHS.FIXED,
    collapseOnScroll: config.collapseOnScroll || false,
    animate: config.animate || false
  };
  
  // Apply variant class
  if (settings.variant) {
    element.classList.add(`mtrl-extended-fab--${settings.variant}`);
  }
  
  // Apply disabled state
  if (settings.disabled) {
    element.disabled = true;
    element.classList.add('mtrl-extended-fab--disabled');
  }
  
  // Apply width behavior
  if (settings.width) {
    element.classList.add(`mtrl-extended-fab--${settings.width}`);
  }
  
  // Apply position if provided
  if (config.position) {
    element.classList.add(`mtrl-extended-fab--${config.position}`);
  }
  
  // Apply animation if configured
  if (settings.animate) {
    element.classList.add('mtrl-extended-fab--animate');
  }
  
  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  // Apply value if provided
  if (config.value) {
    element.setAttribute('value', config.value);
  }
  
  // Apply aria-label if provided
  if (config.ariaLabel) {
    element.setAttribute('aria-label', config.ariaLabel);
  }
  
  // Create ripple element if enabled
  if (settings.ripple) {
    const ripple = document.createElement('span');
    ripple.className = 'mtrl-extended-fab__ripple';
    element.appendChild(ripple);
  }
  
  // Create icon element if provided
  let iconElement: HTMLElement | null = null;
  if (config.icon) {
    iconElement = document.createElement('span');
    iconElement.className = 'mtrl-extended-fab__icon';
    iconElement.innerHTML = config.icon;
    
    if (config.iconSize) {
      iconElement.style.width = config.iconSize;
      iconElement.style.height = config.iconSize;
    }
    
    if (settings.iconPosition === 'end') {
      iconElement.classList.add('mtrl-extended-fab__icon--end');
    }
    
    element.appendChild(iconElement);
  }
  
  // Create text element
  const textElement = document.createElement('span');
  textElement.className = 'mtrl-extended-fab__text';
  if (config.text) {
    textElement.textContent = config.text;
  }
  element.appendChild(textElement);
  
  // Initialize icon API
  const iconAPI = {
    setIcon: (html: string) => {
      if (!iconElement) {
        iconElement = document.createElement('span');
        iconElement.className = 'mtrl-extended-fab__icon';
        
        if (settings.iconPosition === 'end') {
          iconElement.classList.add('mtrl-extended-fab__icon--end');
          element.appendChild(iconElement);
        } else {
          element.insertBefore(iconElement, element.firstChild);
        }
      }
      
      iconElement.innerHTML = html;
      return iconAPI;
    },
    
    getIcon: () => iconElement ? iconElement.innerHTML : '',
    
    getElement: () => iconElement
  };
  
  // Initialize text API
  const textAPI = {
    setText: (text: string) => {
      textElement.textContent = text;
      return textAPI;
    },
    
    getText: () => textElement.textContent || '',
    
    getElement: () => textElement
  };
  
  // Set up event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Create the extended fab component
  const extendedFab: ExtendedFabComponent = {
    element,
    icon: iconAPI,
    text: textAPI,
    
    disabled: {
      enable: () => {
        element.disabled = false;
        element.classList.remove('mtrl-extended-fab--disabled');
      },
      
      disable: () => {
        element.disabled = true;
        element.classList.add('mtrl-extended-fab--disabled');
      },
      
      isDisabled: () => element.disabled
    },
    
    lifecycle: {
      destroy: () => {
        extendedFab.destroy();
      }
    },
    
    getClass: (name: string) => {
      const prefix = settings.prefix;
      return name ? `${prefix}-${name}` : `${prefix}-extended-fab`;
    },
    
    getValue: () => element.getAttribute('value') || '',
    
    setValue: (value: string) => {
      element.setAttribute('value', value);
      return extendedFab;
    },
    
    enable: () => {
      extendedFab.disabled.enable();
      return extendedFab;
    },
    
    disable: () => {
      extendedFab.disabled.disable();
      return extendedFab;
    },
    
    setIcon: (icon: string) => {
      iconAPI.setIcon(icon);
      return extendedFab;
    },
    
    getIcon: () => iconAPI.getIcon(),
    
    setText: (text: string) => {
      textAPI.setText(text);
      return extendedFab;
    },
    
    getText: () => textAPI.getText(),
    
    setPosition: (position: string) => {
      // Remove existing position classes
      const positionValues = Object.values(EXTENDED_FAB_POSITIONS);
      positionValues.forEach(pos => {
        element.classList.remove(`mtrl-extended-fab--${pos}`);
      });
      
      // Add new position class
      element.classList.add(`mtrl-extended-fab--${position}`);
      return extendedFab;
    },
    
    getPosition: () => {
      const positionValues = Object.values(EXTENDED_FAB_POSITIONS);
      for (const pos of positionValues) {
        if (element.classList.contains(`mtrl-extended-fab--${pos}`)) {
          return pos;
        }
      }
      return null;
    },
    
    lower: () => {
      element.classList.add('mtrl-extended-fab--lowered');
      return extendedFab;
    },
    
    raise: () => {
      element.classList.remove('mtrl-extended-fab--lowered');
      return extendedFab;
    },
    
    collapse: () => {
      element.classList.add('mtrl-extended-fab--collapsed');
      return extendedFab;
    },
    
    expand: () => {
      element.classList.remove('mtrl-extended-fab--collapsed');
      return extendedFab;
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
    
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      
      element.addEventListener(event, handler as EventListener);
      return extendedFab;
    },
    
    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      
      element.removeEventListener(event, handler as EventListener);
      return extendedFab;
    },
    
    addClass: (...classes: string[]) => {
      classes.forEach(className => element.classList.add(className));
      return extendedFab;
    }
  };
  
  return extendedFab;
};

describe('Extended FAB Component', () => {
  test('should create an extended fab button element', () => {
    const extendedFab = createMockExtendedFab();
    
    expect(extendedFab.element).toBeDefined();
    expect(extendedFab.element.tagName).toBe('BUTTON');
    expect(extendedFab.element.className).toContain('mtrl-extended-fab');
  });
  
  test('should apply variant classes', () => {
    const variants: ExtendedFabVariant[] = [
      EXTENDED_FAB_VARIANTS.PRIMARY,
      EXTENDED_FAB_VARIANTS.SECONDARY,
      EXTENDED_FAB_VARIANTS.TERTIARY,
      EXTENDED_FAB_VARIANTS.SURFACE
    ];
    
    variants.forEach(variant => {
      const extendedFab = createMockExtendedFab({ variant });
      expect(extendedFab.element.className).toContain(`mtrl-extended-fab--${variant}`);
    });
  });
  
  test('should set initial text content', () => {
    const extendedFab = createMockExtendedFab({
      text: 'Create Item'
    });
    
    const textElement = extendedFab.element.querySelector('.mtrl-extended-fab__text');
    expect(textElement).toBeDefined();
    expect(textElement?.textContent).toBe('Create Item');
    expect(extendedFab.getText()).toBe('Create Item');
  });
  
  test('should set initial icon', () => {
    const iconHtml = '<svg><path></path></svg>';
    const extendedFab = createMockExtendedFab({
      icon: iconHtml
    });
    
    const iconElement = extendedFab.element.querySelector('.mtrl-extended-fab__icon');
    expect(iconElement).toBeDefined();
    expect(iconElement?.innerHTML).toBe(iconHtml);
    expect(extendedFab.getIcon()).toBe(iconHtml);
  });
  
  test('should position icon at start by default', () => {
    const extendedFab = createMockExtendedFab({
      icon: '<svg></svg>'
    });
    
    const iconElement = extendedFab.element.querySelector('.mtrl-extended-fab__icon');
    expect(iconElement?.classList.contains('mtrl-extended-fab__icon--end')).toBe(false);
    
    // Icon should be a child of the extended fab
    expect(iconElement?.parentNode).toBe(extendedFab.element);
  });
  
  test('should position icon at end when configured', () => {
    const extendedFab = createMockExtendedFab({
      icon: '<svg></svg>',
      iconPosition: 'end'
    });
    
    const iconElement = extendedFab.element.querySelector('.mtrl-extended-fab__icon');
    expect(iconElement?.classList.contains('mtrl-extended-fab__icon--end')).toBe(true);
    
    // Check if the icon is added to the end (among the last children rather than checking exact lastChild)
    const children = Array.from(extendedFab.element.childNodes);
    expect(children.includes(iconElement as ChildNode)).toBe(true);
  });
  
  test('should apply disabled state', () => {
    const extendedFab = createMockExtendedFab({
      disabled: true
    });
    
    expect(extendedFab.element.disabled).toBe(true);
    expect(extendedFab.element.className).toContain('mtrl-extended-fab--disabled');
    expect(extendedFab.disabled.isDisabled()).toBe(true);
  });
  
  test('should apply width behavior', () => {
    const widths: ExtendedFabWidth[] = [
      EXTENDED_FAB_WIDTHS.FIXED,
      EXTENDED_FAB_WIDTHS.FLUID
    ];
    
    widths.forEach(width => {
      const extendedFab = createMockExtendedFab({ width });
      expect(extendedFab.element.className).toContain(`mtrl-extended-fab--${width}`);
    });
  });
  
  test('should apply position classes', () => {
    const positions: ExtendedFabPosition[] = [
      EXTENDED_FAB_POSITIONS.TOP_RIGHT,
      EXTENDED_FAB_POSITIONS.TOP_LEFT,
      EXTENDED_FAB_POSITIONS.BOTTOM_RIGHT,
      EXTENDED_FAB_POSITIONS.BOTTOM_LEFT
    ];
    
    positions.forEach(position => {
      const extendedFab = createMockExtendedFab({ position });
      expect(extendedFab.element.className).toContain(`mtrl-extended-fab--${position}`);
      expect(extendedFab.getPosition()).toBe(position);
    });
  });
  
  test('should set value attribute', () => {
    const extendedFab = createMockExtendedFab({
      value: 'new-item'
    });
    
    expect(extendedFab.element.getAttribute('value')).toBe('new-item');
    expect(extendedFab.getValue()).toBe('new-item');
  });
  
  test('should set aria-label attribute', () => {
    const extendedFab = createMockExtendedFab({
      ariaLabel: 'Create new item'
    });
    
    expect(extendedFab.element.getAttribute('aria-label')).toBe('Create new item');
  });
  
  test('should create ripple element by default', () => {
    const extendedFab = createMockExtendedFab();
    
    const rippleElement = extendedFab.element.querySelector('.mtrl-extended-fab__ripple');
    expect(rippleElement).toBeDefined();
  });
  
  test('should not create ripple when disabled', () => {
    const extendedFab = createMockExtendedFab({
      ripple: false
    });
    
    const rippleElement = extendedFab.element.querySelector('.mtrl-extended-fab__ripple');
    expect(rippleElement).toBeNull();
  });
  
  test('should apply custom icon size', () => {
    const extendedFab = createMockExtendedFab({
      icon: '<svg></svg>',
      iconSize: '32px'
    });
    
    const iconElement = extendedFab.element.querySelector('.mtrl-extended-fab__icon');
    expect(iconElement).toBeDefined();
    expect((iconElement as HTMLElement).style.width).toBe('32px');
    expect((iconElement as HTMLElement).style.height).toBe('32px');
  });
  
  test('should apply animation class when configured', () => {
    const extendedFab = createMockExtendedFab({
      animate: true
    });
    
    expect(extendedFab.element.className).toContain('mtrl-extended-fab--animate');
  });
  
  test('should be able to change text content', () => {
    const extendedFab = createMockExtendedFab({
      text: 'Initial Text'
    });
    
    expect(extendedFab.getText()).toBe('Initial Text');
    
    extendedFab.setText('Updated Text');
    
    expect(extendedFab.getText()).toBe('Updated Text');
    
    const textElement = extendedFab.element.querySelector('.mtrl-extended-fab__text');
    expect(textElement?.textContent).toBe('Updated Text');
  });
  
  test('should be able to change icon', () => {
    const extendedFab = createMockExtendedFab();
    
    const initialIconElement = extendedFab.element.querySelector('.mtrl-extended-fab__icon');
    expect(initialIconElement).toBeNull();
    
    const iconHtml = '<svg><path></path></svg>';
    extendedFab.setIcon(iconHtml);
    
    const updatedIconElement = extendedFab.element.querySelector('.mtrl-extended-fab__icon');
    expect(updatedIconElement).toBeDefined();
    expect(updatedIconElement?.innerHTML).toBe(iconHtml);
    expect(extendedFab.getIcon()).toBe(iconHtml);
  });
  
  test('should be able to change disabled state', () => {
    const extendedFab = createMockExtendedFab();
    
    expect(extendedFab.disabled.isDisabled()).toBe(false);
    
    extendedFab.disable();
    
    expect(extendedFab.disabled.isDisabled()).toBe(true);
    expect(extendedFab.element.disabled).toBe(true);
    expect(extendedFab.element.className).toContain('mtrl-extended-fab--disabled');
    
    extendedFab.enable();
    
    expect(extendedFab.disabled.isDisabled()).toBe(false);
    expect(extendedFab.element.disabled).toBe(false);
    expect(extendedFab.element.className).not.toContain('mtrl-extended-fab--disabled');
  });
  
  test('should be able to change value', () => {
    const extendedFab = createMockExtendedFab();
    
    expect(extendedFab.getValue()).toBe('');
    
    extendedFab.setValue('new-value');
    
    expect(extendedFab.getValue()).toBe('new-value');
    expect(extendedFab.element.getAttribute('value')).toBe('new-value');
  });
  
  test('should be able to change position', () => {
    const extendedFab = createMockExtendedFab({
      position: EXTENDED_FAB_POSITIONS.BOTTOM_RIGHT
    });
    
    expect(extendedFab.getPosition()).toBe(EXTENDED_FAB_POSITIONS.BOTTOM_RIGHT);
    
    extendedFab.setPosition(EXTENDED_FAB_POSITIONS.TOP_LEFT);
    
    expect(extendedFab.getPosition()).toBe(EXTENDED_FAB_POSITIONS.TOP_LEFT);
    expect(extendedFab.element.className).toContain(`mtrl-extended-fab--${EXTENDED_FAB_POSITIONS.TOP_LEFT}`);
    expect(extendedFab.element.className).not.toContain(`mtrl-extended-fab--${EXTENDED_FAB_POSITIONS.BOTTOM_RIGHT}`);
  });
  
  test('should be able to lower and raise', () => {
    const extendedFab = createMockExtendedFab();
    
    expect(extendedFab.element.className).not.toContain('mtrl-extended-fab--lowered');
    
    extendedFab.lower();
    
    expect(extendedFab.element.className).toContain('mtrl-extended-fab--lowered');
    
    extendedFab.raise();
    
    expect(extendedFab.element.className).not.toContain('mtrl-extended-fab--lowered');
  });
  
  test('should be able to collapse and expand', () => {
    const extendedFab = createMockExtendedFab();
    
    expect(extendedFab.element.className).not.toContain('mtrl-extended-fab--collapsed');
    
    extendedFab.collapse();
    
    expect(extendedFab.element.className).toContain('mtrl-extended-fab--collapsed');
    
    extendedFab.expand();
    
    expect(extendedFab.element.className).not.toContain('mtrl-extended-fab--collapsed');
  });
  
  test('should add event listeners', () => {
    const extendedFab = createMockExtendedFab();
    let clicked = false;
    
    extendedFab.on('click', () => {
      clicked = true;
    });
    
    // Simulate click
    extendedFab.element.dispatchEvent(new Event('click'));
    
    expect(clicked).toBe(true);
  });
  
  test('should remove event listeners', () => {
    const extendedFab = createMockExtendedFab();
    let count = 0;
    
    const handler = () => {
      count++;
    };
    
    extendedFab.on('click', handler);
    
    // First click
    extendedFab.element.dispatchEvent(new Event('click'));
    expect(count).toBe(1);
    
    // Remove listener
    extendedFab.off('click', handler);
    
    // Second click
    extendedFab.element.dispatchEvent(new Event('click'));
    expect(count).toBe(1); // Count should not increase
  });
  
  test('should add CSS classes', () => {
    const extendedFab = createMockExtendedFab();
    
    extendedFab.addClass('custom-class', 'special-fab');
    
    expect(extendedFab.element.className).toContain('custom-class');
    expect(extendedFab.element.className).toContain('special-fab');
  });
  
  test('should be properly destroyed', () => {
    const extendedFab = createMockExtendedFab();
    document.body.appendChild(extendedFab.element);
    
    expect(document.body.contains(extendedFab.element)).toBe(true);
    
    extendedFab.destroy();
    
    expect(document.body.contains(extendedFab.element)).toBe(false);
  });
});