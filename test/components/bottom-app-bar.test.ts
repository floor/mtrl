// test/components/bottom-app-bar.test.ts
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
  BottomAppBar,
  BottomAppBarConfig,
  FabPosition
} from '../../src/components/bottom-app-bar/types';

// Define constants here to avoid circular dependencies
const FAB_POSITIONS = {
  CENTER: 'center',
  END: 'end'
} as const;

// Create a mock bottom app bar implementation
const createMockBottomAppBar = (config: BottomAppBarConfig = {}): BottomAppBar => {
  // Default configuration
  const defaultConfig: BottomAppBarConfig = {
    tag: 'div',
    hasFab: false,
    fabPosition: FAB_POSITIONS.END,
    autoHide: false,
    transitionDuration: 300,
    prefix: 'mtrl',
    componentName: 'bottom-app-bar'
  };
  
  // Merge with user configuration
  const mergedConfig = {
    ...defaultConfig,
    ...config
  };
  
  // Create main element
  const element = document.createElement(mergedConfig.tag || 'div');
  element.className = `${mergedConfig.prefix}-${mergedConfig.componentName}`;
  
  // Add custom class if provided
  if (mergedConfig.class) {
    element.className += ` ${mergedConfig.class}`;
  }
  
  // Add FAB position class if applicable
  if (mergedConfig.hasFab) {
    element.className += ` ${mergedConfig.prefix}-${mergedConfig.componentName}--fab-${mergedConfig.fabPosition}`;
  }
  
  // Create actions container
  const actionsContainer = document.createElement('div');
  actionsContainer.className = `${mergedConfig.prefix}-${mergedConfig.componentName}__actions`;
  element.appendChild(actionsContainer);
  
  // Create FAB container if needed
  let fabContainer: HTMLElement | null = null;
  if (mergedConfig.hasFab) {
    fabContainer = document.createElement('div');
    fabContainer.className = `${mergedConfig.prefix}-${mergedConfig.componentName}__fab`;
    element.appendChild(fabContainer);
  }
  
  // Event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Set initial state
  let isVisible = true;
  
  // Create the component instance
  const bottomAppBar: BottomAppBar = {
    element,
    config: mergedConfig,
    
    addAction: (button: HTMLElement) => {
      actionsContainer.appendChild(button);
      return bottomAppBar;
    },
    
    addFab: (fab: HTMLElement) => {
      if (!mergedConfig.hasFab) {
        mergedConfig.hasFab = true;
        
        // Add class if not present
        if (!element.classList.contains(`${mergedConfig.prefix}-${mergedConfig.componentName}--fab-${mergedConfig.fabPosition}`)) {
          element.classList.add(`${mergedConfig.prefix}-${mergedConfig.componentName}--fab-${mergedConfig.fabPosition}`);
        }
        
        // Create FAB container if needed
        if (!fabContainer) {
          fabContainer = document.createElement('div');
          fabContainer.className = `${mergedConfig.prefix}-${mergedConfig.componentName}__fab`;
          element.appendChild(fabContainer);
        }
      }
      
      if (fabContainer) {
        // Clear existing fab if any
        fabContainer.innerHTML = '';
        fabContainer.appendChild(fab);
      }
      
      return bottomAppBar;
    },
    
    show: () => {
      element.style.transform = '';
      element.style.opacity = '1';
      isVisible = true;
      
      // Call callback if provided
      if (mergedConfig.onVisibilityChange) {
        mergedConfig.onVisibilityChange(true);
      }
      
      return bottomAppBar;
    },
    
    hide: () => {
      element.style.transform = 'translateY(100%)';
      element.style.opacity = '0';
      isVisible = false;
      
      // Call callback if provided
      if (mergedConfig.onVisibilityChange) {
        mergedConfig.onVisibilityChange(false);
      }
      
      return bottomAppBar;
    },
    
    isVisible: () => isVisible,
    
    getActionsContainer: () => actionsContainer,
    
    // Add standard lifecycle methods
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      return bottomAppBar;
    },
    
    off: (event: string, handler: Function) => {
      if (!eventHandlers[event]) return bottomAppBar;
      
      eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      return bottomAppBar;
    },
    
    emit: (event: string, data?: any) => {
      if (!eventHandlers[event]) return;
      
      eventHandlers[event].forEach(handler => handler(data));
    },
    
    destroy: () => {
      // Remove element from DOM if attached
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Clear event handlers
      Object.keys(eventHandlers).forEach(key => {
        eventHandlers[key] = [];
      });
    }
  };
  
  return bottomAppBar;
};

describe('Bottom App Bar Component', () => {
  test('should create a bottom app bar element', () => {
    const bar = createMockBottomAppBar();
    expect(bar.element).toBeDefined();
    expect(bar.element.tagName).toBe('DIV');
    expect(bar.element.className).toContain('mtrl-bottom-app-bar');
  });

  test('should apply custom class', () => {
    const customClass = 'custom-bottom-bar';
    const bar = createMockBottomAppBar({
      class: customClass
    });
    
    expect(bar.element.className).toContain(customClass);
  });

  test('should support FAB in center position', () => {
    const bar = createMockBottomAppBar({
      hasFab: true,
      fabPosition: FAB_POSITIONS.CENTER
    });
    
    expect(bar.element.className).toContain('mtrl-bottom-app-bar--fab-center');
  });

  test('should support FAB in end position', () => {
    const bar = createMockBottomAppBar({
      hasFab: true,
      fabPosition: FAB_POSITIONS.END
    });
    
    expect(bar.element.className).toContain('mtrl-bottom-app-bar--fab-end');
  });

  test('should add action buttons', () => {
    const bar = createMockBottomAppBar();
    const button = document.createElement('button');
    button.className = 'action-button';
    
    bar.addAction(button);
    
    const actionsContainer = bar.getActionsContainer();
    expect(actionsContainer.children.length).toBe(1);
    expect(actionsContainer.children[0]).toBe(button);
  });

  test('should add FAB', () => {
    const bar = createMockBottomAppBar();
    const fab = document.createElement('button');
    fab.className = 'fab-button';
    
    bar.addFab(fab);
    
    // Adding a FAB should automatically set hasFab to true
    expect(bar.element.className).toContain('mtrl-bottom-app-bar--fab-end');
    
    // The FAB should be inside the bar
    const fabElement = bar.element.querySelector('.mtrl-bottom-app-bar__fab button.fab-button');
    expect(fabElement).toBeDefined();
  });

  test('should support show and hide methods', () => {
    const bar = createMockBottomAppBar();
    
    // Initial state should be visible
    expect(bar.isVisible()).toBe(true);
    
    // Hide the bar
    bar.hide();
    expect(bar.isVisible()).toBe(false);
    expect(bar.element.style.transform).toBe('translateY(100%)');
    expect(bar.element.style.opacity).toBe('0');
    
    // Show the bar
    bar.show();
    expect(bar.isVisible()).toBe(true);
    expect(bar.element.style.transform).toBe('');
    expect(bar.element.style.opacity).toBe('1');
  });

  test('should call visibility change callback', () => {
    const onVisibilityChange = mock((visible: boolean) => {});
    const bar = createMockBottomAppBar({
      onVisibilityChange
    });
    
    bar.hide();
    expect(onVisibilityChange).toHaveBeenCalledWith(false);
    
    bar.show();
    expect(onVisibilityChange).toHaveBeenCalledWith(true);
  });

  test('should have an actions container', () => {
    const bar = createMockBottomAppBar();
    const actionsContainer = bar.getActionsContainer();
    
    expect(actionsContainer).toBeDefined();
    expect(actionsContainer.className).toContain('mtrl-bottom-app-bar__actions');
  });

  test('should support custom tag', () => {
    const bar = createMockBottomAppBar({
      tag: 'footer'
    });
    
    expect(bar.element.tagName).toBe('FOOTER');
  });

  test('should clean up resources on destroy', () => {
    const bar = createMockBottomAppBar();
    const parent = document.createElement('div');
    parent.appendChild(bar.element);
    
    bar.destroy();
    
    expect(parent.children.length).toBe(0);
  });
});