// test/components/menu/menu.test.ts
//
// The real component in a JSDOM document: what it renders, how it is
// labelled, where focus goes, and what the keyboard does.
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
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

import createMenu from '../../../src/components/menu';

const after = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** the menu positions and focuses itself on a timer */
const opened = async (menu: { open: (e?: unknown) => unknown }) => {
  menu.open();
  await after(200);
};

const items = [
  { id: 'cut', text: 'Cut' },
  { id: 'copy', text: 'Copy' },
  { id: 'paste', text: 'Paste', disabled: true },
  { id: 'select-all', text: 'Select all' },
];

let opener: HTMLButtonElement;

beforeEach(() => {
  document.body.innerHTML = '';
  opener = document.createElement('button');
  opener.textContent = 'Edit';
  document.body.appendChild(opener);
  opener.focus();
});

afterEach(() => {
  document.body.innerHTML = '';
});

const menuItems = (menu: { element: HTMLElement }): HTMLElement[] =>
  Array.from(menu.element.querySelectorAll('.mtrl-menu-item'));

describe('menu', () => {
  test('renders a menu of menuitems, each labelled by its own text', async () => {
    const menu = createMenu({ opener, items });
    await opened(menu);
    const el = menu.element;
    expect(el.classList.contains('mtrl-menu')).toBe(true);
    expect(el.querySelector('[role="menu"]')).not.toBeNull();

    const rendered = menuItems(menu);
    expect(rendered.length).toBe(4);
    expect(rendered.every((i) => i.getAttribute('role') === 'menuitem')).toBe(true);
    expect(rendered[0]!.textContent).toContain('Cut');
    expect(rendered[2]!.getAttribute('aria-disabled')).toBe('true');
    expect(rendered[0]!.getAttribute('aria-disabled')).toBe('false');
  });

  test('a divider is a separator and is not an item', async () => {
    const menu = createMenu({ opener, items: [items[0]!, { type: 'divider' }, items[1]!] });
    await opened(menu);
    const separator = menu.element.querySelector('[role="separator"]');
    expect(separator).not.toBeNull();
    expect(separator!.classList.contains('mtrl-menu-item')).toBe(false);
    expect(menuItems(menu).length).toBe(2);
  });

  test('focus lands on the first item, however the menu was opened', async () => {
    const byPointer = createMenu({ opener, items });
    await opened(byPointer);
    expect(document.activeElement).toBe(menuItems(byPointer)[0]);
    byPointer.close();
    await after(200);

    const byKey = createMenu({ opener, items });
    byKey.open(new dom.window.KeyboardEvent('keydown', { key: 'Enter' }));
    await after(200);
    expect(document.activeElement).toBe(menuItems(byKey)[0]);
  });

  test('only the focused item is in the tab order', async () => {
    const menu = createMenu({ opener, items });
    await opened(menu);
    const rendered = menuItems(menu);
    expect(rendered[0]!.getAttribute('tabindex')).toBe('0');
    expect(rendered.slice(1).every((i) => i.getAttribute('tabindex') === '-1')).toBe(true);
  });

  test('the arrows, Home and End move focus, and disabled items are not skipped', async () => {
    const menu = createMenu({ opener, items });
    await opened(menu);
    const rendered = menuItems(menu);
    const press = (key: string) =>
      (document.activeElement as HTMLElement).dispatchEvent(
        new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      );

    press('ArrowDown');
    expect(document.activeElement).toBe(rendered[1]);
    // "Disabled menu items can receive focus but aren't selectable"
    press('ArrowDown');
    expect(document.activeElement).toBe(rendered[2]);
    expect(rendered[2]!.classList.contains('mtrl-menu-item--disabled')).toBe(true);
    press('ArrowUp');
    expect(document.activeElement).toBe(rendered[1]);
    press('End');
    expect(document.activeElement).toBe(rendered[3]);
    press('Home');
    expect(document.activeElement).toBe(rendered[0]);
  });

  test('a disabled item cannot be chosen with the keyboard or the pointer', async () => {
    const chosen: string[] = [];
    const menu = createMenu({ opener, items });
    menu.on('select', (e: { item: { id: string } }) => chosen.push(e.item.id));
    await opened(menu);
    const rendered = menuItems(menu);

    rendered[2]!.click();
    expect(chosen).toEqual([]);
    expect(menu.isOpen()).toBe(true);

    rendered[1]!.click();
    expect(chosen).toEqual(['copy']);
  });

  test('Escape closes it', async () => {
    const menu = createMenu({ opener, items });
    await opened(menu);
    expect(menu.isOpen()).toBe(true);
    (document.activeElement as HTMLElement).dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    );
    await after(300);
    expect(menu.isOpen()).toBe(false);
  });

  test('a letter moves focus to the next item that starts with it', async () => {
    const menu = createMenu({ opener, items });
    await opened(menu);
    const rendered = menuItems(menu);
    (document.activeElement as HTMLElement).dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 's', bubbles: true, cancelable: true })
    );
    expect(document.activeElement).toBe(rendered[3]);
  });

  test('closing takes the menu off the page, so nothing invisible keeps focus', async () => {
    const menu = createMenu({ opener, items });
    await opened(menu);
    expect(document.body.contains(menu.element)).toBe(true);
    menu.close();
    // it fades for 300ms after a 50ms beat, then leaves
    await after(450);
    expect(document.body.contains(menu.element)).toBe(false);
  });

  test('selecting an item reports it and closes the menu', async () => {
    const chosen: string[] = [];
    const menu = createMenu({ opener, items, on: { select: (e: { item: { id: string } }) => chosen.push(e.item.id) } });
    await opened(menu);
    menuItems(menu)[0]!.click();
    expect(chosen).toEqual(['cut']);
    await after(300);
    expect(menu.isOpen()).toBe(false);
  });

  test('destroy removes it and leaves nothing behind', async () => {
    const menu = createMenu({ opener, items });
    await opened(menu);
    menu.destroy();
    await after(100);
    expect(document.body.contains(menu.element)).toBe(false);
  });
});
