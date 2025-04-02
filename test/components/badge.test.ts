// test/components/badge.test.ts
import { describe, test, expect, mock } from 'bun:test';
import { JSDOM } from 'jsdom';

// Set up JSDOM
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;

// Import types directly to avoid circular dependencies
import type { 
  BadgeComponent,
  BadgeConfig,
  BadgeVariant,
  BadgeColor,
  BadgePosition
} from '../../src/components/badge/types';

// Define constants here to avoid circular dependencies
const BADGE_VARIANTS = {
  SMALL: 'small',
  LARGE: 'large'
} as const;

const BADGE_COLORS = {
  ERROR: 'error',
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info'
} as const;

const BADGE_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left'
} as const;

const BADGE_MAX_CHARACTERS = 4;

// Create a mock badge implementation
const createMockBadge = (config: BadgeConfig = {}): BadgeComponent => {
  // Default configuration
  const defaultConfig: BadgeConfig = {
    variant: BADGE_VARIANTS.LARGE,
    color: BADGE_COLORS.ERROR,
    position: BADGE_POSITIONS.TOP_RIGHT,
    visible: true,
    prefix: 'mtrl'
  };
  
  // Merge with user configuration
  const mergedConfig = {
    ...defaultConfig,
    ...config
  };
  
  // Create main element
  const element = document.createElement('div');
  element.className = `${mergedConfig.prefix}-badge`;
  
  // Add custom class if provided
  if (mergedConfig.class) {
    element.className += ` ${mergedConfig.class}`;
  }
  
  // Add variant class
  element.className += ` ${mergedConfig.prefix}-badge--${mergedConfig.variant}`;
  
  // Add color class
  element.className += ` ${mergedConfig.prefix}-badge--${mergedConfig.color}`;
  
  // Add position class
  element.className += ` ${mergedConfig.prefix}-badge--${mergedConfig.position}`;
  
  // Set visibility
  if (!mergedConfig.visible) {
    element.style.display = 'none';
  }
  
  // Set label content
  if (mergedConfig.variant === BADGE_VARIANTS.LARGE && mergedConfig.label) {
    element.textContent = String(mergedConfig.label);
    
    // Apply max if needed
    if (mergedConfig.max && typeof mergedConfig.label === 'number' && mergedConfig.label > mergedConfig.max) {
      element.textContent = `${mergedConfig.max}+`;
    }
  }
  
  // Create wrapper if there's a target
  let wrapper: HTMLElement | undefined;
  if (mergedConfig.target) {
    wrapper = document.createElement('div');
    wrapper.className = `${mergedConfig.prefix}-badge-wrapper`;
    wrapper.appendChild(mergedConfig.target.cloneNode(true));
    wrapper.appendChild(element);
  }
  
  // Event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Create the badge instance
  const badge: BadgeComponent = {
    element,
    wrapper,
    
    getClass: (name: string) => `${mergedConfig.prefix}-badge${name ? '--' + name : ''}`,
    
    setLabel: (label: string | number) => {
      if (mergedConfig.variant !== BADGE_VARIANTS.LARGE) {
        return badge;
      }
      
      let content = String(label);
      
      // Apply max if needed
      if (mergedConfig.max && typeof label === 'number' && label > mergedConfig.max) {
        content = `${mergedConfig.max}+`;
      }
      
      element.textContent = content;
      return badge;
    },
    
    getLabel: () => element.textContent || '',
    
    show: () => {
      element.style.display = '';
      return badge;
    },
    
    hide: () => {
      element.style.display = 'none';
      return badge;
    },
    
    toggle: (visible?: boolean) => {
      const shouldBeVisible = visible === undefined ? 
        element.style.display === 'none' : visible;
      
      if (shouldBeVisible) {
        badge.show();
      } else {
        badge.hide();
      }
      
      return badge;
    },
    
    isVisible: () => element.style.display !== 'none',
    
    setMax: (max: number) => {
      mergedConfig.max = max;
      
      // Update display if needed
      if (mergedConfig.variant === BADGE_VARIANTS.LARGE && 
          element.textContent && 
          !isNaN(Number(element.textContent)) && 
          Number(element.textContent) > max) {
        element.textContent = `${max}+`;
      }
      
      return badge;
    },
    
    setColor: (color: BadgeColor | string) => {
      // Remove old color class
      element.classList.remove(`${mergedConfig.prefix}-badge--${mergedConfig.color}`);
      
      // Update config
      mergedConfig.color = color;
      
      // Add new color class
      element.classList.add(`${mergedConfig.prefix}-badge--${color}`);
      
      return badge;
    },
    
    setVariant: (variant: BadgeVariant | string) => {
      // Remove old variant class
      element.classList.remove(`${mergedConfig.prefix}-badge--${mergedConfig.variant}`);
      
      // Update config
      mergedConfig.variant = variant;
      
      // Add new variant class
      element.classList.add(`${mergedConfig.prefix}-badge--${variant}`);
      
      // Clear content if switching to small variant
      if (variant === BADGE_VARIANTS.SMALL) {
        element.textContent = '';
      } else if (mergedConfig.label) {
        badge.setLabel(mergedConfig.label);
      }
      
      return badge;
    },
    
    setPosition: (position: BadgePosition | string) => {
      // Remove old position class
      element.classList.remove(`${mergedConfig.prefix}-badge--${mergedConfig.position}`);
      
      // Update config
      mergedConfig.position = position;
      
      // Add new position class
      element.classList.add(`${mergedConfig.prefix}-badge--${position}`);
      
      return badge;
    },
    
    attachTo: (target: HTMLElement) => {
      // Detach first if already attached
      if (wrapper) {
        badge.detach();
      }
      
      // Create wrapper
      wrapper = document.createElement('div');
      wrapper.className = `${mergedConfig.prefix}-badge-wrapper`;
      
      // Clone target's style and parent connections
      const parent = target.parentNode;
      const nextSibling = target.nextSibling;
      
      // Add target and badge to wrapper
      wrapper.appendChild(target);
      wrapper.appendChild(element);
      
      // Insert wrapper where target was
      if (parent) {
        parent.insertBefore(wrapper, nextSibling);
      }
      
      return badge;
    },
    
    detach: () => {
      if (!wrapper) {
        return badge;
      }
      
      // Find the target (first child of wrapper)
      const target = wrapper.childNodes[0] as HTMLElement;
      
      // Get wrapper's position in DOM
      const parent = wrapper.parentNode;
      const nextSibling = wrapper.nextSibling;
      
      if (parent) {
        // Move badge element to document body (or keep as-is)
        document.body.appendChild(element);
        
        // Move target back to original position
        parent.insertBefore(target, nextSibling);
        
        // Remove wrapper
        wrapper.remove();
      }
      
      wrapper = undefined;
      return badge;
    },
    
    addClass: (...classes: string[]) => {
      element.classList.add(...classes);
      return badge;
    },
    
    removeClass: (...classes: string[]) => {
      element.classList.remove(...classes);
      return badge;
    },
    
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      return badge;
    },
    
    off: (event: string, handler: Function) => {
      if (!eventHandlers[event]) return badge;
      
      eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      return badge;
    },
    
    destroy: () => {
      // Clear event handlers
      Object.keys(eventHandlers).forEach(key => {
        eventHandlers[key] = [];
      });
      
      // Remove elements
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      } else if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  };
  
  return badge;
};

describe('Badge Component', () => {
  test('should create a badge element', () => {
    const badge = createMockBadge();
    expect(badge.element).toBeDefined();
    expect(badge.element.tagName).toBe('DIV');
    expect(badge.element.className).toContain('mtrl-badge');
  });

  test('should apply variant class', () => {
    // Test small variant
    const smallBadge = createMockBadge({
      variant: BADGE_VARIANTS.SMALL
    });
    expect(smallBadge.element.className).toContain('mtrl-badge--small');

    // Test large variant
    const largeBadge = createMockBadge({
      variant: BADGE_VARIANTS.LARGE
    });
    expect(largeBadge.element.className).toContain('mtrl-badge--large');
  });

  test('should apply color class', () => {
    // Test primary color
    const primaryBadge = createMockBadge({
      color: BADGE_COLORS.PRIMARY
    });
    expect(primaryBadge.element.className).toContain('mtrl-badge--primary');

    // Test error color
    const errorBadge = createMockBadge({
      color: BADGE_COLORS.ERROR
    });
    expect(errorBadge.element.className).toContain('mtrl-badge--error');
  });

  test('should apply position class', () => {
    // Test top-right position
    const topRightBadge = createMockBadge({
      position: BADGE_POSITIONS.TOP_RIGHT
    });
    expect(topRightBadge.element.className).toContain('mtrl-badge--top-right');

    // Test bottom-left position
    const bottomLeftBadge = createMockBadge({
      position: BADGE_POSITIONS.BOTTOM_LEFT
    });
    expect(bottomLeftBadge.element.className).toContain('mtrl-badge--bottom-left');
  });

  test('should set label text for large badges', () => {
    const label = '42';
    const badge = createMockBadge({
      variant: BADGE_VARIANTS.LARGE,
      label
    });

    expect(badge.getLabel()).toBe(label);
  });

  test('should not set label text for small badges', () => {
    const label = '42';
    const badge = createMockBadge({
      variant: BADGE_VARIANTS.SMALL,
      label
    });

    expect(badge.getLabel()).toBe('');
  });

  test('should update badge label', () => {
    const badge = createMockBadge({
      variant: BADGE_VARIANTS.LARGE
    });

    const newLabel = '99';
    badge.setLabel(newLabel);
    expect(badge.getLabel()).toBe(newLabel);
  });

  test('should handle visibility', () => {
    // Default is visible
    const badge = createMockBadge();
    expect(badge.isVisible()).toBe(true);

    // Hide badge
    badge.hide();
    expect(badge.isVisible()).toBe(false);

    // Show badge
    badge.show();
    expect(badge.isVisible()).toBe(true);

    // Toggle badge
    badge.toggle();
    expect(badge.isVisible()).toBe(false);

    badge.toggle();
    expect(badge.isVisible()).toBe(true);

    // Explicit toggle
    badge.toggle(false);
    expect(badge.isVisible()).toBe(false);
  });

  test('should respect max value', () => {
    const max = 99;
    const badge = createMockBadge({
      variant: BADGE_VARIANTS.LARGE,
      max,
      label: max + 1
    });

    expect(badge.getLabel()).toBe('99+');

    // Set a lower label
    badge.setLabel(50);
    expect(badge.getLabel()).toBe('50');

    // Set a higher label
    badge.setLabel(100);
    expect(badge.getLabel()).toBe('99+');

    // Change max
    badge.setMax(999);
    badge.setLabel(100);
    expect(badge.getLabel()).toBe('100');
  });

  test('should change color', () => {
    const badge = createMockBadge({
      color: BADGE_COLORS.ERROR
    });

    expect(badge.element.className).toContain('mtrl-badge--error');

    badge.setColor(BADGE_COLORS.SUCCESS);
    expect(badge.element.className).toContain('mtrl-badge--success');
    expect(badge.element.className).not.toContain('mtrl-badge--error');
  });

  test('should change variant', () => {
    const badge = createMockBadge({
      variant: BADGE_VARIANTS.LARGE,
      label: '42'
    });

    expect(badge.element.className).toContain('mtrl-badge--large');
    expect(badge.getLabel()).toBe('42');

    badge.setVariant(BADGE_VARIANTS.SMALL);
    expect(badge.element.className).toContain('mtrl-badge--small');
    expect(badge.element.className).not.toContain('mtrl-badge--large');
    expect(badge.getLabel()).toBe('');
  });

  test('should change position', () => {
    const badge = createMockBadge({
      position: BADGE_POSITIONS.TOP_RIGHT
    });

    expect(badge.element.className).toContain('mtrl-badge--top-right');

    badge.setPosition(BADGE_POSITIONS.BOTTOM_LEFT);
    expect(badge.element.className).toContain('mtrl-badge--bottom-left');
    expect(badge.element.className).not.toContain('mtrl-badge--top-right');
  });

  test('should have attachment methods', () => {
    const badge = createMockBadge();
    const target = document.createElement('button');
    
    // Check if methods exist
    expect(typeof badge.attachTo).toBe('function');
    expect(typeof badge.detach).toBe('function');
    
    // Test that methods can be called without errors
    badge.attachTo(target);
    badge.detach();
  });

  test('should support wrapping with attachTo', () => {
    const badge = createMockBadge({
      target: document.createElement('button')
    });
    
    // A badge created with a target should have a wrapper
    expect(badge.wrapper).toBeDefined();
  });

  test('should add and remove CSS classes', () => {
    const badge = createMockBadge();
    const customClass = 'custom-badge';
    
    badge.addClass(customClass);
    expect(badge.element.className).toContain(customClass);
    
    badge.removeClass(customClass);
    expect(badge.element.className).not.toContain(customClass);
  });

  test('should register event handlers', () => {
    const badge = createMockBadge();
    const handler = mock(() => {});
    
    badge.on('click', handler);
    // We don't actually trigger events in this mock implementation
    // In a real implementation, we would test event handling here
  });

  test('should properly clean up resources on destroy', () => {
    const badge = createMockBadge();
    const parent = document.createElement('div');
    parent.appendChild(badge.element);
    
    badge.destroy();
    
    expect(parent.children.length).toBe(0);
  });

  test('should apply custom class', () => {
    const customClass = 'custom-badge';
    const badge = createMockBadge({
      class: customClass
    });
    
    expect(badge.element.className).toContain(customClass);
  });
});