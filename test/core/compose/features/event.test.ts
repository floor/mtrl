// test/core/compose/features/events.test.ts
//
// This suite used to replace src/core/state/emitter with a stand-in through
// `mock.module` and assert that each method forwarded to it. Two problems, both
// F6 / FLO-93: nothing here exercised the real emitter, so "on forwards to on"
// held whether or not subscription actually worked; and `mock.module` is
// process wide, so the stand-in was installed for every test file loaded after
// this one. Its fake `on` returned the emitter rather than an unsubscribe
// function, which broke unrelated suites that had no idea it existed.
//
// It now runs against the real emitter and asserts that handlers fire, stop
// firing, and are cleaned up.

import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { withEvents } from '../../../../src/core/compose/features/events';
import '../../../setup'; // Import the jsdom setup

describe('withEvents', () => {
  let component;

  beforeEach(() => {
    document.body.innerHTML = '';
    component = {
      element: document.createElement('div'),
      getClass: (name) => `mtrl-${name}`
    };
  });

  test('should add events methods to component', () => {
    const enhanced = withEvents()(component);

    expect(typeof enhanced.on).toBe('function');
    expect(typeof enhanced.off).toBe('function');
    expect(typeof enhanced.emit).toBe('function');
  });

  test('a subscribed handler receives the event', () => {
    const enhanced = withEvents()(component);
    const handler = mock(() => {});

    enhanced.on('click', handler);
    enhanced.emit('click');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('emit passes its data to the handler', () => {
    const enhanced = withEvents()(component);
    const handler = mock(() => {});
    const data = { value: 'test' };

    enhanced.on('change', handler);
    enhanced.emit('change', data);

    expect(handler).toHaveBeenCalledWith(data);
  });

  test('emit without data passes undefined', () => {
    const enhanced = withEvents()(component);
    const handler = mock(() => {});

    enhanced.on('focus', handler);
    enhanced.emit('focus');

    expect(handler).toHaveBeenCalledWith(undefined);
  });

  test('off stops the handler receiving the event', () => {
    const enhanced = withEvents()(component);
    const handler = mock(() => {});

    enhanced.on('click', handler);
    enhanced.off('click', handler);
    enhanced.emit('click');

    expect(handler).not.toHaveBeenCalled();
  });

  test('a handler only receives its own event', () => {
    const enhanced = withEvents()(component);
    const click = mock(() => {});
    const change = mock(() => {});

    enhanced.on('click', click);
    enhanced.on('change', change);
    enhanced.emit('click');

    expect(click).toHaveBeenCalledTimes(1);
    expect(change).not.toHaveBeenCalled();
  });

  test('several handlers on one event all receive it', () => {
    const enhanced = withEvents()(component);
    const first = mock(() => {});
    const second = mock(() => {});

    enhanced.on('click', first);
    enhanced.on('click', second);
    enhanced.emit('click');

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('on, off and emit return the component for chaining', () => {
    const enhanced = withEvents()(component);
    const handler = () => {};

    expect(enhanced.on('click', handler)).toBe(enhanced);
    expect(enhanced.off('click', handler)).toBe(enhanced);
    expect(enhanced.emit('change')).toBe(enhanced);
  });

  // getCleanup wraps an existing lifecycle.destroy so the emitter is cleared
  // with the component. The original destroy must still run.
  test('destroying through the lifecycle clears the subscriptions', () => {
    const originalDestroy = mock(() => {});
    component.lifecycle = { destroy: originalDestroy };

    const enhanced = withEvents()(component);
    const handler = mock(() => {});
    enhanced.on('click', handler);

    enhanced.lifecycle.destroy();

    expect(originalDestroy).toHaveBeenCalledTimes(1);

    enhanced.emit('click');
    expect(handler).not.toHaveBeenCalled();
  });

  // `on` checks the cleanup scope before subscribing, so a handler added after
  // destruction never fires and never keeps the component alive.
  test('subscribing after destruction does nothing', () => {
    component.lifecycle = { destroy: mock(() => {}) };

    const enhanced = withEvents()(component);
    enhanced.lifecycle.destroy();

    const handler = mock(() => {});
    enhanced.on('click', handler);
    enhanced.emit('click');

    expect(handler).not.toHaveBeenCalled();
  });
});
