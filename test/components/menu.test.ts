// test/components/menu.test.ts
import { describe, test, expect, mock, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { JSDOM } from 'jsdom';

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
  global.Event = window.Event;
  global.MouseEvent = window.MouseEvent;
  global.KeyboardEvent = window.KeyboardEvent;
  global.CustomEvent = window.CustomEvent;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  
  // Clean up jsdom
  window.close();
});

// Menu item type
interface MenuItem {
  id: string;
  text: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  hasSubmenu?: boolean;
  submenu?: MenuItem[];
  data?: any;
}

// Menu divider type
interface MenuDivider {
  type: 'divider';
  id?: string;
}

// Menu content type
type MenuContent = MenuItem | MenuDivider;

// Menu placement type
type MenuPlacement = 'bottom-start' | 'bottom' | 'bottom-end' | 
                    'top-start' | 'top' | 'top-end' | 
                    'right-start' | 'right' | 'right-end' | 
                    'left-start' | 'left' | 'left-end';

// Menu config type
interface MenuConfig {
  anchor: HTMLElement | string | { element: HTMLElement };
  items: MenuContent[];
  placement?: MenuPlacement;
  closeOnSelect?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  openSubmenuOnHover?: boolean;
  width?: string;
  maxHeight?: string;
  offset?: number;
  autoFlip?: boolean;
  visible?: boolean;
  class?: string;
}

// Event types
interface MenuEvent {
  menu: any;
  originalEvent?: Event;
  preventDefault: () => void;
  defaultPrevented: boolean;
}

interface MenuSelectEvent extends MenuEvent {
  item: MenuItem;
  itemId: string;
  itemData?: any;
}

// Mock menu component factory
const createMenu = (config: MenuConfig) => {
  const element = document.createElement('div');
  element.className = `mtrl-menu ${config.class || ''}`;
  element.setAttribute('role', 'menu');
  element.setAttribute('tabindex', '-1');
  element.setAttribute('aria-hidden', (!config.visible).toString());
  
  // Resolve anchor element
  let anchorElement: HTMLElement | null = null;
  if (typeof config.anchor === 'string') {
    anchorElement = document.querySelector(config.anchor) as HTMLElement;
  } else if (config.anchor instanceof HTMLElement) {
    anchorElement = config.anchor;
  } else if (config.anchor && 'element' in config.anchor) {
    anchorElement = config.anchor.element;
  }
  
  if (!anchorElement) {
    // Create a mock anchor element if none was found
    anchorElement = document.createElement('button');
    anchorElement.className = 'mock-anchor';
    document.body.appendChild(anchorElement);
  }
  
  // Setup ARIA attributes
  anchorElement.setAttribute('aria-haspopup', 'true');
  anchorElement.setAttribute('aria-expanded', 'false');
  
  if (!element.id) {
    element.id = `menu-${Date.now()}`;
  }
  anchorElement.setAttribute('aria-controls', element.id);
  
  // Track state
  let visible = config.visible || false;
  let items = [...config.items];
  let placement = config.placement || 'bottom-start';
  let activeSubmenu: HTMLElement | null = null;
  
  // Create menu items
  const renderItems = () => {
    // Clear existing items
    element.innerHTML = '';
    
    // Create list container
    const list = document.createElement('ul');
    list.className = 'mtrl-menu-list';
    list.setAttribute('role', 'menu');
    
    // Add menu items
    items.forEach((item, index) => {
      if ('type' in item && item.type === 'divider') {
        // Create divider
        const divider = document.createElement('li');
        divider.className = 'mtrl-menu-divider';
        divider.setAttribute('role', 'separator');
        divider.setAttribute('data-index', index.toString());
        
        if (item.id) {
          divider.setAttribute('id', item.id);
        }
        
        list.appendChild(divider);
      } else {
        // Regular menu item
        const menuItem = item as MenuItem;
        const itemElement = document.createElement('li');
        itemElement.className = 'mtrl-menu-item';
        itemElement.setAttribute('role', 'menuitem');
        itemElement.setAttribute('tabindex', '-1');
        itemElement.setAttribute('data-id', menuItem.id);
        itemElement.setAttribute('data-index', index.toString());
        
        if (menuItem.disabled) {
          itemElement.classList.add('mtrl-menu-item--disabled');
          itemElement.setAttribute('aria-disabled', 'true');
        }
        
        if (menuItem.hasSubmenu) {
          itemElement.classList.add('mtrl-menu-item--submenu');
          itemElement.setAttribute('aria-haspopup', 'true');
          itemElement.setAttribute('aria-expanded', 'false');
        }
        
        // Create content container
        const content = document.createElement('span');
        content.className = 'mtrl-menu-item-content';
        
        // Add icon if present
        if (menuItem.icon) {
          const icon = document.createElement('span');
          icon.className = 'mtrl-menu-item-icon';
          icon.innerHTML = menuItem.icon;
          content.appendChild(icon);
        }
        
        // Add text
        const text = document.createElement('span');
        text.className = 'mtrl-menu-item-text';
        text.textContent = menuItem.text;
        content.appendChild(text);
        
        // Add shortcut if present
        if (menuItem.shortcut) {
          const shortcut = document.createElement('span');
          shortcut.className = 'mtrl-menu-item-shortcut';
          shortcut.textContent = menuItem.shortcut;
          content.appendChild(shortcut);
        }
        
        itemElement.appendChild(content);
        list.appendChild(itemElement);
      }
    });
    
    element.appendChild(list);
  };
  
  // Initial render
  renderItems();
  
  // If visible, add to document body
  if (visible) {
    document.body.appendChild(element);
    element.classList.add('mtrl-menu--visible');
  }
  
  // Event handlers storage
  const eventHandlers: Record<string, Function[]> = {};
  
  // Position the menu
  const positionMenu = () => {
    if (!visible || !element.parentNode) return;
    
    const anchorRect = anchorElement!.getBoundingClientRect();
    
    // Basic positioning based on placement
    switch (placement) {
      case 'bottom-start':
        element.style.top = `${anchorRect.bottom + (config.offset || 8)}px`;
        element.style.left = `${anchorRect.left}px`;
        break;
      case 'bottom':
        element.style.top = `${anchorRect.bottom + (config.offset || 8)}px`;
        element.style.left = `${anchorRect.left + (anchorRect.width / 2)}px`;
        element.style.transform = 'translateX(-50%)';
        break;
      case 'bottom-end':
        element.style.top = `${anchorRect.bottom + (config.offset || 8)}px`;
        element.style.left = `${anchorRect.right}px`;
        element.style.transform = 'translateX(-100%)';
        break;
      case 'top-start':
        element.style.bottom = `${window.innerHeight - anchorRect.top + (config.offset || 8)}px`;
        element.style.left = `${anchorRect.left}px`;
        break;
      default:
        // Default positioning
        element.style.top = `${anchorRect.bottom + (config.offset || 8)}px`;
        element.style.left = `${anchorRect.left}px`;
    }
    
    // Apply width if specified
    if (config.width) {
      element.style.width = config.width;
    }
    
    // Apply max height if specified
    if (config.maxHeight) {
      element.style.maxHeight = config.maxHeight;
    }
  };
  
  return {
    element,
    
    // Open the menu
    open(event?: Event, interactionType: 'mouse' | 'keyboard' = 'mouse') {
      visible = true;
      
      // Add to DOM if not already there
      if (!element.parentNode) {
        document.body.appendChild(element);
      }
      
      // Update ARIA attributes
      element.setAttribute('aria-hidden', 'false');
      element.classList.add('mtrl-menu--visible');
      anchorElement?.setAttribute('aria-expanded', 'true');
      
      // Position the menu
      positionMenu();
      
      // Trigger open event
      this.triggerEvent('open', { originalEvent: event });
      
      return this;
    },
    
    // Close the menu
    close(event?: Event) {
      visible = false;
      
      // Update ARIA attributes
      element.setAttribute('aria-hidden', 'true');
      element.classList.remove('mtrl-menu--visible');
      anchorElement?.setAttribute('aria-expanded', 'false');
      
      // Trigger close event
      this.triggerEvent('close', { originalEvent: event });
      
      // Remove from DOM after a delay (simulating animation)
      setTimeout(() => {
        if (element.parentNode && !visible) {
          element.parentNode.removeChild(element);
        }
      }, 300);
      
      return this;
    },
    
    // Toggle menu visibility
    toggle(event?: Event) {
      if (visible) {
        this.close(event);
      } else {
        this.open(event);
      }
      return this;
    },
    
    // Check if menu is open
    isOpen() {
      return visible;
    },
    
    // Set menu items
    setItems(newItems: MenuContent[]) {
      items = [...newItems];
      renderItems();
      return this;
    },
    
    // Get menu items
    getItems() {
      return [...items];
    },
    
    // Set anchor element
    setAnchor(newAnchor: HTMLElement | string) {
      let newAnchorElement: HTMLElement | null = null;
      
      if (typeof newAnchor === 'string') {
        newAnchorElement = document.querySelector(newAnchor) as HTMLElement;
      } else if (newAnchor instanceof HTMLElement) {
        newAnchorElement = newAnchor;
      }
      
      if (newAnchorElement) {
        // Remove attributes from old anchor
        anchorElement?.removeAttribute('aria-haspopup');
        anchorElement?.removeAttribute('aria-expanded');
        anchorElement?.removeAttribute('aria-controls');
        
        // Update to new anchor
        anchorElement = newAnchorElement;
        
        // Setup ARIA attributes
        anchorElement.setAttribute('aria-haspopup', 'true');
        anchorElement.setAttribute('aria-expanded', visible.toString());
        anchorElement.setAttribute('aria-controls', element.id);
        
        // Reposition if visible
        if (visible) {
          positionMenu();
        }
      }
      
      return this;
    },
    
    // Get current anchor element
    getAnchor() {
      return anchorElement;
    },
    
    // Set menu placement
    setPlacement(newPlacement: MenuPlacement) {
      placement = newPlacement;
      if (visible) {
        positionMenu();
      }
      return this;
    },
    
    // Get current placement
    getPlacement() {
      return placement;
    },
    
    // Event handling
    on(event: string, handler: Function) {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
      return this;
    },
    
    off(event: string, handler: Function) {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      return this;
    },
    
    // Helper to trigger events
    triggerEvent(eventName: string, data: any = {}) {
      const eventData = {
        menu: this,
        ...data,
        preventDefault: () => { eventData.defaultPrevented = true; },
        defaultPrevented: false
      };
      
      if (eventHandlers[eventName]) {
        eventHandlers[eventName].forEach(handler => handler(eventData));
      }
      
      return eventData;
    },
    
    // Cleanup
    destroy() {
      // Clear event handlers
      Object.keys(eventHandlers).forEach(event => {
        eventHandlers[event] = [];
      });
      
      // Remove from DOM
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Clean up anchor attributes
      anchorElement?.removeAttribute('aria-haspopup');
      anchorElement?.removeAttribute('aria-expanded');
      anchorElement?.removeAttribute('aria-controls');
      
      // If we created a mock anchor, clean it up
      if (anchorElement?.classList.contains('mock-anchor') && anchorElement.parentNode) {
        anchorElement.parentNode.removeChild(anchorElement);
      }
    }
  };
};

describe('Menu Component', () => {
  let mockAnchor: HTMLElement;
  
  beforeEach(() => {
    // Create a fresh anchor element for each test
    mockAnchor = document.createElement('button');
    mockAnchor.id = 'menu-anchor';
    mockAnchor.textContent = 'Open Menu';
    document.body.appendChild(mockAnchor);
  });
  
  afterEach(() => {
    // Clean up DOM after each test
    if (mockAnchor.parentNode) {
      mockAnchor.parentNode.removeChild(mockAnchor);
    }
    
    // Remove any menus that might have been added to the DOM
    document.querySelectorAll('.mtrl-menu').forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  });
  
  test('should create a menu element', () => {
    const menu = createMenu({
      anchor: mockAnchor,
      items: []
    });
    
    expect(menu.element).toBeDefined();
    expect(menu.element.tagName).toBe('DIV');
    expect(menu.element.className).toContain('mtrl-menu');
    expect(menu.element.getAttribute('role')).toBe('menu');
    expect(menu.element.getAttribute('aria-hidden')).toBe('true');
  });
  
  test('should properly connect to anchor element', () => {
    const menu = createMenu({
      anchor: mockAnchor,
      items: []
    });
    
    expect(menu.getAnchor()).toBe(mockAnchor);
    expect(mockAnchor.getAttribute('aria-haspopup')).toBe('true');
    expect(mockAnchor.getAttribute('aria-expanded')).toBe('false');
    expect(mockAnchor.getAttribute('aria-controls')).toBe(menu.element.id);
  });
  
  test('should correctly render menu items', () => {
    const items: MenuContent[] = [
      { id: 'item1', text: 'Item 1' },
      { id: 'item2', text: 'Item 2', icon: '<svg></svg>' },
      { type: 'divider' },
      { id: 'item3', text: 'Item 3', disabled: true },
      { id: 'item4', text: 'Item 4', shortcut: 'Ctrl+S' }
    ];
    
    const menu = createMenu({
      anchor: mockAnchor,
      items
    });
    
    // Check menu list
    const menuList = menu.element.querySelector('.mtrl-menu-list');
    expect(menuList).toBeDefined();
    expect(menuList?.getAttribute('role')).toBe('menu');
    
    // Check number of items (4 items + 1 divider)
    expect(menuList?.children.length).toBe(5);
    
    // Check regular item
    const item1 = menuList?.querySelector('[data-id="item1"]');
    expect(item1).toBeDefined();
    expect(item1?.textContent).toContain('Item 1');
    
    // Check item with icon
    const item2 = menuList?.querySelector('[data-id="item2"]');
    expect(item2).toBeDefined();
    const icon = item2?.querySelector('.mtrl-menu-item-icon');
    expect(icon).toBeDefined();
    expect(icon?.innerHTML).toBe('<svg></svg>');
    
    // Check divider
    const divider = menuList?.querySelector('.mtrl-menu-divider');
    expect(divider).toBeDefined();
    expect(divider?.getAttribute('role')).toBe('separator');
    
    // Check disabled item
    const item3 = menuList?.querySelector('[data-id="item3"]');
    expect(item3).toBeDefined();
    expect(item3?.classList.contains('mtrl-menu-item--disabled')).toBe(true);
    expect(item3?.getAttribute('aria-disabled')).toBe('true');
    
    // Check item with shortcut
    const item4 = menuList?.querySelector('[data-id="item4"]');
    expect(item4).toBeDefined();
    const shortcut = item4?.querySelector('.mtrl-menu-item-shortcut');
    expect(shortcut).toBeDefined();
    expect(shortcut?.textContent).toBe('Ctrl+S');
  });
  
  test('should handle submenu items correctly', () => {
    const items: MenuContent[] = [
      { id: 'item1', text: 'Item 1' },
      { 
        id: 'submenu', 
        text: 'Submenu', 
        hasSubmenu: true,
        submenu: [
          { id: 'sub1', text: 'Submenu Item 1' },
          { id: 'sub2', text: 'Submenu Item 2' }
        ]
      }
    ];
    
    const menu = createMenu({
      anchor: mockAnchor,
      items
    });
    
    const submenuItem = menu.element.querySelector('[data-id="submenu"]');
    expect(submenuItem).toBeDefined();
    expect(submenuItem?.classList.contains('mtrl-menu-item--submenu')).toBe(true);
    expect(submenuItem?.getAttribute('aria-haspopup')).toBe('true');
    expect(submenuItem?.getAttribute('aria-expanded')).toBe('false');
  });
  
  test('should be able to update items', () => {
    const initialItems: MenuContent[] = [
      { id: 'item1', text: 'Item 1' }
    ];
    
    const menu = createMenu({
      anchor: mockAnchor,
      items: initialItems
    });
    
    expect(menu.element.querySelectorAll('.mtrl-menu-item').length).toBe(1);
    
    const newItems: MenuContent[] = [
      { id: 'item1', text: 'Item 1' },
      { id: 'item2', text: 'Item 2' },
      { id: 'item3', text: 'Item 3' }
    ];
    
    menu.setItems(newItems);
    
    expect(menu.element.querySelectorAll('.mtrl-menu-item').length).toBe(3);
    expect(menu.getItems()).toEqual(newItems);
  });
  
  test('should handle opening and closing', () => {
    const menu = createMenu({
      anchor: mockAnchor,
      items: [{ id: 'item1', text: 'Item 1' }]
    });
    
    // Initially not added to DOM and not visible
    expect(menu.isOpen()).toBe(false);
    expect(menu.element.parentNode).toBeNull();
    
    // Open the menu
    menu.open();
    
    // Should be added to DOM and marked as visible
    expect(menu.isOpen()).toBe(true);
    expect(menu.element.parentNode).toBe(document.body);
    expect(menu.element.classList.contains('mtrl-menu--visible')).toBe(true);
    expect(menu.element.getAttribute('aria-hidden')).toBe('false');
    expect(mockAnchor.getAttribute('aria-expanded')).toBe('true');
    
    // Close the menu
    menu.close();
    
    // Should be marked as hidden immediately
    expect(menu.isOpen()).toBe(false);
    expect(menu.element.classList.contains('mtrl-menu--visible')).toBe(false);
    expect(menu.element.getAttribute('aria-hidden')).toBe('true');
    expect(mockAnchor.getAttribute('aria-expanded')).toBe('false');
    
    // Should be removed from DOM after animation (mocked with setTimeout)
    // Need to advance timers or wait for setTimeout
  });
  
  test('should toggle visibility', () => {
    const menu = createMenu({
      anchor: mockAnchor,
      items: [{ id: 'item1', text: 'Item 1' }]
    });
    
    expect(menu.isOpen()).toBe(false);
    
    // Toggle on
    menu.toggle();
    expect(menu.isOpen()).toBe(true);
    
    // Toggle off
    menu.toggle();
    expect(menu.isOpen()).toBe(false);
  });
  
  test('should be able to change anchor', () => {
    const menu = createMenu({
      anchor: mockAnchor,
      items: [{ id: 'item1', text: 'Item 1' }]
    });
    
    // Initial anchor
    expect(menu.getAnchor()).toBe(mockAnchor);
    
    // Create a new anchor
    const newAnchor = document.createElement('button');
    newAnchor.id = 'new-anchor';
    document.body.appendChild(newAnchor);
    
    // Change anchor
    menu.setAnchor(newAnchor);
    
    // Check new anchor
    expect(menu.getAnchor()).toBe(newAnchor);
    expect(newAnchor.getAttribute('aria-haspopup')).toBe('true');
    expect(newAnchor.getAttribute('aria-expanded')).toBe('false');
    
    // Old anchor should no longer have attributes
    expect(mockAnchor.getAttribute('aria-haspopup')).toBeNull();
    
    // Clean up
    if (newAnchor.parentNode) {
      newAnchor.parentNode.removeChild(newAnchor);
    }
  });
  
  test('should be able to change placement', () => {
    const menu = createMenu({
      anchor: mockAnchor,
      items: [{ id: 'item1', text: 'Item 1' }],
      placement: 'bottom-start'
    });
    
    expect(menu.getPlacement()).toBe('bottom-start');
    
    menu.setPlacement('top-end');
    
    expect(menu.getPlacement()).toBe('top-end');
  });
  
  test('should trigger events', () => {
    const menu = createMenu({
      anchor: mockAnchor,
      items: [
        { id: 'item1', text: 'Item 1' },
        { id: 'item2', text: 'Item 2' }
      ]
    });
    
    // Setup event handlers
    const openHandler = mock((e: MenuEvent) => {});
    const closeHandler = mock((e: MenuEvent) => {});
    const selectHandler = mock((e: MenuSelectEvent) => {});
    
    menu.on('open', openHandler);
    menu.on('close', closeHandler);
    menu.on('select', selectHandler);
    
    // Test open event
    menu.open();
    expect(openHandler).toHaveBeenCalled();
    
    // Test close event
    menu.close();
    expect(closeHandler).toHaveBeenCalled();
    
    // Test select event
    const item = { id: 'item1', text: 'Item 1' };
    menu.triggerEvent('select', { item, itemId: item.id });
    expect(selectHandler).toHaveBeenCalled();
    expect(selectHandler.mock.calls[0][0].itemId).toBe('item1');
  });
  
  test('should clean up properly on destroy', () => {
    const menu = createMenu({
      anchor: mockAnchor,
      items: [{ id: 'item1', text: 'Item 1' }]
    });
    
    // Open menu so it's in the DOM
    menu.open();
    
    expect(document.body.contains(menu.element)).toBe(true);
    expect(mockAnchor.hasAttribute('aria-haspopup')).toBe(true);
    
    // Destroy the menu
    menu.destroy();
    
    // Menu should be removed from DOM
    expect(document.body.contains(menu.element)).toBe(false);
    
    // Anchor should have attributes removed
    expect(mockAnchor.hasAttribute('aria-haspopup')).toBe(false);
    expect(mockAnchor.hasAttribute('aria-expanded')).toBe(false);
    expect(mockAnchor.hasAttribute('aria-controls')).toBe(false);
  });
});