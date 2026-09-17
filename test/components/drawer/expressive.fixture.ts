import { beforeEach, afterEach, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import createDrawer from '../../../src/components/drawer';
let dom: JSDOM;
let drawers: ReturnType<typeof createDrawer>[];
beforeEach(() => {
  dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent']) Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: name === 'window' ? dom.window : Reflect.get(dom.window, name) });
  globalThis.requestAnimationFrame = fn => { fn(0); return 0; };
  globalThis.cancelAnimationFrame = () => {};
  drawers = [];
});
afterEach(() => { drawers.forEach(d => d.destroy()); dom.window.close(); });
const items = [{ id: 'home', label: 'Home', active: true }, { id: 'mail', label: 'Mail' }, { id: 'off', label: 'Off', disabled: true }];
const make = (config: Parameters<typeof createDrawer>[0] = {}) => {
  const drawer = createDrawer({ open: true, items, ...config });
  document.body.append(drawer.element); drawers.push(drawer); return drawer;
};
const buttons = (d: ReturnType<typeof createDrawer>) => [...d.element.querySelectorAll<HTMLButtonElement>('.mtrl-drawer__item')];
test('every destination carries an indicator that only the active item shows', () => {
  const d = make();
  const all = buttons(d);
  expect(all.every(b => b.querySelector('.mtrl-drawer__active-indicator'))).toBe(true);
  expect(all.map(b => b.classList.contains('mtrl-drawer__item--active'))).toEqual([true, false, false]);
  all[1].click();
  expect(all.map(b => b.classList.contains('mtrl-drawer__item--active'))).toEqual([false, true, false]);
  expect(d.getActive()).toBe('mail');
});
test('enabled items ripple on press, disabled items do not', () => {
  const d = make();
  const [home, mail, off] = buttons(d);
  expect(home.querySelector('.mtrl-ripple')).not.toBeNull();
  expect(mail.querySelector('.mtrl-ripple')).not.toBeNull();
  expect(off.querySelector('.mtrl-ripple')).toBeNull();
  mail.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));
  expect(mail.querySelector('.mtrl-ripple .mtrl-ripple-wave')).not.toBeNull();
  document.dispatchEvent(new MouseEvent('mouseup'));
});
test('ripple can be turned off', () => {
  const d = make({ ripple: false });
  expect(d.element.querySelector('.mtrl-ripple')).toBeNull();
});
test('re-rendering and destroying release the ripples', () => {
  const d = make();
  const [home] = buttons(d);
  d.setItems([{ id: 'a', label: 'A' }]);
  expect((home as HTMLElement & { __rippleContainer?: unknown }).__rippleContainer).toBeUndefined();
  const [a] = buttons(d);
  expect(a.querySelector('.mtrl-ripple')).not.toBeNull();
  d.destroy(); drawers.pop();
  expect((a as HTMLElement & { __rippleContainer?: unknown }).__rippleContainer).toBeUndefined();
  expect(a.querySelector('.mtrl-ripple')).toBeNull();
});
