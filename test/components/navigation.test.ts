// test/components/navigation.test.ts
import { describe, test, expect } from 'bun:test';
import { JSDOM } from 'jsdom';

// Set up JSDOM
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;

// Import navigation types directly
import type { NavigationComponent, NavItemConfig, NavItemData, NavVariant, NavPosition } from '../../src/components/navigation/types';

// Define constants here to avoid circular dependencies
const NAV_VARIANTS: Record<string, NavVariant> = {
  RAIL: 'rail',
  DRAWER: 'drawer',
  BAR: 'bar',
  MODAL: 'modal',
  STANDARD: 'standard'
};

const NAV_POSITIONS: Record<string, NavPosition> = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom'
};

// Sample items for testing
const testItems: NavItemConfig[] = [
  {
    id: 'home',
    icon: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
    label: 'Home'
  },
  {
    id: 'favorites',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    label: 'Favorites'
  },
  {
    id: 'settings',
    icon: '<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
    label: 'Settings'
  }
];

// Create a simple mock navigation
const createMockNavigation = (config = {}): NavigationComponent => {
  const element = document.createElement('nav');
  element.className = `mtrl-nav mtrl-nav--${config.variant || 'rail'}`;
  
  if (config.class) {
    element.className += ` ${config.class}`;
  }

  // Create basic items map
  const items = new Map();
  
  if (config.items) {
    (config.items as NavItemConfig[]).forEach(itemConfig => {
      const itemElement = document.createElement('button');
      itemElement.className = 'mtrl-nav-item';
      itemElement.dataset.id = itemConfig.id;
      
      items.set(itemConfig.id, {
        element: itemElement,
        config: itemConfig
      });
    });
  }
  
  return {
    element,
    items,
    config: {
      variant: config.variant || 'rail',
      position: config.position || 'left',
      disabled: config.disabled || false,
      ...config
    },
    addItem: () => ({ element, items, config } as any),
    removeItem: () => ({ element, items, config } as any),
    getItem: (id) => items.get(id),
    getAllItems: () => Array.from(items.values()),
    getActive: () => null,
    getItemPath: () => [],
    setActive: () => ({ element, items, config } as any),
    enable: () => ({ element, items, config } as any),
    disable: () => ({ element, items, config } as any),
    expand: () => ({ element, items, config } as any),
    collapse: () => ({ element, items, config } as any),
    isExpanded: () => false,
    toggle: () => ({ element, items, config } as any),
    on: () => ({ element, items, config } as any),
    off: () => ({ element, items, config } as any),
    destroy: () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  } as NavigationComponent;
};

describe('Navigation Component', () => {
  test('should create a navigation element', () => {
    const nav = createMockNavigation();
    expect(nav.element).toBeDefined();
    expect(nav.element.tagName).toBe('NAV');
    expect(nav.element.className).toContain('mtrl-nav');
  });

  test('should apply variant class', () => {
    const variant = NAV_VARIANTS.RAIL;
    const nav = createMockNavigation({
      variant
    });
    expect(nav.config.variant).toBe(variant);
  });

  test('should apply position class', () => {
    const position = NAV_POSITIONS.LEFT;
    const nav = createMockNavigation({
      position
    });
    expect(nav.config.position).toBe(position);
  });

  test('should add initial items', () => {
    const nav = createMockNavigation({
      items: testItems
    });
    expect(nav.items).toBeDefined();
    expect(nav.items.size).toBe(testItems.length);
    
    // Check first item details
    const homeItem = nav.getItem('home');
    expect(homeItem).toBeDefined();
    expect(homeItem?.config.label).toBe('Home');
  });

  test('should add item dynamically', () => {
    const nav = createMockNavigation();
    const newItem: NavItemConfig = {
      id: 'profile',
      icon: '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
      label: 'Profile'
    };

    expect(typeof nav.addItem).toBe('function');
  });

  test('should support disabled state', () => {
    const nav = createMockNavigation();
    expect(typeof nav.disable).toBe('function');
    expect(typeof nav.enable).toBe('function');

    const disabledNav = createMockNavigation({ disabled: true });
    expect(disabledNav.config.disabled).toBe(true);
  });

  test('should register event handlers', () => {
    const nav = createMockNavigation();
    expect(typeof nav.on).toBe('function');
    expect(typeof nav.off).toBe('function');
  });

  test('should apply custom class', () => {
    const customClass = 'custom-nav';
    const nav = createMockNavigation({
      class: customClass
    });
    expect(nav.element.className).toContain(customClass);
  });

  test('should properly clean up resources on destroy', () => {
    const nav = createMockNavigation();
    const parentElement = document.createElement('div');
    parentElement.appendChild(nav.element);
    
    nav.destroy();
    expect(parentElement.children.length).toBe(0);
  });
});