// test/components/textfield/textfield.test.ts
//
// The real textfield in a JSDOM document: its labelled input and attributes,
// value and events, variant and density, supporting text and error state, the
// icon, prefix and suffix slots, and disabled state. The spawned lifecycle
// fixture beside this file covers observers and teardown.
//
// This replaces test/components/textfield.test.ts, which asserted against a
// mock defined in its own file. Porting it found two defects fixed here:
// readonly was documented and never applied to the input, and setError(false)
// left the error message on screen as ordinary helper text instead of restoring
// what it had replaced.
//
// Deliberately not asserted, because each is open: the input is never marked
// aria-invalid nor tied to its helper by aria-describedby (F8); and the icon,
// prefix and suffix setters do nothing on a field created without that slot, or
// after the slot is removed.
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
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

import createTextfield from '../../../src/components/textfield';

const ICON = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

beforeEach(() => { document.body.innerHTML = ''; });

const mount = (config: Parameters<typeof createTextfield>[0] = {}) => {
  const field = createTextfield(config);
  document.body.append(field.element);
  return field;
};
const helper = (field: { element: HTMLElement }) => field.element.querySelector('.mtrl-textfield-helper');
const type = (field: { input: HTMLInputElement | HTMLTextAreaElement }, text: string) => {
  field.input.value = text;
  field.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
};

describe('textfield', () => {
  test('its label is associated with the input', () => {
    const field = mount({ label: 'Email' });
    const label = field.element.querySelector('label')!;
    expect(label.textContent).toBe('Email');
    expect(field.input.id).not.toBe('');
    expect(label.htmlFor).toBe(field.input.id);
  });

  test('form attributes from config reach the input, including readonly', () => {
    const field = mount({ label: 'Email', name: 'email', type: 'email', required: true, maxLength: 40, placeholder: 'you@example.com', readonly: true });
    const input = field.input as HTMLInputElement;
    expect([input.name, input.type, input.required, input.maxLength, input.placeholder]).toEqual(['email', 'email', true, 40, 'you@example.com']);
    expect(input.readOnly).toBe(true);
    expect(mount({ label: 'x' }).input.readOnly).toBe(false);
  });

  test('a multiline field is a textarea', () => {
    expect(mount({ label: 'Notes', type: 'multiline' }).input.tagName).toBe('TEXTAREA');
  });

  test('typing updates the value and emits input; setValue updates the input', () => {
    const field = mount({ label: 'Name' });
    const inputs = mock((_event: unknown) => {});
    field.on('input', inputs);
    type(field, 'Ada');
    expect(field.getValue()).toBe('Ada');
    expect(inputs).toHaveBeenCalledTimes(1);
    field.setValue('Grace');
    expect(field.input.value).toBe('Grace');
  });

  test('an empty field is marked empty, and a value clears the mark', () => {
    const field = mount({ label: 'Name' });
    expect(field.element.classList.contains('mtrl-textfield--empty')).toBe(true);
    type(field, 'x');
    expect(field.element.classList.contains('mtrl-textfield--empty')).toBe(false);
  });

  test('setLabel replaces the label', () => {
    const field = mount({ label: 'Email' });
    field.setLabel('Work email');
    expect(field.getLabel()).toBe('Work email');
    expect(field.element.querySelector('label')?.textContent).toBe('Work email');
  });

  test('filled by default, outlined by config or setVariant', () => {
    const field = mount({ label: 'x' });
    expect(field.getVariant()).toBe('filled');
    expect(field.element.classList.contains('mtrl-textfield--filled')).toBe(true);
    field.setVariant('outlined');
    expect(field.element.classList.contains('mtrl-textfield--outlined')).toBe(true);
    expect(field.element.classList.contains('mtrl-textfield--filled')).toBe(false);
    expect(mount({ label: 'x', variant: 'outlined' }).getVariant()).toBe('outlined');
    expect(field.getDensity()).toBe('default');
  });

  test('setAttribute, getAttribute and removeAttribute act on the input', () => {
    const field = mount({ label: 'x' });
    field.setAttribute('autocomplete', 'email');
    expect(field.input.getAttribute('autocomplete')).toBe('email');
    expect(field.getAttribute('autocomplete')).toBe('email');
    field.removeAttribute('autocomplete');
    expect(field.input.hasAttribute('autocomplete')).toBe(false);
  });

  test('supporting text from config, set later, and removed', () => {
    expect(helper(mount({ label: 'x', supportingText: 'We never share it' }))?.textContent).toBe('We never share it');
    const field = mount({ label: 'x' });
    field.setSupportingText('Helper');
    expect(helper(field)?.textContent).toBe('Helper');
    field.removeSupportingText();
    expect(helper(field)).toBeNull();
  });

  test('setError shows its message as an error, and ending it restores the helper text', () => {
    const field = mount({ label: 'Email', supportingText: 'We never share it' });
    field.setError(true, 'Invalid email');
    expect(field.isError()).toBe(true);
    expect(field.element.classList.contains('mtrl-textfield--error')).toBe(true);
    expect(helper(field)?.textContent).toBe('Invalid email');
    expect(helper(field)?.classList.contains('mtrl-textfield-helper--error')).toBe(true);

    field.setError(false);
    expect(field.isError()).toBe(false);
    expect(field.element.classList.contains('mtrl-textfield--error')).toBe(false);
    expect(helper(field)?.textContent).toBe('We never share it');
    expect(helper(field)?.classList.contains('mtrl-textfield-helper--error')).toBe(false);
  });

  test('ending an error on a field that had no helper text removes the message', () => {
    const field = mount({ label: 'Email' });
    field.setError(true, 'Invalid email');
    field.setError(false);
    expect(helper(field)?.textContent ?? '').toBe('');
  });

  test('an error from config is applied', () => {
    const field = mount({ label: 'x', error: true, supportingText: 'Required' });
    expect(field.isError()).toBe(true);
    expect(field.element.classList.contains('mtrl-textfield--error')).toBe(true);
  });

  test('icon, prefix and suffix slots from config render, and can be removed', () => {
    const field = mount({ label: 'Price', leadingIcon: ICON, trailingIcon: ICON, prefixText: '$', suffixText: 'kg' });
    const slot = (name: string) => field.element.querySelector(`.mtrl-textfield-${name}`);
    expect(slot('leading-icon')).not.toBeNull();
    expect(slot('trailing-icon')).not.toBeNull();
    expect(slot('prefix')?.textContent).toBe('$');
    expect(slot('suffix')?.textContent).toBe('kg');
    expect(field.element.classList.contains('mtrl-textfield--with-leading-icon')).toBe(true);

    field.setPrefixText('€');
    expect(slot('prefix')?.textContent).toBe('€');

    field.removeLeadingIcon();
    field.removeTrailingIcon();
    field.removePrefixText();
    field.removeSuffixText();
    expect([slot('leading-icon'), slot('trailing-icon'), slot('prefix'), slot('suffix')]).toEqual([null, null, null, null]);
    expect(field.element.classList.contains('mtrl-textfield--with-leading-icon')).toBe(false);
  });

  test('disabled from config, and disable and enable, reach the input', () => {
    expect(mount({ label: 'x', disabled: true }).input.disabled).toBe(true);
    const field = mount({ label: 'x' });
    field.disable();
    expect(field.input.disabled).toBe(true);
    expect(field.element.classList.contains('mtrl-textfield--disabled')).toBe(true);
    field.enable();
    expect(field.input.disabled).toBe(false);
  });

  test('off() removes a handler', () => {
    const field = mount({ label: 'x' });
    const inputs = mock(() => {});
    field.on('input', inputs);
    field.off('input', inputs);
    type(field, 'z');
    expect(inputs).not.toHaveBeenCalled();
  });

  test('destroy removes the element', () => {
    const field = mount({ label: 'x' });
    field.destroy();
    expect(document.body.contains(field.element)).toBe(false);
  });
});
