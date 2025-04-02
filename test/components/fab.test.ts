// test/components/fab.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { 
  type FabComponent,
  type FabConfig,
  type FabVariant,
  type FabSize,
  type FabPosition
} from '../../src/components/fab/types';

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

// Constants for fab variants
const FAB_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  SURFACE: 'surface'
} as const;

// Constants for fab sizes
const FAB_SIZES = {
  SMALL: 'small',
  DEFAULT: 'default',
  LARGE: 'large'
} as const;

// Constants for fab positions
const FAB_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left'
} as const;

// Mock fab implementation
const createMockFab = (config: FabConfig = {}): FabComponent => {
  // Create the main element
  const element = document.createElement('button');
  element.className = 'mtrl-fab';
  element.type = config.type || 'button';
  
  // Set default configuration
  const settings = {
    componentName: 'fab',
    prefix: config.prefix || 'mtrl',
    variant: config.variant || FAB_VARIANTS.PRIMARY,
    size: config.size || FAB_SIZES.DEFAULT,
    disabled: config.disabled || false,
    ripple: config.ripple !== undefined ? config.ripple : true,
    animate: config.animate || false
  };
  
  // Apply variant class
  if (settings.variant) {
    element.classList.add(`mtrl-fab--${settings.variant}`);
  }
  
  // Apply size class
  if (settings.size && settings.size !== FAB_SIZES.DEFAULT) {
    element.classList.add(`mtrl-fab--${settings.size}`);
  }
  
  // Apply disabled state
  if (settings.disabled) {
    element.disabled = true;
    element.classList.add('mtrl-fab--disabled');
  }
  
  // Apply position if provided
  if (config.position) {
    element.classList.add(`mtrl-fab--${config.position}`);
  }
  
  // Apply animation if configured
  if (settings.animate) {
    element.classList.add('mtrl-fab--animate');
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
    ripple.className = 'mtrl-fab__ripple';
    element.appendChild(ripple);
  }
  
  // Create icon element if provided
  let iconElement: HTMLElement | null = null;
  if (config.icon) {
    iconElement = document.createElement('span');
    iconElement.className = 'mtrl-fab__icon';
    iconElement.innerHTML = config.icon;
    
    if (config.iconSize) {
      iconElement.style.width = config.iconSize;
      iconElement.style.height = config.iconSize;
    }
    
    element.appendChild(iconElement);
  }
  
  // Initialize icon API
  const iconAPI = {
    setIcon: (html: string) => {
      if (!iconElement) {
        iconElement = document.createElement('span');
        iconElement.className = 'mtrl-fab__icon';
        element.appendChild(iconElement);
      }
      
      iconElement.innerHTML = html;
      return iconAPI;
    },
    
    getIcon: () => iconElement ? iconElement.innerHTML : '',
    
    getElement: () => iconElement
  };
  
  // Set up event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Create the fab component
  const fab: FabComponent = {
    element,
    icon: iconAPI,
    
    disabled: {
      enable: () => {
        element.disabled = false;
        element.classList.remove('mtrl-fab--disabled');
      },
      
      disable: () => {
        element.disabled = true;
        element.classList.add('mtrl-fab--disabled');
      },
      
      isDisabled: () => element.disabled
    },
    
    lifecycle: {
      destroy: () => {
        fab.destroy();
      }
    },
    
    getClass: (name: string) => {
      const prefix = settings.prefix;
      return name ? `${prefix}-${name}` : `${prefix}-fab`;
    },
    
    getValue: () => element.getAttribute('value') || '',
    
    setValue: (value: string) => {
      element.setAttribute('value', value);
      return fab;
    },
    
    enable: () => {
      fab.disabled.enable();
      return fab;
    },
    
    disable: () => {
      fab.disabled.disable();
      return fab;
    },
    
    setIcon: (icon: string) => {
      iconAPI.setIcon(icon);
      return fab;
    },
    
    getIcon: () => iconAPI.getIcon(),
    
    setPosition: (position: string) => {
      // Remove existing position classes
      const positionValues = Object.values(FAB_POSITIONS);
      positionValues.forEach(pos => {
        element.classList.remove(`mtrl-fab--${pos}`);
      });
      
      // Add new position class
      element.classList.add(`mtrl-fab--${position}`);
      return fab;
    },
    
    getPosition: () => {
      const positionValues = Object.values(FAB_POSITIONS);
      for (const pos of positionValues) {
        if (element.classList.contains(`mtrl-fab--${pos}`)) {
          return pos;
        }
      }
      return null;
    },
    
    lower: () => {
      element.classList.add('mtrl-fab--lowered');
      return fab;
    },
    
    raise: () => {
      element.classList.remove('mtrl-fab--lowered');
      return fab;
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
      return fab;
    },
    
    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      
      element.removeEventListener(event, handler as EventListener);
      return fab;
    },
    
    addClass: (...classes: string[]) => {
      classes.forEach(className => element.classList.add(className));
      return fab;
    }
  };
  
  return fab;
};

describe('FAB Component', () => {
  test('should create a fab button element', () => {
    const fab = createMockFab();
    
    expect(fab.element).toBeDefined();
    expect(fab.element.tagName).toBe('BUTTON');
    expect(fab.element.className).toContain('mtrl-fab');
  });
  
  test('should apply variant classes', () => {
    const variants: FabVariant[] = [
      FAB_VARIANTS.PRIMARY,
      FAB_VARIANTS.SECONDARY,
      FAB_VARIANTS.TERTIARY,
      FAB_VARIANTS.SURFACE
    ];
    
    variants.forEach(variant => {
      const fab = createMockFab({ variant });
      expect(fab.element.className).toContain(`mtrl-fab--${variant}`);
    });
  });
  
  test('should apply size classes', () => {
    const sizes: FabSize[] = [
      FAB_SIZES.SMALL,
      FAB_SIZES.LARGE
    ];
    
    sizes.forEach(size => {
      const fab = createMockFab({ size });
      expect(fab.element.className).toContain(`mtrl-fab--${size}`);
    });
    
    // Default size should not add a class
    const defaultFab = createMockFab({ size: FAB_SIZES.DEFAULT });
    expect(defaultFab.element.className).not.toContain(`mtrl-fab--${FAB_SIZES.DEFAULT}`);
  });
  
  test('should set initial icon', () => {
    const iconHtml = '<svg><path></path></svg>';
    const fab = createMockFab({
      icon: iconHtml
    });
    
    const iconElement = fab.element.querySelector('.mtrl-fab__icon');
    expect(iconElement).toBeDefined();
    expect(iconElement?.innerHTML).toBe(iconHtml);
    expect(fab.getIcon()).toBe(iconHtml);
  });
  
  test('should apply disabled state', () => {
    const fab = createMockFab({
      disabled: true
    });
    
    expect(fab.element.disabled).toBe(true);
    expect(fab.element.className).toContain('mtrl-fab--disabled');
    expect(fab.disabled.isDisabled()).toBe(true);
  });
  
  test('should apply position classes', () => {
    const positions: FabPosition[] = [
      FAB_POSITIONS.TOP_RIGHT,
      FAB_POSITIONS.TOP_LEFT,
      FAB_POSITIONS.BOTTOM_RIGHT,
      FAB_POSITIONS.BOTTOM_LEFT
    ];
    
    positions.forEach(position => {
      const fab = createMockFab({ position });
      expect(fab.element.className).toContain(`mtrl-fab--${position}`);
      expect(fab.getPosition()).toBe(position);
    });
  });
  
  test('should set value attribute', () => {
    const fab = createMockFab({
      value: 'new-item'
    });
    
    expect(fab.element.getAttribute('value')).toBe('new-item');
    expect(fab.getValue()).toBe('new-item');
  });
  
  test('should set aria-label attribute', () => {
    const fab = createMockFab({
      ariaLabel: 'Create new item'
    });
    
    expect(fab.element.getAttribute('aria-label')).toBe('Create new item');
  });
  
  test('should create ripple element by default', () => {
    const fab = createMockFab();
    
    const rippleElement = fab.element.querySelector('.mtrl-fab__ripple');
    expect(rippleElement).toBeDefined();
  });
  
  test('should not create ripple when disabled', () => {
    const fab = createMockFab({
      ripple: false
    });
    
    const rippleElement = fab.element.querySelector('.mtrl-fab__ripple');
    expect(rippleElement).toBeNull();
  });
  
  test('should apply custom icon size', () => {
    const fab = createMockFab({
      icon: '<svg></svg>',
      iconSize: '32px'
    });
    
    const iconElement = fab.element.querySelector('.mtrl-fab__icon');
    expect(iconElement).toBeDefined();
    expect((iconElement as HTMLElement).style.width).toBe('32px');
    expect((iconElement as HTMLElement).style.height).toBe('32px');
  });
  
  test('should apply animation class when configured', () => {
    const fab = createMockFab({
      animate: true
    });
    
    expect(fab.element.className).toContain('mtrl-fab--animate');
  });
  
  test('should be able to change icon', () => {
    const fab = createMockFab();
    
    const initialIconElement = fab.element.querySelector('.mtrl-fab__icon');
    expect(initialIconElement).toBeNull();
    
    const iconHtml = '<svg><path></path></svg>';
    fab.setIcon(iconHtml);
    
    const updatedIconElement = fab.element.querySelector('.mtrl-fab__icon');
    expect(updatedIconElement).toBeDefined();
    expect(updatedIconElement?.innerHTML).toBe(iconHtml);
    expect(fab.getIcon()).toBe(iconHtml);
  });
  
  test('should be able to change disabled state', () => {
    const fab = createMockFab();
    
    expect(fab.disabled.isDisabled()).toBe(false);
    
    fab.disable();
    
    expect(fab.disabled.isDisabled()).toBe(true);
    expect(fab.element.disabled).toBe(true);
    expect(fab.element.className).toContain('mtrl-fab--disabled');
    
    fab.enable();
    
    expect(fab.disabled.isDisabled()).toBe(false);
    expect(fab.element.disabled).toBe(false);
    expect(fab.element.className).not.toContain('mtrl-fab--disabled');
  });
  
  test('should be able to change value', () => {
    const fab = createMockFab();
    
    expect(fab.getValue()).toBe('');
    
    fab.setValue('new-value');
    
    expect(fab.getValue()).toBe('new-value');
    expect(fab.element.getAttribute('value')).toBe('new-value');
  });
  
  test('should be able to change position', () => {
    const fab = createMockFab({
      position: FAB_POSITIONS.BOTTOM_RIGHT
    });
    
    expect(fab.getPosition()).toBe(FAB_POSITIONS.BOTTOM_RIGHT);
    
    fab.setPosition(FAB_POSITIONS.TOP_LEFT);
    
    expect(fab.getPosition()).toBe(FAB_POSITIONS.TOP_LEFT);
    expect(fab.element.className).toContain(`mtrl-fab--${FAB_POSITIONS.TOP_LEFT}`);
    expect(fab.element.className).not.toContain(`mtrl-fab--${FAB_POSITIONS.BOTTOM_RIGHT}`);
  });
  
  test('should be able to lower and raise', () => {
    const fab = createMockFab();
    
    expect(fab.element.className).not.toContain('mtrl-fab--lowered');
    
    fab.lower();
    
    expect(fab.element.className).toContain('mtrl-fab--lowered');
    
    fab.raise();
    
    expect(fab.element.className).not.toContain('mtrl-fab--lowered');
  });
  
  test('should add event listeners', () => {
    const fab = createMockFab();
    let clicked = false;
    
    fab.on('click', () => {
      clicked = true;
    });
    
    // Simulate click
    fab.element.dispatchEvent(new Event('click'));
    
    expect(clicked).toBe(true);
  });
  
  test('should remove event listeners', () => {
    const fab = createMockFab();
    let count = 0;
    
    const handler = () => {
      count++;
    };
    
    fab.on('click', handler);
    
    // First click
    fab.element.dispatchEvent(new Event('click'));
    expect(count).toBe(1);
    
    // Remove listener
    fab.off('click', handler);
    
    // Second click
    fab.element.dispatchEvent(new Event('click'));
    expect(count).toBe(1); // Count should not increase
  });
  
  test('should add CSS classes', () => {
    const fab = createMockFab();
    
    fab.addClass('custom-class', 'special-fab');
    
    expect(fab.element.className).toContain('custom-class');
    expect(fab.element.className).toContain('special-fab');
  });
  
  test('should be properly destroyed', () => {
    const fab = createMockFab();
    document.body.appendChild(fab.element);
    
    expect(document.body.contains(fab.element)).toBe(true);
    
    fab.destroy();
    
    expect(document.body.contains(fab.element)).toBe(false);
  });
});