// Test helper utilities for feature tests
import { ElementComponent } from '../../../../src/core/compose/component';
import { InputComponent } from '../../../../src/core/compose/features/input';
import { PREFIX } from '../../../../src/core/config';
import { GestureDetectionContext, GestureState, GestureConfig } from '../../../../src/core/gestures/types';

/**
 * Creates a properly typed element component for testing
 */
export function createTestElementComponent(element = document.createElement('div')): ElementComponent {
  return {
    element,
    getClass: (name?: string) => `${PREFIX}-${name || ''}`,
    getModifierClass: (base: string, modifier: string) => `${base}--${modifier}`,
    getElementClass: (base: string, element: string) => `${base}__${element}`,
    addClass: (...classes: string[]) => {
      classes.filter(Boolean).forEach(cls => element.classList.add(cls));
      return {} as ElementComponent; // Return type cast for compatibility
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
      // No implementation needed for tests
    },
    componentName: 'test-component',
    config: {}
  };
}

/**
 * Creates a test element with just the minimal required properties for specific tests
 */
export function createMinimalComponent(): any {
  return {
    element: document.createElement('div'),
    getClass: (name?: string) => `${PREFIX}-${name || ''}`
  };
}

/**
 * Creates a test input component
 */
export function createTestInputComponent(): InputComponent {
  const element = document.createElement('div');
  const input = document.createElement('input');
  element.appendChild(input);
  
  const component = {
    element,
    input,
    getClass: (name?: string) => `${PREFIX}-${name || ''}`,
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
      // No implementation needed for tests
    },
    componentName: 'test-component',
    config: {},
    getValue: () => input.value,
    setValue: (value: string) => {
      input.value = value;
      return component;
    }
  };
  
  return component;
}

/**
 * Creates a valid GestureDetectionContext for testing
 */
export function createGestureContext(customState: Partial<GestureState> = {}): GestureDetectionContext {
  // Create default state
  const state: GestureState = {
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
    lastTapTime: 0,
    tapCount: 0,
    ...customState
  };
  
  // Default options that match the Required<GestureConfig> interface
  const options = {
    swipeThreshold: 30,
    swipeTimeThreshold: 300,
    longPressTime: 500,
    tapDistanceThreshold: 10,
    preventDefault: true,
    stopPropagation: false
  };
  
  return {
    state,
    options,
    originalEvent: new Event('test')
  };
} 