import { afterEach, beforeEach, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import createButton from "../../../src/components/button";
import { createBase, withElement } from "../../../src/core/compose/component";
import { withLifecycle } from "../../../src/core/compose/features/lifecycle";
import { withRipple, createRipple } from "../../../src/core/compose/features/ripple";
import { createEventManager } from "../../../src/core/dom/events";
import { createEventManager as createStateEvents } from "../../../src/core/state/events";

let dom: JSDOM;
let restore: (() => void)[];
let frames: Map<number, FrameRequestCallback>;
let timers: Map<number, () => void>;
let listeners: Map<string, Set<EventListenerOrEventListenerObject>>;
beforeEach(() => {
  dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  restore = []; frames = new Map(); timers = new Map(); listeners = new Map(); let id = 0;
  const replace = (target: object, name: string, value: unknown) => {
    const previous = Object.getOwnPropertyDescriptor(target, name);
    Object.defineProperty(target, name, { value, writable: true, configurable: true });
    restore.push(() => { if (previous) Object.defineProperty(target, name, previous); else Reflect.deleteProperty(target, name); });
  };
  replace(globalThis, 'window', dom.window);
  for (const key of ['document', 'HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'CustomEvent', 'navigator']) replace(globalThis, key, Reflect.get(dom.window, key));
  for (const target of [globalThis, dom.window]) {
    replace(target, 'requestAnimationFrame', (fn: FrameRequestCallback) => { frames.set(++id, fn); return id; });
    replace(target, 'cancelAnimationFrame', (key: number) => frames.delete(key));
    replace(target, 'setTimeout', (fn: () => void) => { timers.set(++id, fn); return id; });
    replace(target, 'clearTimeout', (key: number) => timers.delete(key));
  }
  const add = document.addEventListener.bind(document), remove = document.removeEventListener.bind(document);
  replace(document, 'addEventListener', (type: string, fn: EventListener, options?: boolean | AddEventListenerOptions) => {
    if (['mouseup', 'mouseleave'].includes(type)) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type)!.add(fn); }
    add(type, fn, options);
  });
  replace(document, 'removeEventListener', (type: string, fn: EventListener, options?: boolean | EventListenerOptions) => { listeners.get(type)?.delete(fn); remove(type, fn, options); });
});
afterEach(() => { restore.reverse().forEach(fn => fn()); dom.window.close(); });
const press = (element: HTMLElement) => element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 5, clientY: 5 }));
const released = () => { for (const set of listeners.values()) expect(set.size).toBe(0); expect(frames.size).toBe(0); expect(timers.size).toBe(0); };

test('40 pressed button destroys release document listeners and delayed work', () => {
  for (let i = 0; i < 40; i++) {
    const button = createButton({ text: 'Save' }); document.body.append(button.element); press(button.element);
    if (i % 2) document.dispatchEvent(new MouseEvent('mouseup'));
    button.destroy(); button.destroy(); released();
    expect(button.element.querySelector('.mtrl-ripple')).toBeNull();
  }
});
test('destroy removes forwarded element events and clears subscribers', () => {
  const button = createButton({ text: 'Save' }); let calls = 0;
  button.on('click', () => calls++); button.destroy(); button.element.click(); expect(calls).toBe(0);
});
test('ripple cleanup works before and after lifecycle installation', () => {
  for (const before of [true, false]) {
    const element = withElement()(createBase());
    const component = before ? withLifecycle()(withRipple({ ripple: true })(element)) : withRipple({ ripple: true })(withLifecycle()(element));
    press(component.element); component.lifecycle.destroy(); released();
  }
});
test('one controller isolates mounted elements and ignores repeated mounts', () => {
  const ripple = createRipple(); const a = document.createElement('div'), b = document.createElement('div');
  ripple.mount(a); ripple.mount(a); ripple.mount(b); press(a); press(b);
  expect(a.querySelectorAll('.mtrl-ripple-wave').length).toBe(1);
  ripple.unmount(a); expect(listeners.get('mouseup')!.size).toBe(1);
  ripple.unmount(b); released();
});
test('DOM events distinguish identical closures and remove capture listeners', () => {
  const element = document.createElement('div'), events = createEventManager(element); let calls = 0;
  const make = () => () => { calls++; };
  events.on('click', make()); events.on('click', make()); events.on('click', make(), { capture: true });
  events.destroy(); element.click(); expect(calls).toBe(0);
});
test('DOM events deduplicate by identity, type and capture', () => {
  const element = document.createElement('div'), events = createEventManager(element); let calls = 0; const handler = () => calls++;
  events.on('click', handler); events.on('click', handler); events.on('click', handler, { capture: true });
  element.click(); expect(calls).toBe(2); events.off('click', handler); element.click(); expect(calls).toBe(2);
});
test('state events remove every event registered with a shared callback', () => {
  const element = document.createElement('div'), events = createStateEvents(element); let calls = 0; const handler = () => calls++;
  events.on('focus', handler); events.on('blur', handler); events.destroy(); element.dispatchEvent(new Event('focus')); element.dispatchEvent(new Event('blur')); expect(calls).toBe(0);
});

test('delayed event features cancel trailing work before and after lifecycle', async () => {
  const { withDebounce } = await import('../../../src/core/compose/features/debounce');
  const { withThrottle } = await import('../../../src/core/compose/features/throttle');
  for (const before of [true, false]) {
    let calls = 0;
    const element = withElement()(createBase());
    const base = before ? element : withLifecycle()(element);
    const delayed = withDebounce({ debouncedEvents: { input: { wait: 100, handler: () => calls++ } } })(base);
    const throttled = withThrottle({ throttledEvents: { change: { wait: 100, handler: () => calls++, options: { leading: false } } } })(delayed);
    const component = withLifecycle()(throttled);
    component.element.dispatchEvent(new Event('input')); component.element.dispatchEvent(new Event('change'));
    expect(timers.size).toBe(2); component.lifecycle.destroy(); released(); expect(calls).toBe(0);
  }
});
test('removing delayed handlers cancels their timers', async () => {
  const { withDebounce } = await import('../../../src/core/compose/features/debounce');
  const component = withDebounce({})(withElement()(createBase()));
  component.addDebouncedEvent('input', () => {}, 100);
  component.element.dispatchEvent(new Event('input')); expect(timers.size).toBe(1);
  component.removeDebouncedEvent('input'); released(); component.destroy();
});
test('cleanup is idempotent and drains remaining resources after a failure', async () => {
  const { createCleanup } = await import('../../../src/core/compose/cleanup');
  const scope = createCleanup(); let calls = 0;
  scope.add(() => { throw new Error('expected'); }); scope.add(() => { calls++; scope.destroy(); });
  expect(() => scope.destroy()).toThrow('expected'); expect(calls).toBe(1);
  scope.destroy(); scope.add(() => calls++); expect(calls).toBe(2);
});

test('component subscribers are cleared even if the component never mounted', async () => {
  const { withEvents } = await import('../../../src/core/compose/features/events');
  const component = withLifecycle()(withElement()(withEvents()(createBase()))); let calls = 0;
  component.on('custom', () => calls++); component.lifecycle.destroy(); component.emit('custom');
  component.on('custom', () => calls++); component.emit('custom'); expect(calls).toBe(0);
});
test('disabled buttons are disabled immediately without a pending frame', () => {
  const button = createButton({ text: 'Save', disabled: true });
  expect(button.element.hasAttribute('disabled')).toBe(true); expect(frames.size).toBe(0);
  button.destroy(); released();
});
test('enhanced events are cleaned up when installed before lifecycle', async () => {
  const { withEvents } = await import('../../../src/core/compose/features/withEvents');
  const component = withLifecycle()(withEvents()(withElement()(createBase()))); let calls = 0;
  component.events.on('click', () => calls++); component.lifecycle.destroy(); component.element.click(); expect(calls).toBe(0);
});

test('gesture handlers still emit taps and stop after destroy', async () => {
  const { withEvents } = await import('../../../src/core/compose/features/events');
  const component = withLifecycle()(withElement({ interactive: true })(withEvents()(createBase()))); let taps = 0;
  component.on('tap', () => taps++);
  component.element.dispatchEvent(new Event('touchstart')); component.element.dispatchEvent(new Event('touchend'));
  expect(taps).toBe(1); component.lifecycle.destroy();
  component.element.dispatchEvent(new Event('touchstart')); component.element.dispatchEvent(new Event('touchend'));
  expect(taps).toBe(1); expect(component.touchState.activeTarget).toBeNull();
});
test('maxWait rescheduling leaves no orphaned debounce timer', async () => {
  const { debounce } = await import('../../../src/core/utils/performance');
  const now = Date.now; let time = 100;
  Date.now = () => time;
  try {
    const run = debounce(() => {}, 100, { maxWait: 200 }); run();
    time = 250; run(); expect(timers.size).toBe(1); run.cancel(); released();
  } finally { Date.now = now; }
});
test('ripple integrates with a custom lifecycle without a resource scope', () => {
  const base = { ...createBase(), element: document.createElement('div'), destroy() {}, lifecycle: { destroy() {} } };
  const component = withRipple({ ripple: true })(base); press(component.element);
  component.lifecycle.destroy(); released();
});
