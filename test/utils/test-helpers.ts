// Test helper utilities
import { ElementComponent } from '../../src/core/compose/component';
import { LifecycleComponent } from '../../src/core/compose/features/lifecycle';
import { InputComponent } from '../../src/core/compose/features/input';
import { PREFIX } from '../../src/core/config';

/**
 * Creates a base component that fully implements the ElementComponent interface
 */
export function createTestComponent(element?: HTMLElement): ElementComponent {
  const el = element || document.createElement('div');
  
  const component: ElementComponent = {
    element: el,
    getClass: (name: string = '') => `${PREFIX}-${name}`,
    getModifierClass: (base: string, modifier: string) => `${base}--${modifier}`,
    getElementClass: (base: string, element: string) => `${base}__${element}`,
    addClass: (...classes: string[]) => {
      classes.filter(Boolean).forEach(cls => el.classList.add(cls));
      return component;
    },
    destroy: () => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
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
}

/**
 * Creates a component with lifecycle methods
 */
export function createComponentWithLifecycle(): ElementComponent & LifecycleComponent {
  const component = createTestComponent();
  
  const isMounted = { value: false };
  
  return {
    ...component,
    lifecycle: {
      mount: () => { isMounted.value = true; },
      destroy: () => { isMounted.value = false; },
      unmount: () => { isMounted.value = false; },
      isMounted: () => isMounted.value,
      onMount: (handler) => {
        handler();
        return () => {};
      },
      onUnmount: (handler) => {
        return () => {};
      }
    }
  };
}

/**
 * Creates an input component for testing
 */
export function createInputComponent(): InputComponent {
  const component = createTestComponent();
  const input = document.createElement('input');
  component.element.appendChild(input);
  
  const inputComponent = {
    ...component,
    input,
    getValue: () => input.value,
    setValue: (value: string) => {
      input.value = value;
      return inputComponent;
    }
  };
  
  return inputComponent;
}

/**
 * Extends Window type guard to work with JSDOM
 */
export function setupJSDOM(dom: any): void {
  // Set globals to use jsdom
  (global as any).document = dom.window.document;
  (global as any).window = dom.window;
  (global as any).Element = dom.window.Element;
  (global as any).HTMLElement = dom.window.HTMLElement;
  (global as any).HTMLButtonElement = dom.window.HTMLButtonElement;
  (global as any).HTMLInputElement = dom.window.HTMLInputElement;
  (global as any).Event = dom.window.Event;
  (global as any).MouseEvent = dom.window.MouseEvent;
  (global as any).KeyboardEvent = dom.window.KeyboardEvent;
  (global as any).CustomEvent = dom.window.CustomEvent;
  (global as any).Touch = dom.window.Touch;
  (global as any).TouchEvent = dom.window.TouchEvent;
  (global as any).Node = dom.window.Node;
}

/**
 * Creates a mock gesture detection context for testing
 */
export function createGestureContext(customState: any = {}, customOptions: any = {}) {
  return {
    state: {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      lastX: 0,
      lastY: 0,
      startTime: Date.now(),
      target: document.createElement('div'),
      touchCount: 1,
      longPressTimer: null,
      startDistance: 0,
      startAngle: 0,
      currentDistance: 0,
      currentAngle: 0,
      ...customState
    },
    options: {
      ...customOptions
    },
    originalEvent: new Event('test')
  };
} 