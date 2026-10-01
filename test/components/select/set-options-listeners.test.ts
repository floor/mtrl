// test/components/select/set-options-listeners.test.ts
//
// setOptions replaces the menu's items. Each enabled item had registered
// click, keydown and focus, and those registrations were never removed, so
// every call added another set (FLO-408).
import { describe, test, expect, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.FocusEvent = dom.window.FocusEvent;
g.EventTarget = dom.window.EventTarget;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import createSelect from '../../../src/components/select';

const proto = dom.window.EventTarget.prototype;
const add = proto.addEventListener;
const remove = proto.removeEventListener;
let live = 0;
proto.addEventListener = function (
  this: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
) {
  live += 1;
  return add.call(this, type, listener, options);
};
proto.removeEventListener = function (
  this: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions,
) {
  live -= 1;
  return remove.call(this, type, listener, options);
};

afterAll(() => {
  proto.addEventListener = add;
  proto.removeEventListener = remove;
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const list = (n: number) => [
  { id: 's', text: `Small ${n}` },
  { id: 'm', text: `Medium ${n}` },
  { id: 'l', text: `Large ${n}` },
];

describe('select setOptions', () => {
  test('replacing the options does not accumulate listeners', async () => {
    const select = createSelect({ label: 'Size', variant: 'outlined', value: 'm', options: list(0) });
    document.body.append(select.element);
    await wait(20);
    select.open();
    await wait(50);
    const input = select.element.querySelector('input')!;
    input.focus();

    select.setOptions(list(1));
    const afterFirst = live;
    for (let n = 2; n <= 10; n++) select.setOptions(list(n));

    expect(live).toBe(afterFirst);
    expect(select.getValue()).toBe('m');
    expect(select.isOpen()).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(select.element.textContent).toContain('Medium 10');
    select.destroy();
  });
});
