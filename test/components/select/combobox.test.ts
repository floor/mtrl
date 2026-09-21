// test/components/select/combobox.test.ts
//
// A select with flat options is a WAI-ARIA select-only combobox (APG,
// "Select-Only Combobox"). F18: its open state sat on a role-less wrapper div
// that never takes focus, the popup was announced as a menu of menuitems using
// aria-selected, and opening moved focus into it. Now the input is the
// combobox and keeps focus, the popup is a listbox of options, and the input
// names the active option with aria-activedescendant while it owns the keys.
//
// A select whose options have submenus cannot be a listbox and stays a menu
// button; the last test pins that.
import { describe, test, expect, beforeEach, mock } from 'bun:test';
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
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import createSelect from '../../../src/components/select';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const OPTIONS = () => [
  { id: 'xs', text: 'Extra small' },
  { id: 's', text: 'Small' },
  { id: 'm', text: 'Medium' },
  { id: 'l', text: 'Large', disabled: true },
  { id: 'xl', text: 'Extra large' },
];

beforeEach(() => { document.body.innerHTML = ''; });

const mount = async (config: Record<string, unknown> = {}) => {
  const select = createSelect({ label: 'Size', options: OPTIONS(), ...config } as any);
  document.body.append(select.element);
  await wait(20);
  const input = select.element.querySelector('input')!;
  input.focus();
  return { select, input };
};
const press = async (input: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
  const event = new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  input.dispatchEvent(event);
  await wait(60);
  return event;
};
const settle = () => wait(400);
const activeText = (input: HTMLElement) => {
  const id = input.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id)?.textContent?.trim() : undefined;
};

describe('select as a combobox', () => {
  test('the input is the combobox; the wrapper carries no popup state of its own', async () => {
    const { select, input } = await mount();
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-haspopup')).toBe('listbox');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.labels?.[0]?.textContent).toBe('Size');
    expect(select.element.hasAttribute('aria-expanded')).toBe(false);
    expect(select.element.hasAttribute('aria-haspopup')).toBe(false);
  });

  test('opening exposes a listbox of options and keeps focus on the input', async () => {
    const { input } = await mount({ value: 'm' });
    await press(input, 'ArrowDown');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    const listbox = document.getElementById(input.getAttribute('aria-controls')!)!;
    expect(listbox.getAttribute('role')).toBe('listbox');
    const options = [...listbox.querySelectorAll('[role="option"]')];
    expect(options).toHaveLength(5);
    expect(new Set(options.map((option) => option.id)).size).toBe(5);
    expect(document.querySelector('[role="menu"], [role="menuitem"]')).toBeNull();
    expect(document.activeElement).toBe(input);
    // the selected option is where the active option starts
    expect(activeText(input)).toBe('Medium');
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)?.getAttribute('aria-selected')).toBe('true');
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)?.classList.contains('mtrl-menu__item--active')).toBe(true);
  });

  test('arrows move the active option without wrapping, skipping disabled options', async () => {
    const { input } = await mount({ value: 'm' });
    await press(input, 'ArrowDown');
    await press(input, 'ArrowDown');
    expect(activeText(input)).toBe('Extra large');
    await press(input, 'ArrowDown');
    expect(activeText(input)).toBe('Extra large');
    await press(input, 'ArrowUp');
    expect(activeText(input)).toBe('Medium');
    expect(document.activeElement).toBe(input);
  });

  test('Home, End, PageUp and PageDown reach the ends', async () => {
    const { input } = await mount({ value: 's' });
    await press(input, 'ArrowDown');
    await press(input, 'End');
    expect(activeText(input)).toBe('Extra large');
    await press(input, 'Home');
    expect(activeText(input)).toBe('Extra small');
    await press(input, 'PageDown');
    expect(activeText(input)).toBe('Extra large');
    await press(input, 'PageUp');
    expect(activeText(input)).toBe('Extra small');
  });

  test('Home and End open a closed select at the first or last option', async () => {
    const first = await mount({ value: 'm' });
    await press(first.input, 'Home');
    expect(first.input.getAttribute('aria-expanded')).toBe('true');
    expect(activeText(first.input)).toBe('Extra small');

    document.body.innerHTML = '';
    const last = await mount({ value: 'm' });
    await press(last.input, 'End');
    expect(activeText(last.input)).toBe('Extra large');
  });

  test('Enter chooses the active option, reports change and closes, focus staying put', async () => {
    const { select, input } = await mount({ value: 's' });
    const changes = mock((_event: { value: string }) => {});
    select.on('change', changes);
    await press(input, 'Enter');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    await press(input, 'ArrowDown');
    await press(input, 'Enter');
    await settle();
    expect(select.getValue()).toBe('m');
    expect(input.value).toBe('Medium');
    expect(changes).toHaveBeenCalledTimes(1);
    expect(select.isOpen()).toBe(false);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  test('Space opens and chooses; Alt+ArrowDown opens and Alt+ArrowUp chooses', async () => {
    const { select, input } = await mount({ value: 'xs' });
    await press(input, ' ');
    expect(select.isOpen()).toBe(true);
    await press(input, 'ArrowDown');
    await press(input, ' ');
    await settle();
    expect(select.getValue()).toBe('s');

    await press(input, 'ArrowDown', { altKey: true });
    expect(select.isOpen()).toBe(true);
    expect(activeText(input)).toBe('Small');
    await press(input, 'ArrowDown');
    await press(input, 'ArrowUp', { altKey: true });
    await settle();
    expect(select.getValue()).toBe('m');
    expect(select.isOpen()).toBe(false);
  });

  test('Escape closes without choosing', async () => {
    const { select, input } = await mount({ value: 's' });
    await press(input, 'ArrowDown');
    await press(input, 'ArrowDown');
    const escape = await press(input, 'Escape');
    await settle();
    expect(escape.defaultPrevented).toBe(true);
    expect(select.isOpen()).toBe(false);
    expect(select.getValue()).toBe('s');
  });

  test('Tab chooses the active option and lets focus move on', async () => {
    const { select, input } = await mount({ value: 's' });
    await press(input, 'ArrowDown');
    await press(input, 'ArrowDown');
    const tab = await press(input, 'Tab');
    await settle();
    expect(tab.defaultPrevented).toBe(false);
    expect(select.getValue()).toBe('m');
    expect(select.isOpen()).toBe(false);
  });

  test('typing moves to the next option starting with the typed text', async () => {
    const { input } = await mount({ value: 'xs' });
    await press(input, 'ArrowDown');
    await press(input, 'm');
    expect(activeText(input)).toBe('Medium');
    await wait(600);
    await press(input, 'e');
    expect(activeText(input)).toBe('Extra large');
    await wait(600);
    await press(input, 'e');
    expect(activeText(input)).toBe('Extra small');
  });

  test('pressing the field toggles the listbox, and pressing an option chooses it without taking focus', async () => {
    const { select, input } = await mount();
    input.blur();
    const fieldDown = new dom.window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    select.element.dispatchEvent(fieldDown);
    expect(fieldDown.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
    select.element.click();
    await wait(60);
    expect(select.isOpen()).toBe(true);
    const small = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((option) => option.textContent?.trim() === 'Small')!;
    const down = new dom.window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    small.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    small.click();
    await settle();
    expect(select.getValue()).toBe('s');
    expect(select.isOpen()).toBe(false);
    expect(document.activeElement).toBe(input);

    select.element.click();
    await wait(60);
    select.element.click();
    await settle();
    expect(select.isOpen()).toBe(false);
  });

  test('focus leaving the select closes the listbox without choosing', async () => {
    const { select, input } = await mount({ value: 's' });
    const outside = document.createElement('button');
    document.body.append(outside);
    await press(input, 'ArrowDown');
    await press(input, 'ArrowDown');
    outside.focus();
    await settle();
    expect(select.isOpen()).toBe(false);
    expect(select.getValue()).toBe('s');
  });

  test('a disabled select neither opens nor reacts to keys', async () => {
    const { select, input } = await mount({ disabled: true });
    await press(input, 'ArrowDown');
    select.element.click();
    await wait(60);
    expect(select.isOpen()).toBe(false);
  });

  test('a select with submenu options stays a menu button', async () => {
    const { select, input } = await mount({
      options: [{ id: 'a', text: 'Animals', hasSubmenu: true, submenu: [{ id: 'cat', text: 'Cat' }] }, { id: 'b', text: 'Birds' }],
    });
    expect(input.hasAttribute('role')).toBe(false);
    select.open();
    await wait(60);
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    expect(document.querySelector('[role="listbox"]')).toBeNull();
  });
});
