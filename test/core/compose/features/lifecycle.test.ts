// test/core/compose/features/lifecycle.test.ts
//
// This suite used to replace src/core/state/emitter with a hand-rolled stand-in
// through `mock.module`, then assert that the stand-in had been called. It was
// testing its own re-implementation (F6 / FLO-93), and `mock.module` is process
// wide: the fake emitter was installed for every test file loaded after this
// one in the same run, so a later suite's onUnmount handler could be dropped by
// an unrelated test clearing the shared instance.
//
// It now runs against the real emitter, and asserts what the lifecycle does
// rather than which functions it called on the way.

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { withLifecycle } from '../../../../src/core/compose/features/lifecycle';
import '../../../setup'; // Import the jsdom setup

describe('withLifecycle', () => {
  let component;
  let element;
  let textElement;
  let iconElement;

  beforeEach(() => {
    document.body.innerHTML = '';

    // In the document, so removal is observable as a fact about the DOM
    // rather than as a call to a replaced method.
    element = document.createElement('div');
    textElement = document.createElement('span');
    iconElement = document.createElement('span');
    document.body.append(element, textElement, iconElement);

    component = {
      element,
      events: {
        destroy: mock(() => {})
      },
      text: {
        getElement: () => textElement
      },
      icon: {
        getElement: () => iconElement
      }
    };
  });

  test('should add lifecycle methods to component', () => {
    const enhanced = withLifecycle()(component);

    expect(enhanced.lifecycle).toBeDefined();
    expect(typeof enhanced.lifecycle.mount).toBe('function');
    expect(typeof enhanced.lifecycle.unmount).toBe('function');
    expect(typeof enhanced.lifecycle.isMounted).toBe('function');
    expect(typeof enhanced.lifecycle.destroy).toBe('function');
    expect(typeof enhanced.lifecycle.onMount).toBe('function');
    expect(typeof enhanced.lifecycle.onUnmount).toBe('function');
  });

  test('mount should fire onMount handler', () => {
    const enhanced = withLifecycle()(component);
    const mountHandler = mock(() => {});

    enhanced.lifecycle.onMount(mountHandler);
    enhanced.lifecycle.mount();

    expect(mountHandler).toHaveBeenCalled();
  });

  test('unmount should fire onUnmount handler', () => {
    const enhanced = withLifecycle()(component);
    const unmountHandler = mock(() => {});

    enhanced.lifecycle.onUnmount(unmountHandler);
    enhanced.lifecycle.mount();
    enhanced.lifecycle.unmount();

    expect(unmountHandler).toHaveBeenCalled();
  });

  // unmount clears every subscription. Stated as behaviour: a handler
  // registered before the unmount does not survive it.
  test('unmount should drop existing subscriptions', () => {
    const enhanced = withLifecycle()(component);
    const mountHandler = mock(() => {});

    enhanced.lifecycle.onMount(mountHandler);
    enhanced.lifecycle.mount();
    expect(mountHandler).toHaveBeenCalledTimes(1);

    enhanced.lifecycle.unmount();
    enhanced.lifecycle.mount();

    expect(mountHandler).toHaveBeenCalledTimes(1);
  });

  test('isMounted should return correct state', () => {
    const enhanced = withLifecycle()(component);

    expect(enhanced.lifecycle.isMounted()).toBe(false);

    enhanced.lifecycle.mount();
    expect(enhanced.lifecycle.isMounted()).toBe(true);

    enhanced.lifecycle.unmount();
    expect(enhanced.lifecycle.isMounted()).toBe(false);
  });

  test('destroy should clean up resources', () => {
    const enhanced = withLifecycle()(component);

    enhanced.lifecycle.mount();
    enhanced.lifecycle.destroy();

    expect(component.events.destroy).toHaveBeenCalled();
    expect(textElement.isConnected).toBe(false);
    expect(iconElement.isConnected).toBe(false);
    expect(element.isConnected).toBe(false);
  });

  test('destroy should call unmount if mounted', () => {
    const enhanced = withLifecycle()(component);
    const unmountHandler = mock(() => {});

    enhanced.lifecycle.onUnmount(unmountHandler);
    enhanced.lifecycle.mount();
    enhanced.lifecycle.destroy();

    expect(unmountHandler).toHaveBeenCalled();
    expect(enhanced.lifecycle.isMounted()).toBe(false);
  });

  test('multiple mount calls should only trigger once', () => {
    const enhanced = withLifecycle()(component);
    const mountHandler = mock(() => {});

    enhanced.lifecycle.onMount(mountHandler);
    enhanced.lifecycle.mount();
    enhanced.lifecycle.mount();
    enhanced.lifecycle.mount();

    expect(mountHandler).toHaveBeenCalledTimes(1);
  });

  test('unmount should not trigger if not mounted', () => {
    const enhanced = withLifecycle()(component);
    const unmountHandler = mock(() => {});

    enhanced.lifecycle.onUnmount(unmountHandler);
    enhanced.lifecycle.unmount();

    expect(unmountHandler).not.toHaveBeenCalled();
  });

  test('onMount return value should unsubscribe handler', () => {
    const enhanced = withLifecycle()(component);
    const mountHandler = mock(() => {});

    const unsubscribe = enhanced.lifecycle.onMount(mountHandler);
    unsubscribe();

    enhanced.lifecycle.mount();

    expect(mountHandler).not.toHaveBeenCalled();
  });
});
