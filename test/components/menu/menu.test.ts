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

  test('a menu opened with a key focuses its first item', async () => {
    const menu = createMenu({ opener, items });
    menu.open(new dom.window.KeyboardEvent('keydown', { key: 'Enter' }));
    await after(200);
    expect(document.activeElement).toBe(menuItems(menu)[0]);
  });

  test('a menu opened with a pointer takes focus itself, and the first arrow reaches the first item', async () => {
    const menu = createMenu({ opener, items });
    await opened(menu);
    // focus is inside the menu, so Escape works and it is announced, but no
    // item is marked
    expect(document.activeElement).toBe(menu.element);
    expect(document.activeElement).not.toBe(menuItems(menu)[0]);

    menu.element.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    );
    // the first press lands on the first item rather than stepping past it
    expect(document.activeElement).toBe(menuItems(menu)[0]);
  });

  test('the first item is the way into the menu for the Tab order', async () => {
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
    rendered[0]!.focus();
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
    menu.element.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    );
    await after(300);
    expect(menu.isOpen()).toBe(false);
  });

  test('a letter moves focus to the next item that starts with it', async () => {
    const menu = createMenu({ opener, items });
    await opened(menu);
    const rendered = menuItems(menu);
    rendered[0]!.focus();
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

describe('the expressive vertical menu', () => {
  test('is opt-in: a plain menu is still the baseline one', async () => {
    const menu = createMenu({ opener, items });
    await opened(menu);
    expect(menu.element.classList.contains('mtrl-menu--vertical')).toBe(false);
    expect(menu.element.classList.contains('mtrl-menu--vibrant')).toBe(false);
  });

  test('the vertical variant carries its own class, and vibrant its own', async () => {
    const standard = createMenu({ opener, items, variant: 'vertical' });
    await opened(standard);
    expect(standard.element.classList.contains('mtrl-menu--vertical')).toBe(true);
    expect(standard.element.classList.contains('mtrl-menu--vibrant')).toBe(false);
    standard.close();
    await after(450);

    const vibrant = createMenu({ opener, items, variant: 'vertical', color: 'vibrant' });
    await opened(vibrant);
    expect(vibrant.element.classList.contains('mtrl-menu--vertical')).toBe(true);
    expect(vibrant.element.classList.contains('mtrl-menu--vibrant')).toBe(true);
    // vibrant only means anything on the vertical variant
    const baseline = createMenu({ opener, items, color: 'vibrant' });
    await opened(baseline);
    expect(baseline.element.classList.contains('mtrl-menu--vibrant')).toBe(false);
  });

  test('an item can carry a line of supporting text under its label', async () => {
    const menu = createMenu({
      opener,
      variant: 'vertical',
      items: [
        { id: 'share', text: 'Share', supportingText: 'Anyone with the link' },
        { id: 'copy', text: 'Copy' },
      ],
    });
    await opened(menu);
    const [withText, without] = menuItems(menu) as [HTMLElement, HTMLElement];
    const label = withText.querySelector('.mtrl-menu-item-label');
    expect(label).not.toBeNull();
    expect(label!.querySelector('.mtrl-menu-item-text')!.textContent).toBe('Share');
    expect(label!.querySelector('.mtrl-menu-item-supporting')!.textContent).toBe('Anyone with the link');
    // an item without it keeps the simpler markup
    expect(without.querySelector('.mtrl-menu-item-label')).toBeNull();
    expect(without.querySelector('.mtrl-menu-item-text')!.textContent).toBe('Copy');
  });

  test('a submenu takes its parent\'s variant, and the pair shows which is active', async () => {
    const menu = createMenu({
      opener,
      variant: 'vertical',
      color: 'vibrant',
      items: [
        { id: 'share', text: 'Share', hasSubmenu: true, submenu: [{ id: 'link', text: 'Copy link' }] },
        { id: 'copy', text: 'Copy' },
      ],
    });
    await opened(menu);
    const parent = menu.element;
    expect(parent.classList.contains('mtrl-menu--active')).toBe(false);
    expect(parent.classList.contains('mtrl-menu--inactive')).toBe(false);

    menuItems(menu)[0]!.click();
    await after(400);
    const submenu = document.querySelector('.mtrl-menu--submenu');
    expect(submenu).not.toBeNull();
    // the submenu looks like its parent
    expect(submenu!.classList.contains('mtrl-menu--vertical')).toBe(true);
    expect(submenu!.classList.contains('mtrl-menu--vibrant')).toBe(true);
    // and the shape says which one is live
    expect(submenu!.classList.contains('mtrl-menu--active')).toBe(true);
    expect(parent.classList.contains('mtrl-menu--inactive')).toBe(true);
    expect(parent.classList.contains('mtrl-menu--active')).toBe(false);
  });
});

describe('submenu keyboard navigation', () => {
  const nested = [
    { id: 'exec', text: 'Executive' },
    {
      id: 'eng',
      text: 'Engineering',
      hasSubmenu: true,
      submenu: [
        { id: 'sw', text: 'Software', hasSubmenu: true, submenu: [{ id: 'fe', text: 'Frontend' }, { id: 'be', text: 'Backend' }] },
        { id: 'infra', text: 'Infrastructure' },
        { id: 'qa', text: 'Quality Assurance' },
      ],
    },
    { id: 'mkt', text: 'Marketing' },
  ];

  const press = (key: string) =>
    (document.activeElement as HTMLElement).dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    );
  const focusedText = () => (document.activeElement as HTMLElement)?.textContent?.trim();
  const openSubmenus = () => document.querySelectorAll('.mtrl-menu--submenu').length;

  test('the right arrow enters a submenu and the arrows then stay inside it', async () => {
    const menu = createMenu({ opener, items: nested });
    await opened(menu);
    const rootItems = menuItems(menu);
    rootItems[1]!.focus();

    press('ArrowRight');
    await after(400);
    expect(openSubmenus()).toBe(1);
    expect(focusedText()).toBe('Software');

    // this used to jump back to the main menu's first item
    press('ArrowDown');
    expect(focusedText()).toBe('Infrastructure');
    press('ArrowDown');
    expect(focusedText()).toBe('Quality Assurance');
    press('ArrowUp');
    expect(focusedText()).toBe('Infrastructure');
  });

  test('the right arrow opens a nested submenu too', async () => {
    const menu = createMenu({ opener, items: nested });
    await opened(menu);
    menuItems(menu)[1]!.focus();
    press('ArrowRight');
    await after(400);
    expect(focusedText()).toBe('Software');

    press('ArrowRight');
    await after(400);
    expect(openSubmenus()).toBe(2);
    expect(focusedText()).toBe('Frontend');
    press('ArrowDown');
    expect(focusedText()).toBe('Backend');
  });

  test('the left arrow closes a submenu and goes back to the item that opened it', async () => {
    const menu = createMenu({ opener, items: nested });
    await opened(menu);
    menuItems(menu)[1]!.focus();
    press('ArrowRight');
    await after(400);
    press('ArrowRight');
    await after(400);
    expect(openSubmenus()).toBe(2);

    press('ArrowLeft');
    await after(400);
    expect(openSubmenus()).toBe(1);
    expect(focusedText()).toBe('Software');

    press('ArrowLeft');
    await after(400);
    expect(openSubmenus()).toBe(0);
    expect(focusedText()).toBe('Engineering');
  });

  test('Escape in a submenu closes only that submenu', async () => {
    const menu = createMenu({ opener, items: nested });
    await opened(menu);
    menuItems(menu)[1]!.focus();
    press('ArrowRight');
    await after(400);

    press('Escape');
    await after(400);
    expect(openSubmenus()).toBe(0);
    expect(menu.isOpen()).toBe(true);
    expect(focusedText()).toBe('Engineering');
  });
});
