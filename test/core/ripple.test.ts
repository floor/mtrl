// test/core/ripple.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { withRipple } from '../../src/core/compose/features/ripple';
import { PREFIX } from '../../src/core/config';
import { ElementComponent } from '../../src/core/compose/component';
import { LifecycleComponent } from '../../src/core/compose/features/lifecycle';

// Setup jsdom environment
let dom: JSDOM;
let window: any;  // Use any type to avoid TypeScript errors
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
  (global as any).document = document;
  (global as any).window = window;
  (global as any).Element = window.Element;
  (global as any).HTMLElement = window.HTMLElement;
  (global as any).Event = window.Event;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  
  // Clean up jsdom
  window.close();
});

// Create a helper function that creates a base component
const createBaseComponent = (): ElementComponent => {
  const element = document.createElement('div');
  
  const component: ElementComponent = {
    element,
    getClass: (name: string) => `${PREFIX}-${name}`,
    getModifierClass: (base: string, modifier: string) => `${base}--${modifier}`,
    getElementClass: (base: string, element: string) => `${base}__${element}`,
    addClass: (...classes: string[]) => {
      classes.filter(Boolean).forEach(cls => element.classList.add(cls));
      return component;
    },
    destroy: () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    },
    touchState: {
      startTime: 0,
      startPosition: { x: 0, y: 0 },
      isTouching: false,
      activeTarget: null
    },
    updateTouchState: (event: Event, status: 'start' | 'end') => {
      if (status === 'start') {
        component.touchState.startTime = Date.now();
        component.touchState.isTouching = true;
      } else {
        component.touchState.isTouching = false;
      }
    },
    componentName: 'test-component',
    config: {}
  };
  
  return component;
};

// Create a component with lifecycle methods
const createComponentWithLifecycle = (): ElementComponent & LifecycleComponent => {
  const component = createBaseComponent();
  
  // Use mocks to track calls
  const mountMock = mock(() => {});
  const destroyMock = mock(() => {});
  
  return {
    ...component,
    lifecycle: {
      mount: mountMock,
      destroy: destroyMock,
      unmount: mock(() => {}),
      isMounted: mock(() => false),
      onMount: (handler) => {
        handler();
        return () => {};
      },
      onUnmount: (handler) => {
        return () => {};
      }
    }
  };
};

describe('Ripple Effect', () => {
  test('should create a component with ripple capabilities', () => {
    // Create a base component
    const baseComponent = createBaseComponent();
    
    // Add ripple capabilities to the component
    const enhanced = withRipple({ ripple: true })(baseComponent);
    
    // Verify that the ripple capabilities were added
    expect(enhanced.ripple).toBeDefined();
    expect(typeof enhanced.ripple.mount).toBe('function');
    expect(typeof enhanced.ripple.unmount).toBe('function');
  });

  test('should not add ripple when disabled in config', () => {
    // Create a base component
    const baseComponent = createBaseComponent();
    
    // Try to add ripple with ripple: false
    const enhanced = withRipple({ ripple: false })(baseComponent);
    
    // Verify that ripple capabilities weren't added
    expect(enhanced.ripple).toBeUndefined();
  });

  test('should add ripple container to element', () => {
    // Create a base component
    const baseComponent = createBaseComponent();
    
    // Add ripple capabilities to the component
    const enhanced = withRipple({ ripple: true })(baseComponent);
    
    // Verify that a ripple container was added to the element
    const rippleContainer = enhanced.element.querySelector(`.${PREFIX}-ripple`);
    expect(rippleContainer).not.toBeNull();
  });

  test('should integrate with lifecycle methods if available', () => {
    // Create a base component with lifecycle methods
    const mountCounter = { count: 0 };
    const destroyCounter = { count: 0 };
    
    const componentWithLifecycle = createBaseComponent() as ElementComponent & LifecycleComponent;
    
    // Add custom lifecycle methods that increment our counters
    componentWithLifecycle.lifecycle = {
      mount: () => { mountCounter.count++; },
      destroy: () => { destroyCounter.count++; },
      unmount: () => {},
      isMounted: () => false,
      onMount: (handler) => {
        handler();
        return () => {};
      },
      onUnmount: (handler) => {
        return () => {};
      }
    };
    
    // Add ripple capabilities to the component
    const enhanced = withRipple({ ripple: true })(componentWithLifecycle);
    
    // Call lifecycle methods
    enhanced.lifecycle.mount();
    enhanced.lifecycle.destroy();
    
    // Verify that original lifecycle methods were called
    expect(mountCounter.count).toBe(1);
    expect(destroyCounter.count).toBe(1);
  });
});