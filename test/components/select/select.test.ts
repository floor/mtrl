// test/components/select/select.test.ts
//
// The real select in a JSDOM document: choosing through its menu, and menu
// items whose data is not a select option.
import { describe, test, expect, beforeEach } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import createSelect from '../../../src/components/select';

const after = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const options = [
  { id: 'apple', text: 'Apple' },
  { id: 'banana', text: 'Banana' },
];

const menuItems = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('.mtrl-menu__item'));

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('select', () => {
  test('choosing an option through the menu selects it and emits change with the option', async () => {
    const select = createSelect({ label: 'Fruit', options });
    document.body.appendChild(select.element);
    const chosen: unknown[] = [];
    select.on('change', (event) => chosen.push(event.option));

    select.open();
    await after(200);
    menuItems(document.body)[1]!.click();

    expect(select.getValue()).toBe('banana');
    expect(chosen).toHaveLength(1);
    expect(chosen[0]).toBe(options[1]);
    select.destroy();
  });

  test('menu items with string data warn once on selection instead of throwing', async () => {
    const warnings: unknown[][] = [];
    const errors: unknown[] = [];
    const warn = console.warn;
    console.warn = (...args: unknown[]) => { warnings.push(args); };
    const onError = (event: ErrorEvent) => { errors.push(event.error); };
    dom.window.addEventListener('error', onError);
    try {
      // the caller's own items replace the select's, so the data is theirs
      const menu = { maxHeight: '200px', items: [{ id: 'apple', text: 'Apple', data: 'apple' }] };
      const select = createSelect({ label: 'Fruit', options, menu });
      document.body.appendChild(select.element);

      select.open();
      await after(200);
      menuItems(document.body)[0]!.click();

      expect(errors).toEqual([]);
      expect(warnings.filter((args) => String(args[0]).includes('Invalid menu selection'))).toHaveLength(1);
      expect(select.getValue()).toBeNull();
      select.destroy();
    } finally {
      console.warn = warn;
      dom.window.removeEventListener('error', onError);
    }
  });
});
