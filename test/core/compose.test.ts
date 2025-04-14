// test/core/compose.test.ts
import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { JSDOM } from 'jsdom';

// Setup JSDOM environment
let dom: JSDOM;
let window: Window;
let document: Document;
let globalThis: any;

// Import core compose modules and features
import {
  pipe,
  compose,
  transform,
  createComponent,
  createBase,
  withElement,
  withEvents,
  withText,
  withIcon,
  withVariant,
  withSize,
  withPosition,
  withDisabled,
  withLifecycle,
  withInput,
  withCheckable,
  withStyle
} from '../src/core/compose';

// Mock build modules
jest.mock('../src/core/build/text', () => ({
  createText: jest.fn().mockImplementation(() => ({
    setText: jest.fn().mockReturnThis(),
    getText: jest.fn().mockReturnValue('Text content'),
    getElement: jest.fn().mockReturnValue(document.createElement('span'))
  }))
}));

jest.mock('../src/core/build/icon', () => ({
  createIcon: jest.fn().mockImplementation(() => ({
    setIcon: jest.fn().mockReturnThis(),
    getIcon: jest.fn().mockReturnValue('<svg></svg>'),
    getElement: jest.fn().mockReturnValue(document.createElement('span'))
  }))
}));

describe('Core Compose Module', () => {
  // Setup and teardown for each test
  beforeEach(() => {
    // Setup JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost/',
      contentType: 'text/html',
    });

    global.window = dom.window as any;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.Event = dom.window.Event;
    global.MouseEvent = dom.window.MouseEvent;
    global.Touch = dom.window.Touch;
    global.TouchEvent = dom.window.TouchEvent;
    global.getComputedStyle = dom.window.getComputedStyle;
  });

  afterEach(() => {
    // Clean up
    jest.clearAllMocks();
    delete global.window;
    delete global.document;
    delete global.HTMLElement;
    delete global.Event;
    delete global.MouseEvent;
    delete global.Touch;
    delete global.TouchEvent;
    delete global.getComputedStyle;
  });

  describe('Composition Utilities', () => {
    test('pipe should compose functions from left to right', () => {
      const addOne = (x: number) => x + 1;
      const double = (x: number) => x * 2;
      const addOneThenDouble = pipe(addOne, double);
      
      expect(addOneThenDouble(3)).toBe(8);
    });

    test('compose should compose functions from right to left', () => {
      const addOne = (x: number) => x + 1;
      const double = (x: number) => x * 2;
      const doubleTheAddOne = compose(addOne, double);
      
      expect(doubleTheAddOne(3)).toBe(7);
    });

    test('transform should apply multiple transformations with shared context', () => {
      const withName = (obj: any, context: any) => ({ ...obj, name: context.name });
      const withAge = (obj: any, context: any) => ({ ...obj, age: context.age });
      const createPerson = transform(withName, withAge);
      
      const person = createPerson({}, { name: 'John', age: 30 });
      expect(person).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('Base Component Creation', () => {
    test('createComponent should return a basic component', () => {
      const config = { testKey: 'testValue' };
      const component = createComponent(config);
      
      expect(component).toHaveProperty('element', null);
      expect(component).toHaveProperty('config', config);
      expect(component.setup()).toBe(component);
    });

    test('createBase should return a component with prefix utilities', () => {
      const config = { componentName: 'test' };
      const component = createBase(config);
      
      expect(component.componentName).toBe('test');
      expect(component.getClass('button')).toBe('mtrl-button');
      expect(component.getModifierClass('button', 'primary')).toBe('button--primary');
      expect(component.getElementClass('button', 'icon')).toBe('button-icon');
    });

    test('createBase should use custom prefix when provided', () => {
      const config = { componentName: 'test', prefix: 'custom' };
      const component = createBase(config);
      
      expect(component.getClass('button')).toBe('custom-button');
    });
  });

  describe('withElement', () => {
    test('should add an element to a component', () => {
      const baseComponent = createBase({ componentName: 'button' });
      const component = withElement({
        tag: 'button',
        className: ['primary'],
        attrs: { 'data-test': 'test' }
      })(baseComponent);
      
      expect(component.element).toBeInstanceOf(HTMLElement);
      expect(component.element.tagName).toBe('BUTTON');
      expect(component.element.classList.contains('mtrl-button')).toBe(true);
      expect(component.element.classList.contains('mtrl-primary')).toBe(true);
      expect(component.element.getAttribute('data-test')).toBe('test');
    });

    test('should use componentName from options if provided', () => {
      const baseComponent = createBase({});
      const component = withElement({
        tag: 'button',
        componentName: 'custom-button',
      })(baseComponent);
      
      expect(component.element.classList.contains('mtrl-custom-button')).toBe(true);
    });

    test('should provide addClass method', () => {
      const baseComponent = createBase({});
      const component = withElement()(baseComponent);
      
      component.addClass('test-class', 'another-class');
      expect(component.element.classList.contains('test-class')).toBe(true);
      expect(component.element.classList.contains('another-class')).toBe(true);
    });

    test('should provide destroy method', () => {
      const baseComponent = createBase({});
      const component = withElement()(baseComponent);
      
      const parent = document.createElement('div');
      parent.appendChild(component.element);
      
      expect(parent.childNodes.length).toBe(1);
      component.destroy();
      expect(parent.childNodes.length).toBe(0);
    });
  });

  describe('Feature Enhancers', () => {
    test('withEvents should add event capabilities', () => {
      const baseComponent = createBase({});
      const component = pipe(
        withElement(),
        withEvents()
      )(baseComponent);
      
      // Create spy functions
      const spy = mock(() => {});
      
      // Verify event methods exist
      expect(typeof component.on).toBe('function');
      expect(typeof component.off).toBe('function');
      expect(typeof component.emit).toBe('function');
      
      // Subscribe to event
      component.on('test', spy);
      component.emit('test', { data: 'value' });
      
      expect(spy).toHaveBeenCalled();
      
      // Unsubscribe
      component.off('test', spy);
      component.emit('test', { data: 'value2' });
      
      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('withText should add text management', () => {
      const baseComponent = createBase({});
      const component = pipe(
        withElement(),
        withText({ text: 'Hello World', componentName: 'button' })
      )(baseComponent);
      
      expect(component.text).toBeDefined();
      expect(typeof component.text.setText).toBe('function');
      expect(typeof component.text.getText).toBe('function');
      expect(typeof component.text.getElement).toBe('function');
    });

    test('withIcon should add icon management', () => {
      const baseComponent = createBase({ componentName: 'button' });
      const component = pipe(
        withElement({ tag: 'button' }),
        withIcon({ icon: '<svg></svg>', componentName: 'button' })
      )(baseComponent);
      
      expect(component.icon).toBeDefined();
      expect(typeof component.icon.setIcon).toBe('function');
      expect(typeof component.icon.getIcon).toBe('function');
      expect(typeof component.icon.getElement).toBe('function');
    });

    test('withVariant should add variant class', () => {
      const baseComponent = createBase({});
      const component = pipe(
        withElement({ tag: 'button' }),
        withVariant({ variant: 'primary', prefix: 'mtrl', componentName: 'button' })
      )(baseComponent);
      
      expect(component.element.classList.contains('mtrl-button--primary')).toBe(true);
    });

    test('withSize should add size class', () => {
      const baseComponent = createBase({});
      const component = pipe(
        withElement({ tag: 'button' }),
        withSize({ size: 'large', prefix: 'mtrl', componentName: 'button' })
      )(baseComponent);
      
      expect(component.element.classList.contains('mtrl-button--large')).toBe(true);
    });

    test('withPosition should add position management', () => {
      const baseComponent = createBase({});
      const component = pipe(
        withElement({ tag: 'div' }),
        withPosition({ position: 'top', prefix: 'mtrl', componentName: 'tooltip' })
      )(baseComponent);
      
      expect(component.position).toBeDefined();
      expect(typeof component.position.setPosition).toBe('function');
      expect(typeof component.position.getPosition).toBe('function');
      expect(component.element.classList.contains('mtrl-tooltip--top')).toBe(true);
      
      // Test changing position
      component.position.setPosition('bottom');
      expect(component.element.classList.contains('mtrl-tooltip--bottom')).toBe(true);
      expect(component.element.classList.contains('mtrl-tooltip--top')).toBe(false);
    });

    test('withDisabled should add disabled state management', () => {
      const baseComponent = createBase({});
      const component = pipe(
        withElement({ tag: 'button' }),
        withDisabled({ disabled: false, componentName: 'button' })
      )(baseComponent);
      
      expect(component.disabled).toBeDefined();
      expect(typeof component.disabled.enable).toBe('function');
      expect(typeof component.disabled.disable).toBe('function');
      expect(typeof component.disabled.toggle).toBe('function');
      expect(typeof component.disabled.isDisabled).toBe('function');
      
      expect(component.disabled.isDisabled()).toBe(false);
      
      // Test disabling
      component.disabled.disable();
      expect(component.disabled.isDisabled()).toBe(true);
      expect(component.element.classList.contains('mtrl-button--disabled')).toBe(true);
      expect(component.element.hasAttribute('disabled')).toBe(true);
      
      // Test enabling
      component.disabled.enable();
      expect(component.disabled.isDisabled()).toBe(false);
      expect(component.element.classList.contains('mtrl-button--disabled')).toBe(false);
      expect(component.element.hasAttribute('disabled')).toBe(false);
      
      // Test toggling
      component.disabled.toggle();
      expect(component.disabled.isDisabled()).toBe(true);
      component.disabled.toggle();
      expect(component.disabled.isDisabled()).toBe(false);
    });

    test('withLifecycle should add lifecycle management', () => {
      const baseComponent = createBase({});
      const component = pipe(
        withElement({ tag: 'div' }),
        withLifecycle()
      )(baseComponent);
      
      expect(component.lifecycle).toBeDefined();
      expect(typeof component.lifecycle.onMount).toBe('function');
      expect(typeof component.lifecycle.onUnmount).toBe('function');
      expect(typeof component.lifecycle.mount).toBe('function');
      expect(typeof component.lifecycle.unmount).toBe('function');
      expect(typeof component.lifecycle.isMounted).toBe('function');
      expect(typeof component.lifecycle.destroy).toBe('function');
      
      expect(component.lifecycle.isMounted()).toBe(false);
      
      // Test mount
      const mountSpy = mock(() => {});
      component.lifecycle.onMount(mountSpy);
      component.lifecycle.mount();
      expect(mountSpy).toHaveBeenCalled();
      expect(component.lifecycle.isMounted()).toBe(true);
      
      // Test unmount
      const unmountSpy = mock(() => {});
      component.lifecycle.onUnmount(unmountSpy);
      component.lifecycle.unmount();
      expect(unmountSpy).toHaveBeenCalled();
      expect(component.lifecycle.isMounted()).toBe(false);
      
      // Test destroy
      const parent = document.createElement('div');
      parent.appendChild(component.element);
      expect(parent.childNodes.length).toBe(1);
      component.lifecycle.destroy();
      expect(parent.childNodes.length).toBe(0);
    });
  });

  describe('Input Features', () => {
    test('withInput should add input functionality', () => {
      const baseComponent = createBase({ componentName: 'checkbox' });
      const component = pipe(
        withElement({ tag: 'div' }),
        withEvents(),
        withInput({ name: 'test', value: 'test-value', checked: true })
      )(baseComponent);
      
      expect(component.input).toBeInstanceOf(HTMLInputElement);
      expect(component.input.type).toBe('checkbox');
      expect(component.input.name).toBe('test');
      expect(component.input.value).toBe('test-value');
      expect(component.input.checked).toBe(true);
      
      expect(typeof component.getValue).toBe('function');
      expect(typeof component.setValue).toBe('function');
      
      expect(component.getValue()).toBe('test-value');
      
      // Test setValue
      const emitSpy = spyOn(component, 'emit');
      component.setValue('new-value');
      expect(component.input.value).toBe('new-value');
      expect(emitSpy).toHaveBeenCalledWith('value', { value: 'new-value' });
    });

    test('withCheckable should add checkable state management', () => {
      const baseComponent = createBase({ componentName: 'switch' });
      const component = pipe(
        withElement({ tag: 'div' }),
        withEvents(),
        withInput({ name: 'test' }),
        withCheckable({ checked: false })
      )(baseComponent);
      
      expect(component.checkable).toBeDefined();
      expect(typeof component.checkable.check).toBe('function');
      expect(typeof component.checkable.uncheck).toBe('function');
      expect(typeof component.checkable.toggle).toBe('function');
      expect(typeof component.checkable.isChecked).toBe('function');
      
      expect(component.checkable.isChecked()).toBe(false);
      
      // Test checking
      const emitSpy = spyOn(component, 'emit');
      component.checkable.check();
      expect(component.checkable.isChecked()).toBe(true);
      expect(component.input.checked).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith('change', { checked: true, value: 'on' });
      
      // Test unchecking
      component.checkable.uncheck();
      expect(component.checkable.isChecked()).toBe(false);
      expect(component.input.checked).toBe(false);
      
      // Test toggling
      component.checkable.toggle();
      expect(component.checkable.isChecked()).toBe(true);
      component.checkable.toggle();
      expect(component.checkable.isChecked()).toBe(false);
    });
  });

  describe('Complex Component Composition', () => {
    test('should create a complete button component', () => {
      const config = {
        componentName: 'button',
        prefix: 'mtrl',
        variant: 'filled',
        size: 'large',
        text: 'Click Me',
        icon: '<svg></svg>',
        disabled: false
      };
      
      const button = pipe(
        createBase,
        withElement({ tag: 'button' }),
        withEvents(),
        withText(config),
        withIcon(config),
        withVariant(config),
        withSize(config),
        withDisabled(config),
        withLifecycle()
      )(config);
      
      expect(button.element.tagName).toBe('BUTTON');
      expect(button.element.classList.contains('mtrl-button')).toBe(true);
      expect(button.element.classList.contains('mtrl-button--filled')).toBe(true);
      expect(button.element.classList.contains('mtrl-button--large')).toBe(true);
      
      expect(button.text).toBeDefined();
      expect(button.icon).toBeDefined();
      expect(button.disabled).toBeDefined();
      expect(button.lifecycle).toBeDefined();
      
      // Test event emission
      const clickSpy = mock(() => {});
      button.on('click', clickSpy);
      button.emit('click', { target: button.element });
      expect(clickSpy).toHaveBeenCalled();
      
      // Ensure lifecycle and component cleanup works
      const parent = document.createElement('div');
      parent.appendChild(button.element);
      button.lifecycle.destroy();
      expect(parent.childNodes.length).toBe(0);
    });

    test('should create a checkbox component', () => {
      const config = {
        componentName: 'checkbox',
        prefix: 'mtrl',
        label: 'Accept terms',
        checked: true,
        disabled: false
      };
      
      const checkbox = pipe(
        createBase,
        withElement({ tag: 'div' }),
        withEvents(),
        withInput(config),
        withCheckable(config),
        withDisabled(config),
        withLifecycle()
      )(config);
      
      expect(checkbox.element.tagName).toBe('DIV');
      expect(checkbox.element.classList.contains('mtrl-checkbox')).toBe(true);
      
      expect(checkbox.input).toBeInstanceOf(HTMLInputElement);
      expect(checkbox.input.type).toBe('checkbox');
      expect(checkbox.input.checked).toBe(true);
      
      expect(checkbox.checkable).toBeDefined();
      expect(checkbox.disabled).toBeDefined();
      expect(checkbox.lifecycle).toBeDefined();
      
      // Test change event
      const changeSpy = mock(() => {});
      checkbox.on('change', changeSpy);
      
      // Trigger change through the checkable API
      checkbox.checkable.toggle();
      expect(changeSpy).toHaveBeenCalled();
      expect(checkbox.input.checked).toBe(false);
      
      checkbox.checkable.check();
      expect(checkbox.input.checked).toBe(true);
      
      // Test disabling
      checkbox.disabled.disable();
      expect(checkbox.input.disabled).toBe(true);
      expect(checkbox.element.classList.contains('mtrl-checkbox--disabled')).toBe(true);
    });
  });

  describe('Feature Integration', () => {
    test('withLifecycle should integrate with other features', () => {
      // Event system with lifecycle integration
      const component = pipe(
        createBase,
        withElement({ tag: 'div' }),
        withEvents(),
        withLifecycle()
      )({ componentName: 'test' });
      
      // Create spy to monitor cleanup
      const destroySpy = spyOn(component.events, 'destroy');
      
      // Add event listener
      const handler = mock(() => {});
      component.on('test', handler);
      
      // Destroy should clean up events
      component.lifecycle.destroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    test('withStyle should apply multiple style classes', () => {
      const component = pipe(
        createBase,
        withElement({ tag: 'button' }),
        withStyle({ variant: 'outlined', size: 'large' })
      )({ componentName: 'button' });
      
      expect(component.element.classList.contains('mtrl-button--outlined')).toBe(true);
      expect(component.element.classList.contains('mtrl-button--large')).toBe(true);
    });
  });
});