import { beforeEach, afterEach, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import createDrawer from '../../../src/components/drawer';
let dom: JSDOM;
let drawers: ReturnType<typeof createDrawer>[];
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
const flush = () => { for (let i = 0; i < 2; i++) { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(0)); } };
beforeEach(() => {
  dom = new JSDOM('<!doctype html><body><main><button id="opener">Open</button></main></body>', { pretendToBeVisual: true });
  for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'KeyboardEvent']) Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: name === 'window' ? dom.window : Reflect.get(dom.window, name) });
  drawers = []; frames = new Map(); nextFrame = 0;
  globalThis.requestAnimationFrame = fn => { frames.set(++nextFrame, fn); return nextFrame; };
  globalThis.cancelAnimationFrame = id => { frames.delete(id); };
});
afterEach(() => { drawers.forEach(d => d.destroy()); dom.window.close(); });
const make = (config: Parameters<typeof createDrawer>[0] = {}) => {
  const drawer = createDrawer({ items: [{ id: 'home', label: 'Home', active: true }, { id: 'mail', label: 'Mail' }], ...config });
  document.body.append(drawer.element); drawers.push(drawer); return drawer;
};
test('destinations have navigation semantics and every enabled item is tabbable', () => {
  const d = make({ open: true });
  expect(d.element.querySelector('[role="tablist"], [role="tab"]')).toBeNull();
  const items = [...d.element.querySelectorAll<HTMLButtonElement>('button')];
  expect(items.every(item => item.type === 'button' && item.tabIndex === 0)).toBe(true);
  expect(items[0].getAttribute('aria-current')).toBe('page');
  d.setActive('mail');
  expect(items[0].hasAttribute('aria-current')).toBe(false);
  expect(items[1].getAttribute('aria-current')).toBe('page');
});
test('closed drawer is inert and hidden from assistive technology', () => {
  const d = make(); expect(d.element.hasAttribute('inert')).toBe(true);
  expect(d.element.getAttribute('aria-hidden')).toBe('true');
  d.open(); expect(d.element.hasAttribute('inert')).toBe(false);
  d.close(); expect(d.element.hasAttribute('inert')).toBe(true);
});
test('modal traps Tab, restores focus and preserves body overflow', () => {
  const opener = document.querySelector<HTMLElement>('#opener')!; opener.focus();
  document.body.style.setProperty('overflow', 'clip', 'important');
  const d = make({ variant: 'modal' }); d.open(); flush();
  expect(document.querySelector('main')!.hasAttribute('inert')).toBe(true);
  const items = d.element.querySelectorAll<HTMLButtonElement>('button');
  items[1].focus(); items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  expect(document.activeElement).toBe(items[0]);
  items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
  expect(document.activeElement).toBe(items[1]);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
  expect(d.isOpen()).toBe(false); expect(document.activeElement).toBe(opener);
  expect(document.body.style.overflow).toBe('clip'); expect(document.body.style.getPropertyPriority('overflow')).toBe('important');
  expect(document.querySelector('main')!.hasAttribute('inert')).toBe(false);
});
test('initial modal open and destroy own their focus work and scroll lock', () => {
  const d = make({ variant: 'modal', open: true }); flush();
  expect(document.body.style.overflow).toBe('hidden');
  d.close(); d.open(); expect(frames.size).toBeGreaterThan(0);
  d.destroy(); expect(frames.size).toBe(0); flush();
  expect(document.body.style.overflow).toBe(''); d.open(); expect(d.isOpen()).toBe(false);
});
test('standard open does not steal focus or lock the page', () => {
  const opener = document.querySelector<HTMLElement>('#opener')!; opener.focus();
  const d = make(); d.open(); flush(); expect(document.activeElement).toBe(opener);
  expect(document.body.style.overflow).toBe('');
});
test('headline can be added after creation and updates the accessible name', () => {
  const d = make(); d.setHeadline('Mail');
  expect(d.element.querySelector('.mtrl-drawer__headline')?.textContent).toBe('Mail');
  expect(d.element.getAttribute('aria-label')).toBe('Mail');
});
test('closing a stacked modal leaves the earlier modal active and page locked', () => {
  const a = make({ variant: 'modal' }); a.open(); flush();
  const b = make({ variant: 'modal' }); b.open(); flush();
  expect(a.element.hasAttribute('inert')).toBe(true);
  b.close(); expect(a.element.hasAttribute('inert')).toBe(false);
  expect(document.body.style.overflow).toBe('hidden');
  expect(a.element.contains(document.activeElement)).toBe(true);
  a.close(); expect(document.body.style.overflow).toBe('');
});
test('40 immediate open/destroy cycles release document listeners and queued frames', () => {
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const add = document.addEventListener.bind(document), remove = document.removeEventListener.bind(document);
  document.addEventListener = ((type: string, fn: EventListenerOrEventListenerObject, options?: AddEventListenerOptions) => { if (type === 'keydown' || type === 'focusin') listeners.add(fn); add(type, fn, options); }) as typeof document.addEventListener;
  document.removeEventListener = ((type: string, fn: EventListenerOrEventListenerObject, options?: EventListenerOptions) => { listeners.delete(fn); remove(type, fn, options); }) as typeof document.removeEventListener;
  for (let i = 0; i < 40; i++) {
    const d = make({ variant: 'modal' }); d.open(); d.destroy(); d.destroy();
    expect(listeners.size).toBe(0); expect(frames.size).toBe(0);
    expect(document.body.style.overflow).toBe('');
  }
});
test('unknown selection IDs preserve the active destination and special IDs work', () => {
  const d = make({ items: [{ id: 'a"b', label: 'Home', active: true }, { id: 'disabled', label: 'Unavailable', disabled: true }] });
  d.setActive('missing'); expect(d.getActive()).toBe('a"b');
  d.setActive('disabled'); expect(d.getActive()).toBe('a"b');
  d.setBadge('a"b', '2'); expect(d.element.querySelector('.mtrl-drawer__item-badge')?.textContent).toBe('2');
});
test('empty non-dismissible modal traps focus and preserves existing inert content', () => {
  const main = document.querySelector('main')!; main.setAttribute('inert', '');
  const d = make({ variant: 'modal', items: [], dismissible: false, prefix: 'custom' });
  d.open(); flush(); expect(document.activeElement).toBe(d.element);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
  expect(d.isOpen()).toBe(true); expect(document.activeElement).toBe(d.element);
  d.destroy(); expect(main.hasAttribute('inert')).toBe(true);
});
