// test/components/select/behaviour.test.ts
//
// The real select in a JSDOM document: its value and selected option, clearing,
// opening and closing and the events they report, choosing through the menu,
// replacing options, error and disabled state. select.test.ts beside this file
// covers choosing option data through the menu.
//
// This replaces test/components/select.test.ts, which asserted against a mock
// defined in its own file. Porting it found one defect: the open event was
// emitted only when the menu was opened from the keyboard, so opening by click
// or by open() reported nothing while close always fired.
//
// Deliberately not asserted, because each is open: the select exposes no
// combobox semantics (F18); setValue() selects an option disabled on its own and
// keeps the previous selection for a value no option carries, where tabs refuse
// the first and radios clear on the second.
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
  { id: 's', text: 'Small' },
  { id: 'm', text: 'Medium' },
  { id: 'l', text: 'Large' },
];

beforeEach(() => { document.body.innerHTML = ''; });

const mount = async (config: Record<string, unknown> = {}) => {
  const select = createSelect({ label: 'Size', options: OPTIONS(), ...config } as any);
  document.body.append(select.element);
  await wait(20);
  return select;
};
const inputOf = (select: { element: HTMLElement }) => select.element.querySelector('input')!;
const helper = (select: { element: HTMLElement }) => select.element.querySelector('.mtrl-textfield-helper');

describe('select', () => {
  test('its readonly input carries the name and shows the selected option', async () => {
    const select = await mount({ name: 'size', value: 'm' });
    const input = inputOf(select);
    expect(input.readOnly).toBe(true);
    expect(input.name).toBe('size');
    expect(input.value).toBe('Medium');
    expect(select.getValue()).toBe('m');
    expect(select.getSelectedOption()?.text).toBe('Medium');
  });

  test('setValue selects an option and shows its text', async () => {
    const select = await mount();
    select.setValue('l');
    expect(select.getValue()).toBe('l');
    expect(inputOf(select).value).toBe('Large');
  });

  test('clear, and setValue with null, undefined or an empty string, clear the selection', async () => {
    const select = await mount();
    for (const empty of [null, undefined, '']) {
      select.setValue('s');
      select.setValue(empty as any);
      expect(select.getValue()).toBeNull();
      expect(inputOf(select).value).toBe('');
    }
    select.setValue('m');
    select.clear();
    expect(select.getValue()).toBeNull();
  });

  test('open and close report themselves, whichever way the menu is opened', async () => {
    const select = await mount();
    const opened = mock(() => {});
    const closed = mock(() => {});
    select.on('open', opened);
    select.on('close', closed);

    select.open();
    await wait(50);
    expect(select.isOpen()).toBe(true);
    select.close();
    await wait(300);
    expect(select.isOpen()).toBe(false);

    inputOf(select).dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await wait(50);
    expect(select.isOpen()).toBe(true);
    select.close();
    await wait(300);

    expect(opened).toHaveBeenCalledTimes(2);
    expect(closed).toHaveBeenCalledTimes(2);
  });

  test('choosing a menu item selects it and emits change to on() and config.on', async () => {
    const configured = mock((_event: { value: string }) => {});
    const select = await mount({ on: { change: configured } });
    const changes = mock((_event: { value: string }) => {});
    select.on('change', changes);
    select.open();
    await wait(50);
    const medium = [...document.querySelectorAll<HTMLElement>('[role="menuitem"], [role="option"]')]
      .find((item) => item.textContent?.trim() === 'Medium')!;
    medium.click();
    await wait(30);
    expect(select.getValue()).toBe('m');
    expect(changes).toHaveBeenCalledTimes(1);
    expect(changes.mock.calls[0][0].value).toBe('m');
    expect(configured).toHaveBeenCalledTimes(1);
  });

  test('setOptions replaces the options and clears a selection they no longer contain', async () => {
    const select = await mount({ value: 'm' });
    select.setOptions([{ id: 'xl', text: 'Extra large' }]);
    expect(select.getOptions().map((option) => option.id)).toEqual(['xl']);
    expect(select.getValue()).toBeNull();
  });

  test('setError shows its message and clearError restores the helper text', async () => {
    const select = await mount({ supportingText: 'Pick one' });
    select.setError(true, 'Required');
    expect(select.element.classList.contains('mtrl-textfield--error')).toBe(true);
    expect(helper(select)?.textContent).toBe('Required');
    select.clearError();
    expect(select.element.classList.contains('mtrl-textfield--error')).toBe(false);
    expect(helper(select)?.textContent).toBe('Pick one');
  });

  test('a disabled select disables its input and does not open', async () => {
    const select = await mount();
    select.disable();
    expect(inputOf(select).disabled).toBe(true);
    select.open();
    await wait(50);
    expect(select.isOpen()).toBe(false);
    select.enable();
    expect(inputOf(select).disabled).toBe(false);
  });

  test('variant follows config', async () => {
    const select = await mount({ variant: 'outlined' });
    expect(select.element.classList.contains('mtrl-textfield--outlined')).toBe(true);
  });

  test('destroy removes the select and its menu', async () => {
    const select = await mount();
    select.open();
    await wait(50);
    select.destroy();
    await wait(20);
    expect(document.body.contains(select.element)).toBe(false);
    expect(document.querySelector('.mtrl-menu')).toBeNull();
  });
});
