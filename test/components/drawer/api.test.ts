// test/components/drawer/api.test.ts
//
// The real drawer in a JSDOM document: creation options, variants and
// position, opening and closing with their events and callbacks, the headline,
// items with dividers, sections, icons, badges and disabled entries, the active
// destination, selection by click and keyboard, arrow-key movement, DOM order and
// destroy. accessibility.test.ts covers focus, inert and modal ownership, and
// expressive.test.ts the active indicator and ripples.
//
// This replaces test/components/drawer.test.ts, which asserted against a mock
// defined in its own file. The mock had drifted from the component: it expected
// tab and tablist roles the drawer replaced with navigation semantics.
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.FocusEvent = dom.window.FocusEvent;
g.CustomEvent = dom.window.CustomEvent;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = (id: number) => clearTimeout(id);

import createDrawer from '../../../src/components/drawer';
import type { DrawerConfig, DrawerItemConfig } from '../../../src/components/drawer';

const ITEMS = (): DrawerItemConfig[] => [
  { type: 'section', label: 'Mail' },
  { id: 'inbox', label: 'Inbox', icon: '<svg></svg>', badge: '24', active: true },
  { id: 'sent', label: 'Sent' },
  { type: 'divider' },
  { id: 'spam', label: 'Spam', disabled: true },
  { id: 'trash', label: 'Trash' },
];

let drawers: ReturnType<typeof createDrawer>[] = [];
const make = (config: DrawerConfig = {}) => {
  const drawer = createDrawer({ items: ITEMS(), ...config });
  document.body.appendChild(drawer.element);
  drawers.push(drawer);
  return drawer;
};
const items = (drawer: { element: HTMLElement }) =>
  Array.from(drawer.element.querySelectorAll<HTMLButtonElement>('.mtrl-drawer__item'));
const item = (drawer: { element: HTMLElement }, id: string) =>
  items(drawer).find((element) => element.dataset.id === id)!;
const key = (target: HTMLElement, name: string) =>
  target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));

beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => { drawers.forEach((drawer) => drawer.destroy()); drawers = []; });

describe('drawer creation', () => {
  test('defaults to a closed standard navigation drawer at the start', () => {
    const drawer = make();
    expect(drawer.element.tagName).toBe('ASIDE');
    expect(drawer.element.getAttribute('role')).toBe('navigation');
    expect(drawer.element.classList.contains('mtrl-drawer--standard')).toBe(true);
    expect(drawer.element.classList.contains('mtrl-drawer--start')).toBe(true);
    expect(drawer.isOpen()).toBe(false);
    expect(drawer.element.querySelector('.mtrl-drawer__scrim')).toBeNull();
    expect(drawer.element.style.getPropertyValue('--mtrl-drawer-width')).toBe('360px');
  });

  test('takes open, position, width, dense and a custom class from config', () => {
    const drawer = make({ open: true, position: 'end', width: '20rem', dense: true, class: 'extra' });
    expect(drawer.isOpen()).toBe(true);
    expect(drawer.element.classList.contains('mtrl-drawer--open')).toBe(true);
    expect(drawer.element.classList.contains('mtrl-drawer--end')).toBe(true);
    expect(drawer.element.classList.contains('mtrl-drawer--dense')).toBe(true);
    expect(drawer.element.classList.contains('mtrl-extra')).toBe(true);
    expect(drawer.element.style.getPropertyValue('--mtrl-drawer-width')).toBe('20rem');
    expect(make({ width: 280 }).element.style.getPropertyValue('--mtrl-drawer-width')).toBe('280px');
  });

  test('a modal drawer is a dialog with a scrim before its sheet', () => {
    const drawer = make({ variant: 'modal' });
    expect(drawer.element.getAttribute('role')).toBe('dialog');
    expect(drawer.element.getAttribute('aria-modal')).toBe('true');
    expect(drawer.element.classList.contains('mtrl-drawer--modal')).toBe(true);
    expect(Array.from(drawer.element.children).map((child) => child.className)).toEqual([
      'mtrl-drawer__scrim', 'mtrl-drawer__sheet',
    ]);
  });

  test('the sheet holds the headline before the items', () => {
    const drawer = make({ headline: 'Mail' });
    const sheet = drawer.element.querySelector('.mtrl-drawer__sheet')!;
    expect(Array.from(sheet.children).map((child) => child.className)).toEqual([
      'mtrl-drawer__headline', 'mtrl-drawer__items',
    ]);
  });

  test('ariaLabel names the drawer ahead of the headline', () => {
    const drawer = make({ headline: 'Mail', ariaLabel: 'Main navigation' });
    expect(drawer.element.getAttribute('aria-label')).toBe('Main navigation');
    drawer.setHeadline('Folders');
    expect(drawer.element.getAttribute('aria-label')).toBe('Main navigation');
  });
});

describe('drawer open and close', () => {
  test('open, close and toggle change the state and chain', () => {
    const drawer = make();
    expect(drawer.open()).toBe(drawer);
    expect(drawer.isOpen()).toBe(true);
    expect(drawer.close()).toBe(drawer);
    expect(drawer.isOpen()).toBe(false);
    expect(drawer.toggle()).toBe(drawer);
    expect(drawer.isOpen()).toBe(true);
    drawer.toggle();
    expect(drawer.isOpen()).toBe(false);
  });

  test('events and callbacks fire once per change', () => {
    const seen: string[] = [];
    const drawer = make({ onOpen: () => seen.push('onOpen'), onClose: () => seen.push('onClose') });
    drawer.on('open', () => seen.push('open'));
    drawer.on('close', () => seen.push('close'));
    drawer.open().open();
    drawer.close().close();
    expect(seen).toEqual(['open', 'onOpen', 'close', 'onClose']);
  });

  test('off removes a listener', () => {
    const seen: string[] = [];
    const drawer = make();
    const handler = () => seen.push('open');
    drawer.on('open', handler);
    drawer.open().close();
    drawer.off('open', handler);
    drawer.open();
    expect(seen).toEqual(['open']);
  });

  test('the scrim shows with a modal drawer and dismisses it on click', () => {
    const drawer = make({ variant: 'modal' });
    const scrim = drawer.element.querySelector<HTMLElement>('.mtrl-drawer__scrim')!;
    drawer.open();
    expect(scrim.classList.contains('mtrl-drawer__scrim--visible')).toBe(true);
    scrim.click();
    expect(drawer.isOpen()).toBe(false);
    expect(scrim.classList.contains('mtrl-drawer__scrim--visible')).toBe(false);
  });

  test('a modal that is not dismissible ignores the scrim', () => {
    const drawer = make({ variant: 'modal', dismissible: false });
    drawer.open();
    drawer.element.querySelector<HTMLElement>('.mtrl-drawer__scrim')!.click();
    expect(drawer.isOpen()).toBe(true);
  });

  test('Escape does not close a standard drawer', () => {
    const drawer = make({ open: true });
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(drawer.isOpen()).toBe(true);
  });
});

describe('drawer headline', () => {
  test('setHeadline updates, removes and restores the headline', () => {
    const drawer = make({ headline: 'Mail' });
    const headline = () => drawer.element.querySelector('.mtrl-drawer__headline');
    expect(drawer.getHeadline()).toBe('Mail');

    expect(drawer.setHeadline('Folders')).toBe(drawer);
    expect(headline()?.textContent).toBe('Folders');
    expect(drawer.getHeadline()).toBe('Folders');

    drawer.setHeadline('');
    expect(headline()).toBeNull();
    expect(drawer.element.getAttribute('aria-label')).toBe('Navigation');

    drawer.setHeadline('Labels');
    expect(headline()?.textContent).toBe('Labels');
    expect(drawer.element.querySelector('.mtrl-drawer__sheet')?.firstElementChild).toBe(headline());
  });
});

describe('drawer items', () => {
  test('renders sections, dividers and destinations in order', () => {
    const drawer = make();
    const container = drawer.element.querySelector('.mtrl-drawer__items')!;
    expect(Array.from(container.children).map((child) => child.className.split(' ')[0])).toEqual([
      'mtrl-drawer__section-label', 'mtrl-drawer__item', 'mtrl-drawer__item',
      'mtrl-drawer__divider', 'mtrl-drawer__item', 'mtrl-drawer__item',
    ]);
    expect(container.querySelector('.mtrl-drawer__section-label')?.textContent).toBe('Mail');
    expect(container.querySelector('.mtrl-drawer__divider')?.getAttribute('role')).toBe('separator');
  });

  test('a destination has indicator, decorative icon, label and badge in order', () => {
    const inbox = item(make(), 'inbox');
    // The ripple layer is covered by expressive.test.ts.
    expect(Array.from(inbox.children).map((child) => child.className).filter((name) => name !== 'mtrl-ripple')).toEqual([
      'mtrl-drawer__active-indicator', 'mtrl-drawer__item-icon', 'mtrl-drawer__item-label', 'mtrl-drawer__item-badge',
    ]);
    expect(inbox.querySelector('.mtrl-drawer__item-icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(inbox.querySelector('.mtrl-drawer__item-label')?.textContent).toBe('Inbox');
    expect(inbox.querySelector('.mtrl-drawer__item-badge')?.textContent).toBe('24');
  });

  test('a disabled destination is disabled and out of the tab order', () => {
    const spam = item(make(), 'spam');
    expect(spam.disabled).toBe(true);
    expect(spam.getAttribute('aria-disabled')).toBe('true');
    expect(spam.getAttribute('tabindex')).toBe('-1');
  });

  test('setItems replaces the destinations and getItems returns them', () => {
    const drawer = make();
    const next: DrawerItemConfig[] = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', active: true }];
    expect(drawer.setItems(next)).toBe(drawer);
    expect(items(drawer).map((element) => element.dataset.id)).toEqual(['a', 'b']);
    expect(drawer.getItems()).toEqual(next);
    expect(drawer.getActive()).toBe('b');
  });

  test('setItems without an active entry clears the active destination', () => {
    const drawer = make();
    drawer.setItems([{ id: 'a', label: 'A' }]);
    expect(drawer.getActive()).toBeNull();
    expect(drawer.element.querySelector('[aria-current]')).toBeNull();
  });

  test('setItems accepts an empty list and a list of only dividers and sections', () => {
    const drawer = make();
    drawer.setItems([]);
    expect(drawer.element.querySelector('.mtrl-drawer__items')?.children).toHaveLength(0);
    drawer.setItems([{ type: 'section', label: 'Empty' }, { type: 'divider' }]);
    expect(items(drawer)).toHaveLength(0);
    expect(drawer.getActive()).toBeNull();
  });
});

describe('drawer active destination', () => {
  test('starts from the active item and marks only it', () => {
    const drawer = make();
    expect(drawer.getActive()).toBe('inbox');
    expect(item(drawer, 'inbox').classList.contains('mtrl-drawer__item--active')).toBe(true);
    expect(items(drawer).filter((element) => element.hasAttribute('aria-current'))).toEqual([item(drawer, 'inbox')]);
  });

  test('setActive moves the mark and updates the items config', () => {
    const drawer = make();
    expect(drawer.setActive('sent')).toBe(drawer);
    expect(drawer.getActive()).toBe('sent');
    expect(item(drawer, 'sent').getAttribute('aria-current')).toBe('page');
    expect(item(drawer, 'inbox').hasAttribute('aria-current')).toBe(false);
    expect(item(drawer, 'inbox').classList.contains('mtrl-drawer__item--active')).toBe(false);
    expect(drawer.getItems().filter((entry) => entry.active).map((entry) => entry.id)).toEqual(['sent']);
  });

  test('no destination is active without an active item', () => {
    expect(make({ items: [{ id: 'a', label: 'A' }] }).getActive()).toBeNull();
  });
});

describe('drawer selection', () => {
  test('clicking a destination activates it and reports select', () => {
    const seen: { id: string; label: string; index: number }[] = [];
    const drawer = make({ onSelect: ({ id, label, index }) => seen.push({ id, label, index }) });
    drawer.on('select', ({ id }: { id: string }) => seen.push({ id, label: 'event', index: -1 }));
    item(drawer, 'trash').click();
    expect(drawer.getActive()).toBe('trash');
    expect(seen).toEqual([{ id: 'trash', label: 'event', index: -1 }, { id: 'trash', label: 'Trash', index: 3 }]);
  });

  test('a disabled destination cannot be selected', () => {
    const seen: string[] = [];
    const drawer = make({ onSelect: ({ id }) => seen.push(id) });
    item(drawer, 'spam').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    expect(seen).toEqual([]);
    expect(drawer.getActive()).toBe('inbox');
  });

  test('Enter and Space select the focused destination', () => {
    const seen: string[] = [];
    const drawer = make({ open: true, onSelect: ({ id }) => seen.push(id) });
    item(drawer, 'sent').focus();
    key(item(drawer, 'sent'), 'Enter');
    item(drawer, 'trash').focus();
    key(item(drawer, 'trash'), ' ');
    expect(seen).toEqual(['sent', 'trash']);
  });
});

describe('drawer keyboard movement', () => {
  test('arrows move focus between enabled destinations and wrap', () => {
    const drawer = make({ open: true });
    item(drawer, 'inbox').focus();
    key(item(drawer, 'inbox'), 'ArrowDown');
    expect(document.activeElement).toBe(item(drawer, 'sent'));
    key(item(drawer, 'sent'), 'ArrowDown');
    expect(document.activeElement).toBe(item(drawer, 'trash'));
    key(item(drawer, 'trash'), 'ArrowDown');
    expect(document.activeElement).toBe(item(drawer, 'inbox'));
    key(item(drawer, 'inbox'), 'ArrowUp');
    expect(document.activeElement).toBe(item(drawer, 'trash'));
  });

  test('Home and End jump to the first and last destination', () => {
    const drawer = make({ open: true });
    item(drawer, 'sent').focus();
    key(item(drawer, 'sent'), 'End');
    expect(document.activeElement).toBe(item(drawer, 'trash'));
    key(item(drawer, 'trash'), 'Home');
    expect(document.activeElement).toBe(item(drawer, 'inbox'));
  });
});

describe('drawer badges', () => {
  test('setBadge updates, adds and removes badges and keeps the items config', () => {
    const drawer = make();
    const badge = (id: string) => item(drawer, id).querySelector('.mtrl-drawer__item-badge');
    expect(drawer.setBadge('inbox', '25')).toBe(drawer);
    expect(badge('inbox')?.textContent).toBe('25');

    drawer.setBadge('sent', '1');
    expect(badge('sent')?.textContent).toBe('1');
    expect(item(drawer, 'sent').lastElementChild).toBe(badge('sent'));

    drawer.setBadge('inbox', '');
    expect(badge('inbox')).toBeNull();
    expect(drawer.getItems().find((entry) => entry.id === 'sent')?.badge).toBe('1');
    expect(drawer.getItems().find((entry) => entry.id === 'inbox')?.badge).toBe('');
  });

  test('setBadge ignores an unknown destination', () => {
    const drawer = make();
    drawer.setBadge('missing', '9');
    expect(drawer.element.querySelectorAll('.mtrl-drawer__item-badge')).toHaveLength(1);
  });
});

describe('drawer utilities and destroy', () => {
  test('addClass adds classes and chains', () => {
    const drawer = make();
    expect(drawer.addClass('one', 'two')).toBe(drawer);
    expect(drawer.element.classList.contains('one')).toBe(true);
    expect(drawer.element.classList.contains('two')).toBe(true);
  });

  test('destroy removes the drawer and later calls do nothing', () => {
    const drawer = make({ open: true });
    const seen: string[] = [];
    drawer.on('close', () => seen.push('close'));
    drawer.destroy();
    expect(drawer.element.isConnected).toBe(false);
    drawer.open();
    expect(drawer.isOpen()).toBe(false);
    expect(seen).toEqual([]);
  });
});
